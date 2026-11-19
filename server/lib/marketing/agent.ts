import { prisma } from "../../db";
import { logger } from "../logger";
import { buildMarketingContext } from "./context";
import { generateMarketingContent, estimateCostUsd } from "./claude";
import { validateContent, computeContentHash } from "./contentValidation";
import {
  assertAutomationEnabled,
  assertWithinAiCostBudget,
  assertWithinPostingLimit,
  assertWithinImageGenBudget,
} from "./budgetGuard";
import { getSocialProvider } from "./providers/socialProvider";
import { getImageProvider } from "./providers/imageProvider";
import { ContentTypeValue as ContentType, MarketingPlatformValue as MarketingPlatform } from "./types";
import { decryptToken } from "./tokenCrypto";

async function logAction(params: {
  tenantId: string;
  projectId?: string;
  action: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
  estimatedCostUsd?: number;
  promptHash?: string;
}) {
  await prisma.aIActionLog.create({
    data: {
      tenantId: params.tenantId,
      projectId: params.projectId,
      action: params.action,
      status: params.status,
      reason: params.reason,
      estimatedCostUsd: params.estimatedCostUsd,
      promptHash: params.promptHash,
    },
  });
}

export interface DraftContentParams {
  tenantId: string;
  projectId: string;
  contentType: ContentType;
  brief: string;
}

export interface DraftContentOutcome {
  status: "created" | "blocked";
  contentId?: string;
  validationIssues?: string[];
  reason?: string;
}

export async function draftContent(params: DraftContentParams): Promise<DraftContentOutcome> {
  const project = await prisma.marketingProject.findFirst({ where: { id: params.projectId, tenantId: params.tenantId } });
  if (!project) return { status: "blocked", reason: "Project not found for this tenant" };
  if (!project.active) return { status: "blocked", reason: "Project is not active" };
  if (project.allowedContentTypes.length > 0 && !project.allowedContentTypes.includes(params.contentType)) {
    return { status: "blocked", reason: `Content type "${params.contentType}" is not in this project's allowed list` };
  }

  try {
    await assertAutomationEnabled(params.tenantId);
    await assertWithinAiCostBudget(params.tenantId);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Pre-flight check failed";
    await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "draft_content", status: "skipped", reason });
    return { status: "blocked", reason };
  }

  const context = await buildMarketingContext({ tenantId: params.tenantId, projectId: params.projectId });

  let generation;
  try {
    generation = await generateMarketingContent({
      task: `Draft a piece of "${params.contentType}" content. Brief (trusted, from an authenticated tenant admin): ${params.brief}. Write only the post text — no commentary, no markdown formatting, no explanation of what you did.`,
      context,
      allowedTools: ["getPublicServices", "getPublicPortfolio", "getApprovedTestimonials"],
      toolScope: { tenantId: params.tenantId, projectId: params.projectId, publicServices: context.publicServices, publicPortfolio: context.publicPortfolio },
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Content generation failed";
    await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "draft_content", status: "failed", reason });
    return { status: "blocked", reason };
  }

  const costUsd = estimateCostUsd(generation.usage);
  const promptHash = computeContentHash(params.brief);

  const validation = await validateContent({
    tenantId: params.tenantId,
    projectId: params.projectId,
    platform: null,
    text: generation.text,
    ctaOptions: project.ctaDefault ? [project.ctaDefault] : [],
  });

  if (!validation.valid) {
    await logAction({
      tenantId: params.tenantId,
      projectId: params.projectId,
      action: "draft_content",
      status: "failed",
      reason: `Validation failed: ${validation.issues.map((i) => i.stage).join(", ")}`,
      estimatedCostUsd: costUsd,
      promptHash,
    });
    return {
      status: "blocked",
      validationIssues: validation.issues.map((i) => `${i.stage}: ${i.message}`),
      reason: "Generated content failed validation and was not saved as a publishable draft",
    };
  }

  const content = await prisma.marketingContent.create({
    data: {
      tenantId: params.tenantId,
      projectId: params.projectId,
      contentType: params.contentType,
      sourceType: "ai_plan",
      body: generation.text,
      status: "pending_approval",
      contentHash: validation.contentHash,
      createdBy: "ai",
    },
  });

  await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "draft_content", status: "success", estimatedCostUsd: costUsd, promptHash });

  return { status: "created", contentId: content.id };
}

