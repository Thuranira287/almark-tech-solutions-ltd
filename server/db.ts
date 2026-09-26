// server/db.ts
// Single shared Prisma client. Reused across requests (and across Netlify
// function invocations within the same warm container) to avoid exhausting
// Postgres connections.
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}
