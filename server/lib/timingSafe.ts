import crypto from "crypto";

// Constant-time comparison for secrets (webhook/callback secrets, cron
// secrets, etc.). Handles the length-mismatch case explicitly — comparing
// buffers of different lengths directly would throw, and bailing out early
// on a length check alone would leak length via timing, so a fixed-size
// dummy comparison runs either way.
export function timingSafeEqual(a: string | undefined | null, b: string | undefined | null): boolean {
  if (typeof a !== "string" || typeof b !== "string" || a.length === 0 || b.length === 0) {
    return false;
  }
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still do a same-size comparison so this branch takes comparable time
    // to the equal-length path, rather than returning immediately.
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