export async function approveContent(tenantId: string, contentId: string, adminUserId: string): Promise<{ ok: boolean; reason?: string }> {
  const content = await prisma.marketingContent.findFirst({ where: { id: contentId, tenantId } });
  if (!content) return { ok: false, reason: "Content not found for this tenant" };
  await prisma.marketingContent.update({ where: { id: contentId }, data: { status: "approved" } });
  await logAction({ tenantId, projectId: content.projectId, action: "approve_content", status: "success", reason: `by ${adminUserId}` });
  return { ok: true };
}

export async function rejectContent(tenantId: string, contentId: string, adminUserId: string, reason: string): Promise<{ ok: boolean }> {
  const content = await prisma.marketingContent.findFirst({ where: { id: contentId, tenantId } });
  if (!content) return { ok: false };
  await prisma.marketingContent.update({ where: { id: contentId }, data: { status: "rejected", rejectionReason: reason } });
  await logAction({ tenantId, projectId: content.projectId, action: "reject_content", status: "success", reason: `by ${adminUserId}: ${reason}` });
  return { ok: true };
}

export interface GenerateImageParams {
  tenantId: string;
  projectId: string;
  contentId?: string;
  prompt: string;
  altText?: string;
}

export async function generateAndStoreImage(params: GenerateImageParams) {
  try {
    await assertAutomationEnabled(params.tenantId);
    await assertWithinImageGenBudget(params.tenantId);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Pre-flight check failed";
    await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "generate_image", status: "skipped", reason });
    return { success: false, reason };
  }

  const provider = getImageProvider();
  if (!provider.isConfigured()) {
    await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "generate_image", status: "skipped", reason: "Image provider not configured" });
    return { success: false, reason: "Image generation is not configured (FAL_KEY / Cloudinary env vars missing)" };
  }

  const result = await provider.generateAndStore({ prompt: params.prompt });
  if (!result.success) {
    await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "generate_image", status: "failed", reason: result.errorSafe });
    return { success: false, reason: result.errorSafe };
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      tenantId: params.tenantId,
      projectId: params.projectId,
      contentId: params.contentId,
      provider: result.provider!,
      providerAssetId: result.providerAssetId!,
      cloudinaryPublicId: result.cloudinaryPublicId!,
      secureUrl: result.secureUrl!,
      width: result.width,
      height: result.height,
      mimeType: result.mimeType!,
      prompt: params.prompt,
      altText: params.altText,
    },
  });

  await logAction({ tenantId: params.tenantId, projectId: params.projectId, action: "generate_image", status: "success" });
  return { success: true, mediaAssetId: asset.id, secureUrl: asset.secureUrl };
}

export interface ScheduleParams {
  tenantId: string;
  contentId: string;
  socialConnectionId: string;
  platform: MarketingPlatform;
  scheduledFor: Date;
  mediaAssetIds?: string[];
}

