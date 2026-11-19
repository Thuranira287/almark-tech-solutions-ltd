import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { requireTenantRole, getSessionUser } from "../../lib/adminAuth";
import { formatZodError } from "../../lib/validation";
import { draftContent, approveContent, rejectContent, generateAndStoreImage, scheduleContent } from "../../lib/marketing/agent";
import { logger } from "../../lib/logger";

const draftSchema = z.object({
  projectId: z.string().min(1),
  contentType: z.enum(["educational", "service_promotion", "portfolio", "blog_promotion", "company_update", "engagement", "lead_generation"]),
  brief: z.string().min(5).max(2000),
});

export const createDraft: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = draftSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const { projectId, contentType, brief } = parsed.data;
    const outcome = await draftContent({ tenantId: req.params.tenantId, projectId: projectId!, contentType: contentType!, brief: brief! });
    if (outcome.status === "blocked") {
      return res.status(422).json({ success: false, message: outcome.reason, validationIssues: outcome.validationIssues });
    }
    res.json({ success: true, data: { contentId: outcome.contentId } });
  } catch (error) {
    logger.error("[MARKETING] createDraft error:", error);
    res.status(500).json({ success: false, message: "Failed to generate draft content" });
  }
}] as any;

export const listContent: RequestHandler = [requireTenantRole("viewer"), async (req, res) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const content = await prisma.marketingContent.findMany({
      where: { tenantId: req.params.tenantId, ...(projectId ? { projectId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load content" });
  }
}] as any;

export const approveContentRoute: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const outcome = await approveContent(req.params.tenantId, req.params.contentId, getSessionUser(req).id);
  if (!outcome.ok) return res.status(404).json({ success: false, message: outcome.reason || "Content not found" });
  res.json({ success: true });
}] as any;

const rejectSchema = z.object({ reason: z.string().min(1).max(500) });

export const rejectContentRoute: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "A rejection reason is required" });
  const outcome = await rejectContent(req.params.tenantId, req.params.contentId, getSessionUser(req).id, parsed.data.reason);
  if (!outcome.ok) return res.status(404).json({ success: false, message: "Content not found" });
  res.json({ success: true });
}] as any;

const imageSchema = z.object({ prompt: z.string().min(3).max(1000), altText: z.string().max(300).optional() });

export const generateImageRoute: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = imageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const content = await prisma.marketingContent.findFirst({ where: { id: req.params.contentId, tenantId: req.params.tenantId } });
    if (!content) return res.status(404).json({ success: false, message: "Content not found for this tenant" });
    const result = await generateAndStoreImage({
      tenantId: req.params.tenantId,
      projectId: content.projectId,
      contentId: content.id,
      prompt: parsed.data.prompt,
      altText: parsed.data.altText,
    });
    if (!result.success) return res.status(422).json({ success: false, message: result.reason });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error("[MARKETING] generateImage error:", error);
    res.status(500).json({ success: false, message: "Failed to generate image" });
  }
}] as any;

const scheduleSchema = z.object({
  socialConnectionId: z.string().min(1),
  platform: z.enum(["facebook", "instagram", "linkedin", "x", "threads", "tiktok", "youtube", "pinterest", "bluesky", "mastodon", "google_business"]),
  scheduledFor: z.string().datetime(),
  mediaAssetIds: z.array(z.string()).default([]),
});

export const scheduleContentRoute: RequestHandler = [requireTenantRole("editor"), async (req, res) => {
  const parsed = scheduleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const result = await scheduleContent({
      tenantId: req.params.tenantId,
      contentId: req.params.contentId,
      socialConnectionId: parsed.data.socialConnectionId,
      platform: parsed.data.platform,
      scheduledFor: new Date(parsed.data.scheduledFor),
      mediaAssetIds: parsed.data.mediaAssetIds,
    });
    if (!result.success) return res.status(422).json({ success: false, message: result.reason });
    res.json({ success: true, data: { scheduledPostId: result.scheduledPostId } });
  } catch (error) {
    logger.error("[MARKETING] schedule error:", error);
    res.status(500).json({ success: false, message: "Failed to schedule content" });
  }
}] as any;
