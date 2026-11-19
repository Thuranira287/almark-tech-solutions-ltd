import { RequestHandler } from "express";
import crypto from "crypto";
import { prisma } from "../../db";
import { requireAdmin } from "../../lib/adminAuth";
import { runDuePosts } from "../../lib/marketing/agent";
import { getSocialProvider } from "../../lib/marketing/providers/socialProvider";
import { getImageProvider } from "../../lib/marketing/providers/imageProvider";
import { logger } from "../../lib/logger";

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Not gated by requireAdmin — this is called by an external cron service
// with no admin session, only a shared secret. A wrong/missing secret is
// rejected before touching the database, same pattern as the M-Pesa
// callback secret elsewhere in this codebase.
export const runAutomation: RequestHandler = async (req, res) => {
  const expected = process.env.MARKETING_CRON_SECRET;
  const provided = req.headers["x-cron-secret"];
  if (!expected) {
    return res.status(503).json({ success: false, message: "MARKETING_CRON_SECRET is not configured" });
  }
  if (typeof provided !== "string" || !timingSafeEqual(provided, expected)) {
    return res.status(403).json({ success: false, message: "Invalid or missing cron secret" });
  }

  try {
    const platformSettings = await prisma.platformMarketingSettings.findUnique({ where: { id: 1 } });
    if (!platformSettings?.automationEnabled) {
      return res.json({ success: true, data: { processed: 0, succeeded: 0, failed: 0, reason: "Platform automation is off" } });
    }

    const result = await runDuePosts();
    await prisma.platformMarketingSettings.update({ where: { id: 1 }, data: { lastAutomationRunAt: new Date() } });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error("[MARKETING] automation run error:", error);
    res.status(500).json({ success: false, message: "Automation run failed" });
  }
};

export const getProviderStatus: RequestHandler = [requireAdmin, async (_req, res) => {
  const social = getSocialProvider();
  const image = getImageProvider();
  res.json({
    success: true,
    data: {
      socialPublisher: { name: social.name, configured: social.isConfigured() },
      imageGeneration: { name: image.name, configured: image.isConfigured() },
      scheduler: { configured: !!process.env.MARKETING_CRON_SECRET },
      ai: { configured: !!process.env.ANTHROPIC_API_KEY },
    },
  });
}] as any;
