import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { requireTenantRole } from "../../lib/adminAuth";
import { formatZodError } from "../../lib/validation";

const projectSchema = z.object({
  name: z.string().min(1).max(150),
  website: z.string().url(),
  websiteVerified: z.boolean().optional(),
  description: z.string().min(1).max(2000),
  targetAudience: z.string().max(1000).optional(),
  brandVoice: z.string().max(1000).optional(),
  goals: z.string().max(1000).optional(),
  contentPillars: z.array(z.string()).default([]),
  preferredPlatforms: z
    .array(z.enum(["facebook", "instagram", "linkedin", "x", "threads", "tiktok", "youtube", "pinterest", "bluesky", "mastodon", "google_business"]))
    .default([]),
  ctaDefault: z.string().max(300).optional(),
  autonomyMode: z.enum(["AUTONOMOUS", "APPROVAL", "MANUAL"]).default("APPROVAL"),
  allowedContentTypes: z
    .array(z.enum(["educational", "service_promotion", "portfolio", "blog_promotion", "company_update", "engagement", "lead_generation"]))
    .default([]),
  maxPostsPerDay: z.number().int().min(0).max(20).default(1),
});

export const listMarketingProjects: RequestHandler = [requireTenantRole("viewer"), async (req, res) => {
  try {
    const projects = await prisma.marketingProject.findMany({ where: { tenantId: req.params.tenantId }, orderBy: { createdAt: "asc" } });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load marketing projects" });
  }
}] as any;

export const createMarketingProject: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = projectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  }
  try {
    const project = await prisma.marketingProject.create({
      data: {
        tenantId: req.params.tenantId,
        name: parsed.data.name!,
        website: parsed.data.website!,
        description: parsed.data.description!,
        websiteVerified: parsed.data.websiteVerified,
        targetAudience: parsed.data.targetAudience,
        brandVoice: parsed.data.brandVoice,
        goals: parsed.data.goals,
        contentPillars: parsed.data.contentPillars,
        preferredPlatforms: parsed.data.preferredPlatforms,
        ctaDefault: parsed.data.ctaDefault,
        autonomyMode: parsed.data.autonomyMode,
        allowedContentTypes: parsed.data.allowedContentTypes,
        maxPostsPerDay: parsed.data.maxPostsPerDay,
      },
    });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create marketing project (name may already exist for this tenant)" });
  }
}] as any;

export const updateMarketingProject: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = projectSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  }
  try {
    const existing = await prisma.marketingProject.findFirst({ where: { id: req.params.projectId, tenantId: req.params.tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: "Project not found for this tenant" });
    const project = await prisma.marketingProject.update({ where: { id: req.params.projectId }, data: parsed.data });
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update project" });
  }
}] as any;
