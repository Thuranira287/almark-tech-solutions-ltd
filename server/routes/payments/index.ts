import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { sendQuoteReceipt } from "./routes/email";
import {
  createPayment,
  getPaymentStatus,
  capturePayment,
  getPaymentMethods,
  // M-Pesa specific routes
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
  // PayPal specific routes
  createPayPalPayment,
  capturePayPalPayment,
  getPayPalPaymentDetails,
  handlePayPalWebhook,
  // Bank specific routes
  createBankPayment,
  getBankPaymentStatus,
  getSupportedBanks,
  handleBankPaymentIPN
} from "./routes/payments/index";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Quote and email routes
  app.post("/api/send-quote-receipt", sendQuoteReceipt);

  // Unified payment routes
  app.post("/api/payments/create", createPayment);
  app.get("/api/payments/:paymentMethod/:paymentId/status", getPaymentStatus);
  app.post("/api/payments/:paymentMethod/:paymentId/capture", capturePayment);
  app.get("/api/payments/methods", getPaymentMethods);

  // M-Pesa specific routes
  app.post("/api/payments/mpesa/initiate", initiateMpesaPayment);
  app.get("/api/payments/mpesa/:checkoutRequestId/status", queryMpesaPayment);
  app.post("/api/payments/mpesa/callback", handleMpesaCallback);

  // PayPal specific routes
  app.post("/api/payments/paypal/create", createPayPalPayment);
  app.post("/api/payments/paypal/:orderId/capture", capturePayPalPayment);
  app.get("/api/payments/paypal/:orderId/details", getPayPalPaymentDetails);
  app.post("/api/payments/paypal/webhook", handlePayPalWebhook);

  // Bank payment specific routes
  app.post("/api/payments/bank/create", createBankPayment);
  app.get("/api/payments/bank/:orderTrackingId/status", getBankPaymentStatus);
  app.get("/api/payments/bank/banks", getSupportedBanks);
  app.get("/api/payments/bank/ipn", handleBankPaymentIPN);
  app.post("/api/payments/bank/ipn", handleBankPaymentIPN);

  return app;
}
