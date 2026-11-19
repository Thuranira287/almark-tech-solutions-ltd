import { prisma } from "../../db";
import { sanitizeDeep } from "./sanitizer";

export interface MarketingContext {
  tenant: { name: string; isPlatformOwner: boolean };
  project: {
    name: string;
    publicWebsite: string;
    publicDescription: string;
    targetAudience: string | null;
    brandVoice: string | null;
    goals: string | null;
    contentPillars: string[];
    preferredPlatforms: string[];
    ctaDefault: string | null;
  };
  publicServices: Array<{ name: string; category: string; description: string; priceRange: string }>;
  publicPortfolio: Array<{ name: string; tagline: string; description: string; url?: string }>;
  approvedTestimonials: Array<{ rating: number; message: string; company: string | null }>;
  strategy: {
    version: number;
    objectives: string[];
    audiences: string[];
    contentPillars: string[];
    campaignThemes: string[];
    ctaStrategy: string | null;
  } | null;
  analytics: {
    aggregatedMetricsOnly: true;
    dateRange: { start: string; end: string } | null;
    metrics: Array<{ platform: string | null; metricName: string; value: number | null; unavailable: boolean }>;
  };
}

export async function buildMarketingContext(params: {
  tenantId: string;
  projectId: string;
  publicPortfolio?: MarketingContext["publicPortfolio"];
  metricsWindow?: { start: Date; end: Date };
}): Promise<MarketingContext> {
  const tenant = await prisma.tenant.findUniqueOrThrow({
    where: { id: params.tenantId },
    select: { name: true, isPlatformOwner: true },
  });

  const project = await prisma.marketingProject.findFirstOrThrow({
    where: { id: params.projectId, tenantId: params.tenantId },
    select: {
      name: true,
      website: true,
      websiteVerified: true,
      description: true,
      targetAudience: true,
      brandVoice: true,
      goals: true,
      contentPillars: true,
      preferredPlatforms: true,
      ctaDefault: true,
    },
  });

  const services = tenant.isPlatformOwner
    ? await prisma.service.findMany({
        where: { active: true },
        select: { name: true, category: true, description: true, priceRange: true },
        orderBy: { category: "asc" },
      })
    : [];

  const latestStrategy = await prisma.marketingStrategy.findFirst({
    where: { tenantId: params.tenantId, projectId: params.projectId },
    orderBy: { version: "desc" },
    select: {
      version: true,
      objectives: true,
      audiences: true,
      contentPillars: true,
      campaignThemes: true,
      ctaStrategy: true,
    },
  });

  const approvedTestimonials = tenant.isPlatformOwner
    ? await prisma.testimonial.findMany({
        where: { status: "approved" },
        select: { rating: true, message: true, company: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  let metrics: MarketingContext["analytics"]["metrics"] = [];
  if (params.metricsWindow) {
    metrics = await prisma.marketingMetric.findMany({
      where: {
        tenantId: params.tenantId,
        projectId: params.projectId,
        periodStart: { gte: params.metricsWindow.start },
        periodEnd: { lte: params.metricsWindow.end },
      },
      select: { platform: true, metricName: true, value: true, unavailable: true },
    });
  }

  const context: MarketingContext = {
    tenant: { name: tenant.name, isPlatformOwner: tenant.isPlatformOwner },
    project: {
      name: project.name,
      publicWebsite: project.websiteVerified ? project.website : "(unverified — do not reference this URL directly)",
      publicDescription: project.description,
      targetAudience: project.targetAudience,
      brandVoice: project.brandVoice,
      goals: project.goals,
      contentPillars: project.contentPillars,
      preferredPlatforms: project.preferredPlatforms,
      ctaDefault: project.ctaDefault,
    },
    publicServices: services,
    publicPortfolio: params.publicPortfolio || [],
    approvedTestimonials,
    strategy: latestStrategy
      ? {
          version: latestStrategy.version,
          objectives: latestStrategy.objectives,
          audiences: latestStrategy.audiences,
          contentPillars: latestStrategy.contentPillars,
          campaignThemes: latestStrategy.campaignThemes,
          ctaStrategy: latestStrategy.ctaStrategy,
        }
      : null,
    analytics: {
      aggregatedMetricsOnly: true,
      dateRange: params.metricsWindow
        ? { start: params.metricsWindow.start.toISOString(), end: params.metricsWindow.end.toISOString() }
        : null,
      metrics,
    },
  };

  return sanitizeDeep(context);
}