export async function scheduleContent(params: ScheduleParams): Promise<{ success: boolean; scheduledPostId?: string; reason?: string }> {
  const content = await prisma.marketingContent.findFirst({ where: { id: params.contentId, tenantId: params.tenantId } });
  if (!content) return { success: false, reason: "Content not found for this tenant" };
  if (content.status !== "approved") return { success: false, reason: "Content must be approved before scheduling" };

  const connection = await prisma.socialConnection.findFirst({ where: { id: params.socialConnectionId, tenantId: params.tenantId } });
  if (!connection) return { success: false, reason: "Social connection not found for this tenant" };
  if (connection.status !== "connected") return { success: false, reason: `Social connection status is "${connection.status}"` };

  try {
    await assertAutomationEnabled(params.tenantId);
    await assertWithinPostingLimit(params.tenantId, content.projectId);
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Pre-flight check failed";
    await logAction({ tenantId: params.tenantId, projectId: content.projectId, action: "schedule_post", status: "skipped", reason });
    return { success: false, reason };
  }

  const project = await prisma.marketingProject.findUniqueOrThrow({ where: { id: content.projectId } });
  const platformValidation = await validateContent({
    tenantId: params.tenantId,
    projectId: content.projectId,
    platform: params.platform,
    text: content.body,
    ctaOptions: project.ctaDefault ? [project.ctaDefault] : [],
  });
  if (!platformValidation.valid) {
    return { success: false, reason: `Platform validation failed: ${platformValidation.issues.map((i) => i.message).join("; ")}` };
  }

  // Every mediaAssetId must belong to this tenant — without this check, a
  // caller could reference another tenant's generated image by ID and have
  // it attached to (and published with) this tenant's post.
  const mediaAssetIds = params.mediaAssetIds ?? [];
  if (mediaAssetIds.length > 0) {
    const ownedCount = await prisma.mediaAsset.count({ where: { id: { in: mediaAssetIds }, tenantId: params.tenantId } });
    if (ownedCount !== mediaAssetIds.length) {
      return { success: false, reason: "One or more media assets do not belong to this tenant" };
    }
  }

  const idempotencyKey = `${content.id}:${params.socialConnectionId}:${params.scheduledFor.toISOString()}`;
  const existing = await prisma.scheduledPost.findUnique({ where: { idempotencyKey } });
  if (existing) return { success: false, reason: "This exact post/connection/time combination was already scheduled" };

  const scheduledPost = await prisma.scheduledPost.create({
    data: {
      tenantId: params.tenantId,
      projectId: content.projectId,
      contentId: content.id,
      socialConnectionId: params.socialConnectionId,
      platform: params.platform,
      adaptedText: content.body,
      mediaAssetIds,
      scheduledFor: params.scheduledFor,
      idempotencyKey,
      status: "scheduled",
    },
  });

  await prisma.marketingContent.update({ where: { id: content.id }, data: { status: "scheduled" } });
  await logAction({ tenantId: params.tenantId, projectId: content.projectId, action: "schedule_post", status: "success" });
  return { success: true, scheduledPostId: scheduledPost.id };
}

// Re-checks, at the moment of publication, every condition that gated
// scheduling. Returns a human-readable reason if publishing must not
// proceed, or null if it's allowed.
export async function checkPublishAllowed(post: {
  tenantId: string;
  projectId: string;
  contentId: string;
  socialConnectionId: string;
}): Promise<string | null> {
  try {
    await assertAutomationEnabled(post.tenantId);
  } catch (err) {
    return err instanceof Error ? err.message : "Automation is disabled";
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: post.tenantId }, select: { status: true } });
  if (!tenant || tenant.status !== "active") {
    return "Tenant is not active";
  }

  const project = await prisma.marketingProject.findFirst({
    where: { id: post.projectId, tenantId: post.tenantId },
    select: { active: true, autonomyMode: true },
  });
  if (!project) return "Project not found for this tenant";
  if (!project.active) return "Project is not active";
  if (project.autonomyMode === "MANUAL") return "Project is in MANUAL mode — automated publishing is not permitted";

  const content = await prisma.marketingContent.findFirst({
    where: { id: post.contentId, tenantId: post.tenantId },
    select: { status: true },
  });
  if (!content) return "Content not found for this tenant";
  if (content.status !== "scheduled") return `Content is "${content.status}", no longer approved for publishing`;

  const connection = await prisma.socialConnection.findFirst({
    where: { id: post.socialConnectionId, tenantId: post.tenantId },
    select: { status: true },
  });
  if (!connection) return "Social connection not found for this tenant";
  if (connection.status !== "connected") return `Social connection status is "${connection.status}"`;

  return null;
}

