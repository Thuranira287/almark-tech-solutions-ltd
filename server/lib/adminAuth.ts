import { RequestHandler } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";

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

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!checkIpAllowlist(req.ip)) {
    console.warn(`Admin access blocked — IP ${req.ip} not in ADMIN_IP_ALLOWLIST`);
    return res.status(403).json({ success: false, message: "Not authorized from this network" });
  }

  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  const value = match ? decodeURIComponent(match.split("=").slice(1).join("=")) : undefined;

  const session = verifySessionCookieValue(value);
  if (!session) {
    return res.status(401).json({ success: false, message: "Not authenticated" });
  }
  (req as any).adminUserId = session.uid;
  next();
};

export { COOKIE_NAME };
