import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleDemo } from "./routes/demo";
import { sendQuoteReceipt } from "./routes/email";
import { paymentsRouter } from "./routes/payments";
import { handleStripeWebhook } from "./routes/payments/card";
import { createQuote, getQuote, listServices } from "./routes/quotes";
import { submitTestimonial, listApprovedTestimonials } from "./routes/testimonials";
import {
  adminLogin,
  adminLogout,
  adminCheckSession,
  adminListQuotes,
  adminUpdateQuoteStatus,
  adminListUsers,
  adminCreateUser,
  adminDeleteUser,
  adminListTestimonials,
  adminUpdateTestimonialStatus,
  adminDeleteTestimonial,
  adminLoginLimiter,
} from "./routes/admin";

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
    "PAYPAL_CLIENT_ID",
    "PAYPAL_WEBHOOK_ID",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "SENDGRID_API_KEY",
    "ALLOWED_ORIGINS",
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

  // Netlify (and most PaaS hosts) sit behind a reverse proxy, so req.ip
  // must be read from X-Forwarded-For to reflect the real client IP —
  // needed for the admin IP allowlist and for rate limiting to key on the
  // right address rather than the proxy's.
  app.set("trust proxy", 1);

  // Security headers
  app.use(helmet());

  // CORS allowlist — comma-separated origins in ALLOWED_ORIGINS.
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
      credentials: true, // required so the admin session cookie is sent/received
    }),
  );

  // Stripe webhook needs the raw, unparsed request body to verify its
  // signature, so it's mounted here — before express.json() below touches
  // the body at all.
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
  app.use("/api/payments/paypal/create", paymentLimiter);
  app.use("/api/payments/card/create-checkout-session", paymentLimiter);
  app.use("/api/send-quote-receipt", paymentLimiter);
  app.use("/api/admin/login", adminLoginLimiter);
  // Testimonial submissions are public and unauthenticated, so they get
  // their own tight limit — this is the other endpoint (besides payments)
  // that's worth protecting from spam/abuse specifically.
  const testimonialLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5 });
  app.use("/api/testimonials", (req, res, next) => (req.method === "POST" ? testimonialLimiter(req, res, next) : next()));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // Quotes (server-authoritative pricing)
  app.get("/api/services", listServices);
  app.post("/api/quotes", createQuote);
  app.get("/api/quotes/:quoteId", getQuote);

  // Quote receipt email
  app.post("/api/send-quote-receipt", sendQuoteReceipt);

  // Testimonials
  app.post("/api/testimonials", submitTestimonial);
  app.get("/api/testimonials", listApprovedTestimonials);

  // Payments
  app.use("/api/payments", paymentsRouter);

  // Admin — not linked from any public page or nav. Reachable only by
  // someone who knows the URL, gated by requireAdmin on every route but login.
  app.post("/api/admin/login", adminLogin);
  app.post("/api/admin/logout", adminLogout);
  app.get("/api/admin/session", adminCheckSession);
  app.get("/api/admin/quotes", adminListQuotes);
  app.patch("/api/admin/quotes/:quoteId/status", adminUpdateQuoteStatus);
  app.get("/api/admin/users", adminListUsers);
  app.post("/api/admin/users", adminCreateUser);
  app.delete("/api/admin/users/:userId", adminDeleteUser);
  app.get("/api/admin/testimonials", adminListTestimonials);
  app.patch("/api/admin/testimonials/:testimonialId/status", adminUpdateTestimonialStatus);
  app.delete("/api/admin/testimonials/:testimonialId", adminDeleteTestimonial);

  return app;
}