// Publishes one due, scheduled post. Idempotent: a post already
// PUBLISHED (or currently PUBLISHING, meaning another worker/tick has it)
// is skipped rather than re-sent, even if this function is invoked twice
// for the same row (e.g. a cron retry) — the CAS update below is what
// actually enforces that, not just the check.
export async function publishScheduledPost(scheduledPostId: string): Promise<{ success: boolean; reason?: string }> {
  const claim = await prisma.scheduledPost.updateMany({
    where: { id: scheduledPostId, status: "scheduled" },
    data: { status: "publishing", attempts: { increment: 1 } },
  });
  if (claim.count === 0) {
    return { success: false, reason: "Post is not in a schedulable state (already published, publishing, or cancelled)" };
  }

  const post = await prisma.scheduledPost.findUniqueOrThrow({ where: { id: scheduledPostId } });

  // Everything that was true when this post was scheduled must still be
  // true now. A post scheduled before the kill switch was flipped, before a
  // project was deactivated, or before content was pulled back must not
  // publish just because its time arrived. On any failure the claim is
  // released back to "scheduled" (not failed) so it publishes normally if
  // automation is later re-enabled.
  const blockedReason = await checkPublishAllowed(post);
  if (blockedReason) {
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "scheduled", lastErrorSafe: blockedReason } });
    await logAction({ tenantId: post.tenantId, projectId: post.projectId, action: "publish_post", status: "skipped", reason: blockedReason });
    return { success: false, reason: blockedReason };
  }

  const connection = await prisma.socialConnection.findFirstOrThrow({ where: { id: post.socialConnectionId, tenantId: post.tenantId } });
  const media = post.mediaAssetIds.length
    ? await prisma.mediaAsset.findMany({ where: { id: { in: post.mediaAssetIds }, tenantId: post.tenantId }, select: { secureUrl: true } })
    : [];

  const provider = getSocialProvider();
  if (!provider.isConfigured()) {
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "scheduled", lastErrorSafe: "Social provider not configured" } });
    await logAction({ tenantId: post.tenantId, projectId: post.projectId, action: "publish_post", status: "skipped", reason: "Social provider not configured" });
    return { success: false, reason: "No social publishing provider is configured" };
  }

  try {
    const apiKey = decryptToken(connection.encryptedApiKey);
    const result = await provider.publish({
      platform: post.platform,
      text: post.adaptedText,
      mediaAssetUrls: media.map((m) => m.secureUrl),
      apiKey,
      channelId: connection.externalChannelId,
      idempotencyKey: post.idempotencyKey,
    });

    if (!result.success) {
      const nextStatus = result.retryable && post.attempts < 5 ? "scheduled" : "failed";
      await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: nextStatus, lastErrorSafe: result.errorSafe } });
      await logAction({ tenantId: post.tenantId, projectId: post.projectId, action: "publish_post", status: "failed", reason: result.errorSafe });
      return { success: false, reason: result.errorSafe };
    }

    await prisma.$transaction([
      prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "published", providerPostId: result.externalPostId, providerAcceptedAt: new Date() } }),
      prisma.publishedPost.create({
        data: {
          tenantId: post.tenantId,
          projectId: post.projectId,
          scheduledPostId: post.id,
          socialConnectionId: post.socialConnectionId,
          platform: post.platform,
          externalPostId: result.externalPostId!,
          externalUrl: result.externalUrl,
        },
      }),
      prisma.marketingContent.update({ where: { id: post.contentId }, data: { status: "published" } }),
    ]);

    await logAction({ tenantId: post.tenantId, projectId: post.projectId, action: "publish_post", status: "success" });
    return { success: true };
  } catch (err) {
    logger.error("[MARKETING] publish failed", err);
    await prisma.scheduledPost.update({ where: { id: scheduledPostId }, data: { status: "scheduled", lastErrorSafe: "Unexpected error during publish" } });
    await logAction({ tenantId: post.tenantId, projectId: post.projectId, action: "publish_post", status: "failed", reason: "Unexpected error during publish" });
    return { success: false, reason: "Unexpected error during publish — see server logs" };
  }
}

export async function runDuePosts(limit = 20): Promise<{ processed: number; succeeded: number; failed: number }> {
  const due = await prisma.scheduledPost.findMany({
    where: { status: "scheduled", scheduledFor: { lte: new Date() } },
    take: limit,
    orderBy: { scheduledFor: "asc" },
  });

  let succeeded = 0;
  let failed = 0;
  for (const post of due) {
    const result = await publishScheduledPost(post.id);
    if (result.success) succeeded++;
    else failed++;
  }
  return { processed: due.length, succeeded, failed };
}
