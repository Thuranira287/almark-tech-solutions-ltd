import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import { resendReceipt } from "./routes/email";
import { paymentsRouter } from "./routes/payments";
import { handleStripeWebhook } from "./routes/payments/card";
import { registerC2BUrlsHandler } from "./routes/payments/mpesa";
import { requireAdmin } from "./lib/adminAuth";
import { createQuote, getQuote, listServices } from "./routes/quotes";
import { submitTestimonial, listApprovedTestimonials } from "./routes/testimonials";
import {
  adminLogin,
  adminLogout,
  adminCheckSession,
  adminListQuotes,
  adminUpdateQuoteStatus,
  adminConfirmPayment,
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminListTestimonials,
  adminUpdateTestimonialStatus,
  adminDeleteTestimonial,
  adminLoginLimiter,
} from "./routes/admin";
import { adminRouter as marketingAdminRouter, cronRouter as marketingCronRouter } from "./routes/marketing";

// Fail fast in production if critical secrets are missing, instead of
// silently running with placeholder defaults.
function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;
  const required = ["DATABASE_URL", "ADMIN_SESSION_SECRET"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
  const optionalButWarn = [
    "MPESA_CONSUMER_KEY",
    "MPESA_CONSUMER_SECRET",
    "MPESA_CALLBACK_SECRET",
    "MPESA_C2B_CONFIRMATION_URL",
    "MPESA_C2B_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_WEBHOOK_ID",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SENDGRID_API_KEY",
    "ALLOWED_ORIGINS",
    "ANTHROPIC_API_KEY",
    "MARKETING_TOKEN_ENCRYPTION_KEY",
    "MARKETING_CRON_SECRET",
    "FAL_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];
  for (const key of optionalButWarn) {
    if (!process.env[key]) {
      console.warn(`[startup] ${key} is not set — related functionality will fail at runtime`);
    }
  }
}

export function createServer() {
  validateEnv();

  const app = express();

  // Netlify 
  app.set("trust proxy", 1);

  // Security headers
    // Security headers
  const isProd = process.env.NODE_ENV === "production";
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": isProd
            ? [
                "'self'",
                "'sha256-CPFTqafYjubMvSpgXK90+K9OvCmmeGDhYOVcaRtc9e0='",
                "https://googlesyndication.com",
                "https://google.com",
                "https://googletagservices.com",
              ]
            : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          "frame-src": [
            "'self'",
            "https://doubleclick.net",
            "https://googlesyndication.com",
            "https://google.com",
          ],
          "connect-src": [
            "'self'",
            "https://googlesyndication.com",
            "https://doubleclick.net",
          ],
          "img-src": ["'self'", "data:", "https:"],
          "upgrade-insecure-requests": isProd ? [] : null,
        },
      },
    }),
  );

  // CORS allowlist
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const devOrigins = ["http://localhost:3000", "http://localhost:8080"];
  const originAllowlist = allowedOrigins.length > 0 ? allowedOrigins : devOrigins;

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (originAllowlist.includes(origin)) return callback(null, true);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true, 
    }),
  );

  // Stripe webhook
  app.post(
    "/api/payments/card/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook,
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Rate limiting
  const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 300 });
  const paymentLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 });
  app.use("/api/", generalLimiter);
  app.use("/api/payments/mpesa/initiate", paymentLimiter);
  app.use("/api/payments/mpesa/manual", paymentLimiter);
  app.use("/api/payments/paypal/create", paymentLimiter);
  app.use("/api/payments/card/create-checkout-session", paymentLimiter);
  app.use("/api/admin/login", adminLoginLimiter);
  // Aggressive: this endpoint requires knowing both a quote ID and the
  // customer's email, but a brute-forcer with a leaked/guessed email could
  // still try many quote IDs — keep the ceiling low.
  const quoteLookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 });
  app.use(/^\/api\/quotes\/[^/]+$/, quoteLookupLimiter);

  const testimonialLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5 });
  app.use("/api/testimonials", (req, res, next) => (req.method === "POST" ? testimonialLimiter(req, res, next) : next()));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // Quotes 
  app.get("/api/services", listServices);
  app.post("/api/quotes", createQuote);
  app.get("/api/quotes/:quoteId", getQuote);

  // Testimonials
  app.post("/api/testimonials", submitTestimonial);
  app.get("/api/testimonials", listApprovedTestimonials);

  // Payments
  app.use("/api/payments", paymentsRouter);

  // Admin
  app.post("/api/admin/login", adminLogin);
  app.post("/api/admin/logout", adminLogout);
  app.get("/api/admin/session", adminCheckSession);
  app.get("/api/admin/quotes", adminListQuotes);
  app.patch("/api/admin/quotes/:quoteId/status", adminUpdateQuoteStatus);
  app.post("/api/admin/payments/:paymentId/confirm", adminConfirmPayment);
  app.post("/api/admin/quotes/resend-receipt", resendReceipt);
  app.post("/api/admin/payments/mpesa/register-c2b", requireAdmin, registerC2BUrlsHandler);
  app.get("/api/admin/users", adminListUsers);
  app.post("/api/admin/users", adminCreateUser);
  app.delete("/api/admin/users/:userId", adminDeleteUser);
  app.get("/api/admin/testimonials", adminListTestimonials);
  app.patch("/api/admin/testimonials/:testimonialId/status", adminUpdateTestimonialStatus);
  app.delete("/api/admin/testimonials/:testimonialId", adminDeleteTestimonial);

  // AI Marketing — every route is admin-only (enforced inside each handler
  // via requireAdmin), never public. Draft generation calls Anthropic, so
  // it gets its own tighter limiter alongside the payment/email ones above.
  const marketingDraftLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 30 });
  app.use(/\/api\/admin\/tenants\/[^/]+\/marketing\/content\/draft/, marketingDraftLimiter);
  const cronLimiter = rateLimit({ windowMs: 60 * 1000, limit: 6 });
  app.use("/api/marketing-cron", cronLimiter, marketingCronRouter);
  app.use("/api/admin", marketingAdminRouter);

  return app;
}
