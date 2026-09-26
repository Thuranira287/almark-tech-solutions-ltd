import { RequestHandler } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../db";
import { logger } from "../lib/logger";
import {
  verifyPassword,
  hashPassword,
  checkTotp,
  createSessionCookieValue,
  cookieOptions,
  requireAdmin,
  COOKIE_NAME,
} from "../lib/adminAuth";

// Strict limiter
export const adminLoginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});

export const adminLogin: RequestHandler = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }
  const { email, password, totpCode } = parsed.data;

  try {
    const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase() } });
    const passwordOk = await verifyPassword(
      password,
      user?.passwordHash || "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinval",
    );
    if (!user || !passwordOk || !checkTotp(user.totpSecret, totpCode)) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    const cookieValue = createSessionCookieValue(user.id);
    res.cookie(COOKIE_NAME, cookieValue, cookieOptions);
    res.json({ success: true, data: { email: user.email } });
  } catch (error) {
    console.error("adminLogin error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

export const adminLogout: RequestHandler = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.json({ success: true });
};

export const adminCheckSession: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const user = await prisma.adminUser.findUnique({ where: { id: (req as any).adminUserId } });
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });
    res.json({ success: true, data: { email: user.email } });
  } catch (error) {
    console.error("adminCheckSession error:", error);
    res.status(500).json({ success: false });
  }
}] as any;

export const adminListQuotes: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        services: { include: { service: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    res.json({
      success: true,
      data: quotes.map((q) => ({
        quoteId: q.quoteRef,
        customerName: q.customerName,
        customerEmail: q.customerEmail,
        customerPhone: q.customerPhone,
        company: q.company,
        totalPrice: q.totalPrice,
        paidAmount: q.paidAmount,
        balance: q.totalPrice - q.paidAmount,
        status: q.status,
        createdAt: q.createdAt,
        services: q.services.map((s) => ({ name: s.service.name, price: s.priceAtQuote })),
        payments: q.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          providerRef: p.providerRef,
          createdAt: p.createdAt,
        })),
      })),
    });
  } catch (error) {
    console.error("adminListQuotes error:", error);
    res.status(500).json({ success: false, message: "Failed to load quotes" });
  }
}] as any;

const statusUpdateSchema = z.object({
  status: z.enum(["pending", "partially_paid", "paid", "cancelled"]),
});

// Manual override for a quote's status — e.g. marking it cancelled, or
// correcting it after confirming an off-platform payment. Deliberately
// narrow: this changes status only, never totalPrice or paidAmount, so it
// can't be used to fabricate a payment that never happened.
export const adminUpdateQuoteStatus: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const quote = await prisma.quote.findUnique({ where: { quoteRef: req.params.quoteId } });
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: parsed.data.status },
    });
    logger.debug(`Admin set quote ${updated.quoteRef} status to ${updated.status}`);
    res.json({ success: true, data: { quoteId: updated.quoteRef, status: updated.status } });
  } catch (error) {
    console.error("adminUpdateQuoteStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to update quote status" });
  }
}] as any;

// --- Admin user management (per-person accounts) ---
// Only reachable by an already-authenticated admin — bootstrapping the
// first account is done via `npm run admin:create` (see scripts/create-admin.ts),
// not over HTTP, so there's no unauthenticated way to create an admin.

export const adminListUsers: RequestHandler = [requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.adminUser.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, totpSecret: true, createdAt: true, lastLoginAt: true },
    });
    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        twoFactorEnabled: !!u.totpSecret,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (error) {
    console.error("adminListUsers error:", error);
    res.status(500).json({ success: false, message: "Failed to load admin users" });
  }
}] as any;

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10, "Password must be at least 10 characters"),
});

export const adminCreateUser: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: parsed.error.issues[0]?.message || "Invalid input" });
    }
    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "An admin with that email already exists" });
    }
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.adminUser.create({ data: { email, passwordHash } });
    res.json({ success: true, data: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("adminCreateUser error:", error);
    res.status(500).json({ success: false, message: "Failed to create admin user" });
  }
}] as any;

export const adminDeleteUser: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const targetId = req.params.userId;
    const requesterId = (req as any).adminUserId as string;
    const count = await prisma.adminUser.count();
    if (count <= 1) {
      return res.status(400).json({ success: false, message: "Can't remove the last remaining admin account" });
    }
    if (targetId === requesterId) {
      return res.status(400).json({ success: false, message: "You can't remove your own account while signed in as it" });
    }
    await prisma.adminUser.delete({ where: { id: targetId } });
    res.json({ success: true });
  } catch (error) {
    console.error("adminDeleteUser error:", error);
    res.status(500).json({ success: false, message: "Failed to remove admin user" });
  }
}] as any;

// --- Testimonial moderation ---

export const adminListTestimonials: RequestHandler = [requireAdmin, async (_req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
    res.json({ success: true, data: testimonials });
  } catch (error) {
    console.error("adminListTestimonials error:", error);
    res.status(500).json({ success: false, message: "Failed to load reviews" });
  }
}] as any;

const testimonialStatusSchema = z.object({ status: z.enum(["pending", "approved", "rejected"]) });

export const adminUpdateTestimonialStatus: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    const parsed = testimonialStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const updated = await prisma.testimonial.update({
      where: { id: req.params.testimonialId },
      data: { status: parsed.data.status },
    });
    res.json({ success: true, data: { id: updated.id, status: updated.status } });
  } catch (error) {
    console.error("adminUpdateTestimonialStatus error:", error);
    res.status(404).json({ success: false, message: "Review not found" });
  }
}] as any;

export const adminDeleteTestimonial: RequestHandler = [requireAdmin, async (req, res) => {
  try {
    await prisma.testimonial.delete({ where: { id: req.params.testimonialId } });
    res.json({ success: true });
  } catch (error) {
    console.error("adminDeleteTestimonial error:", error);
    res.status(404).json({ success: false, message: "Review not found" });
  }
}] as any;
