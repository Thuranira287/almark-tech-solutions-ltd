import { Request, RequestHandler } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import { TenantRoleValue, roleAtLeast } from "./tenancy";

const COOKIE_NAME = "almark_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const BCRYPT_ROUNDS = 12;

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET is not set — admin auth cannot run without it");
  }
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function createSessionCookieValue(adminUserId: string): string {
  const payload = JSON.stringify({ uid: adminUserId, exp: Date.now() + SESSION_TTL_MS });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function verifySessionCookieValue(value: string | undefined): { uid: string } | null {
  if (!value) return null;
  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString());
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    if (typeof payload.uid !== "string" || !payload.uid) return null;
    return { uid: payload.uid };
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: SESSION_TTL_MS,
  path: "/",
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// 2FA 
export function checkTotp(totpSecret: string | null, candidate: string | undefined): boolean {
  if (!totpSecret) return true;
  if (!candidate) return false;
  try {
    return authenticator.check(candidate, totpSecret);
  } catch {
    return false;
  }
}

// --- IP allowlist, with CIDR support (IPv4) ---
// ADMIN_IP_ALLOWLIST 
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function ipMatchesEntry(ip: string, entry: string): boolean {
  if (entry.includes("/")) {
    const [rangeIp, prefixStr] = entry.split("/");
    const prefix = Number(prefixStr);
    const rangeInt = ipv4ToInt(rangeIp);
    const ipInt = ipv4ToInt(ip);
    if (rangeInt === null || ipInt === null || Number.isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }
    if (prefix === 0) return true;
    const mask = (0xffffffff << (32 - prefix)) >>> 0;
    return (rangeInt & mask) === (ipInt & mask);
  }
  return ip === entry;
}

export function checkIpAllowlist(ip: string | undefined): boolean {
  const allowlist = (process.env.ADMIN_IP_ALLOWLIST || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (allowlist.length === 0) return true; 
  if (!ip) return false;
  const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  return allowlist.some((entry) => ipMatchesEntry(normalized, entry));
}

function readSession(req: Request): { uid: string } | null {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  const value = match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;
  return verifySessionCookieValue(value);
}

export interface SessionUser {
  id: string;
  email: string;
  isPlatformAdmin: boolean;
}

export function getSessionUser(req: Request): SessionUser {
  return (req as any).adminUser as SessionUser;
}

export const requireSession: RequestHandler = async (req, res, next) => {
  if (!checkIpAllowlist(req.ip)) {
    console.warn(`Admin access blocked — IP ${req.ip} not in ADMIN_IP_ALLOWLIST`);
    return res.status(403).json({ success: false, message: "Not authorized from this network" });
  }
  const session = readSession(req);
  if (!session) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  try {
    const { prisma } = await import("../db");
    const user = await prisma.adminUser.findUnique({
      where: { id: session.uid },
      select: { id: true, email: true, isPlatformAdmin: true },
    });
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    (req as any).adminUserId = user.id;
    (req as any).adminUser = user;
    next();
  } catch (error) {
    console.error("requireSession error:", error);
    res.status(500).json({ success: false, message: "Authentication check failed" });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  requireSession(req, res, () => {
    if (!getSessionUser(req).isPlatformAdmin) {
      return res.status(403).json({ success: false, message: "Platform administrator access required" });
    }
    next();
  });
};

export function requireTenantRole(minimum: TenantRoleValue): RequestHandler {
  return (req, res, next) => {
    requireSession(req, res, async () => {
      const tenantId = req.params.tenantId;
      const user = getSessionUser(req);
      try {
        const { prisma } = await import("../db");
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, status: true } });
        if (!tenant) {
          return res.status(404).json({ success: false, message: "Tenant not found" });
        }
        if (user.isPlatformAdmin) {
          (req as any).tenantRole = "owner";
          (req as any).tenant = tenant;
          return next();
        }
        const membership = await prisma.tenantMember.findUnique({
          where: { tenantId_adminUserId: { tenantId, adminUserId: user.id } },
          select: { role: true },
        });
        if (!membership) {
          return res.status(404).json({ success: false, message: "Tenant not found" });
        }
        if (tenant.status !== "active") {
          return res.status(403).json({ success: false, message: "This tenant is suspended" });
        }
        if (!roleAtLeast(membership.role, minimum)) {
          return res.status(403).json({ success: false, message: `Requires ${minimum} role or higher` });
        }
        (req as any).tenantRole = membership.role;
        (req as any).tenant = tenant;
        next();
      } catch (error) {
        console.error("requireTenantRole error:", error);
        res.status(500).json({ success: false, message: "Authorization check failed" });
      }
    });
  };
}

export { COOKIE_NAME };
