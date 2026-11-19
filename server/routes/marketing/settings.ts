import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { requireAdmin, requireTenantRole } from "../../lib/adminAuth";
import { formatZodError } from "../../lib/validation";

async function ensurePlatformSettingsRow() {
  return prisma.platformMarketingSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export const getPlatformSettings: RequestHandler = [requireAdmin, async (_req, res) => {
  try {
    res.json({ success: true, data: await ensurePlatformSettingsRow() });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load platform settings" });
  }
}] as any;

const platformSchema = z.object({ automationEnabled: z.boolean() });

export const updatePlatformSettings: RequestHandler = [requireAdmin, async (req, res) => {
  const parsed = platformSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    await ensurePlatformSettingsRow();
    const settings = await prisma.platformMarketingSettings.update({ where: { id: 1 }, data: parsed.data });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update platform settings" });
  }
}] as any;

async function ensureTenantSettingsRow(tenantId: string) {
  return prisma.tenantMarketingSettings.upsert({ where: { tenantId }, update: {}, create: { tenantId } });
}

export const getTenantSettings: RequestHandler = [requireTenantRole("viewer"), async (req, res) => {
  try {
    res.json({ success: true, data: await ensureTenantSettingsRow(req.params.tenantId) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load tenant marketing settings" });
  }
}] as any;

const tenantSettingsSchema = z.object({
  automationEnabled: z.boolean().optional(),
  maxAiCostPerDayUsd: z.number().min(0).max(1000).optional(),
  maxAiCostPerMonthUsd: z.number().min(0).max(10000).optional(),
  maxImageGensPerDay: z.number().int().min(0).max(500).optional(),
  maxImageGensPerMonth: z.number().int().min(0).max(5000).optional(),
  maxPostsPerDay: z.number().int().min(0).max(50).optional(),
  maxPostsPerMonth: z.number().int().min(0).max(1000).optional(),
});

export const updateTenantSettings: RequestHandler = [requireTenantRole("admin"), async (req, res) => {
  const parsed = tenantSettingsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    await ensureTenantSettingsRow(req.params.tenantId);
    const settings = await prisma.tenantMarketingSettings.update({ where: { tenantId: req.params.tenantId }, data: parsed.data });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update tenant marketing settings" });
  }
}] as any;
