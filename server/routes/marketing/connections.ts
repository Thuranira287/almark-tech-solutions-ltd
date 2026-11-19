import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { requireTenantRole } from "../../lib/adminAuth";
import { formatZodError } from "../../lib/validation";
import { encryptToken } from "../../lib/marketing/tokenCrypto";
import { getSocialProvider } from "../../lib/marketing/providers/socialProvider";
import { logger } from "../../lib/logger";

export const listConnections: RequestHandler = [requireTenantRole("viewer"), async (req, res) => {
  try {
    const connections = await prisma.socialConnection.findMany({
      where: { tenantId: req.params.tenantId },
      select: {
        id: true,
        provider: true,
        platform: true,
        externalChannelId: true,
        accountName: true,
        status: true,
        lastCheckedAt: true,
        lastErrorSafe: true,
        createdAt: true,
      },
    });
    res.json({ success: true, data: connections });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load social connections" });
  }
}] as any;

const checkSchema = z.object({ apiKey: z.string().min(10) });

export const checkBufferChannels: RequestHandler = [requireTenantRole("admin"), async (req, res) => {
  const parsed = checkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: "A Buffer API key is required" });
  try {
    const provider = getSocialProvider();
    const result = await provider.listChannels(parsed.data.apiKey);
    if (result.status !== "connected") {
      return res.status(422).json({ success: false, message: result.errorSafe || "Could not verify this Buffer API key" });
    }
    res.json({ success: true, data: { channels: result.channels } });
  } catch (error) {
    logger.error("[MARKETING] checkBufferChannels error:", error);
    res.status(500).json({ success: false, message: "Failed to check Buffer channels" });
  }
}] as any;

const platformEnum = z.enum(["facebook", "instagram", "linkedin", "x", "threads", "tiktok", "youtube", "pinterest", "bluesky", "mastodon", "google_business"]);

const createConnectionSchema = z.object({
  apiKey: z.string().min(10),
  platform: platformEnum,
  externalChannelId: z.string().min(1),
  externalOrgId: z.string().optional(),
  accountName: z.string().min(1).max(200),
  projectId: z.string().optional(),
});

export const createConnection: RequestHandler = [requireTenantRole("admin"), async (req, res) => {
  const parsed = createConnectionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const encryptedApiKey = encryptToken(parsed.data.apiKey);
    const connection = await prisma.socialConnection.create({
      data: {
        tenantId: req.params.tenantId,
        projectId: parsed.data.projectId,
        provider: "buffer",
        platform: parsed.data.platform,
        externalChannelId: parsed.data.externalChannelId,
        externalOrgId: parsed.data.externalOrgId,
        accountName: parsed.data.accountName,
        encryptedApiKey,
        status: "connected",
        lastCheckedAt: new Date(),
      },
    });
    res.json({
      success: true,
      data: { id: connection.id, platform: connection.platform, accountName: connection.accountName, status: connection.status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to save social connection (it may already exist)" });
  }
}] as any;

export const deleteConnection: RequestHandler = [requireTenantRole("admin"), async (req, res) => {
  try {
    const existing = await prisma.socialConnection.findFirst({ where: { id: req.params.connectionId, tenantId: req.params.tenantId } });
    if (!existing) return res.status(404).json({ success: false, message: "Connection not found for this tenant" });
    await prisma.socialConnection.delete({ where: { id: req.params.connectionId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to remove connection" });
  }
}] as any;
