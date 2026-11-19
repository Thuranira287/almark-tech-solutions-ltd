import { prisma } from "../../db";

export class BudgetExceededError extends Error {}
export class AutomationDisabledError extends Error {}

async function getPlatformSettings() {
  const settings = await prisma.platformMarketingSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new AutomationDisabledError("Platform marketing settings row does not exist — automation is off by default");
  return settings;
}

async function getTenantSettings(tenantId: string) {
  const settings = await prisma.tenantMarketingSettings.findUnique({ where: { tenantId } });
  if (!settings) throw new AutomationDisabledError("This tenant has no marketing settings row yet — automation is off by default");
  return settings;
}

export async function assertAutomationEnabled(tenantId: string): Promise<void> {
  const [platform, tenant] = await Promise.all([getPlatformSettings(), getTenantSettings(tenantId)]);
  if (!platform.automationEnabled) {
    throw new AutomationDisabledError("Marketing automation is currently disabled platform-wide (kill switch is off)");
  }
  if (!tenant.automationEnabled) {
    throw new AutomationDisabledError("Marketing automation is currently disabled for this tenant");
  }
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function assertWithinAiCostBudget(tenantId: string): Promise<void> {
  const settings = await getTenantSettings(tenantId);
  const now = new Date();

  const [dayTotal, monthTotal] = await Promise.all([
    prisma.aIActionLog.aggregate({
      where: { tenantId, createdAt: { gte: startOfDay(now) }, estimatedCostUsd: { not: null } },
      _sum: { estimatedCostUsd: true },
    }),
    prisma.aIActionLog.aggregate({
      where: { tenantId, createdAt: { gte: startOfMonth(now) }, estimatedCostUsd: { not: null } },
      _sum: { estimatedCostUsd: true },
    }),
  ]);

  const daySpend = dayTotal._sum.estimatedCostUsd || 0;
  const monthSpend = monthTotal._sum.estimatedCostUsd || 0;

  if (daySpend >= settings.maxAiCostPerDayUsd) {
    throw new BudgetExceededError(`Daily AI cost cap reached ($${daySpend.toFixed(2)} / $${settings.maxAiCostPerDayUsd})`);
  }
  if (monthSpend >= settings.maxAiCostPerMonthUsd) {
    throw new BudgetExceededError(`Monthly AI cost cap reached ($${monthSpend.toFixed(2)} / $${settings.maxAiCostPerMonthUsd})`);
  }
}

export async function assertWithinImageGenBudget(tenantId: string): Promise<void> {
  const settings = await getTenantSettings(tenantId);
  const now = new Date();

  const [dayCount, monthCount] = await Promise.all([
    prisma.mediaAsset.count({ where: { tenantId, createdAt: { gte: startOfDay(now) } } }),
    prisma.mediaAsset.count({ where: { tenantId, createdAt: { gte: startOfMonth(now) } } }),
  ]);

  if (dayCount >= settings.maxImageGensPerDay) {
    throw new BudgetExceededError(`Daily image generation cap reached (${dayCount} / ${settings.maxImageGensPerDay})`);
  }
  if (monthCount >= settings.maxImageGensPerMonth) {
    throw new BudgetExceededError(`Monthly image generation cap reached (${monthCount} / ${settings.maxImageGensPerMonth})`);
  }
}

export async function assertWithinPostingLimit(tenantId: string, projectId: string): Promise<void> {
  const [settings, project] = await Promise.all([
    getTenantSettings(tenantId),
    prisma.marketingProject.findUniqueOrThrow({ where: { id: projectId }, select: { maxPostsPerDay: true } }),
  ]);

  const now = new Date();
  const [todayCount, monthCount] = await Promise.all([
    prisma.scheduledPost.count({
      where: { tenantId, projectId, scheduledFor: { gte: startOfDay(now) }, status: { in: ["scheduled", "publishing", "published"] } },
    }),
    prisma.scheduledPost.count({
      where: { tenantId, scheduledFor: { gte: startOfMonth(now) }, status: { in: ["scheduled", "publishing", "published"] } },
    }),
  ]);

  const projectLimit = Math.min(project.maxPostsPerDay, settings.maxPostsPerDay);
  if (todayCount >= projectLimit) {
    throw new BudgetExceededError(`Daily posting limit reached for this project (${todayCount} / ${projectLimit})`);
  }
  if (monthCount >= settings.maxPostsPerMonth) {
    throw new BudgetExceededError(`Monthly posting limit reached for this tenant (${monthCount} / ${settings.maxPostsPerMonth})`);
  }
}
