// server/routes/payments/index.ts
import express from "express";
import {
  createPayPalPayment,
  capturePayPalPayment,
  getPayPalPaymentDetails,
  handlePayPalWebhook,
} from "./paypal"; // adjust if you re-export from bank.ts/mpesa.ts/paypal.ts

import {  createBankPayment,
  getBankPaymentStatus,
  getSupportedBanks,
  handleBankPaymentIPN
} from "./bank";

import {
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
} from "./mpesa";

import {
  createPayment,
  getPaymentStatus,
  capturePayment,
  getPaymentMethods,
} from "./core" 

export const paymentsRouter = express.Router();

// Unified payment routes
paymentsRouter.post("/create", createPayment);
paymentsRouter.get("/:paymentMethod/:paymentId/status", getPaymentStatus);
paymentsRouter.post("/:paymentMethod/:paymentId/capture", capturePayment);
paymentsRouter.get("/methods", getPaymentMethods);

// M-Pesa
paymentsRouter.post("/mpesa/initiate", initiateMpesaPayment);
paymentsRouter.get("/mpesa/:checkoutRequestId/status", queryMpesaPayment);
paymentsRouter.post("/mpesa/callback", handleMpesaCallback);

// PayPal
paymentsRouter.post("/paypal/create", createPayPalPayment);
paymentsRouter.post("/paypal/:orderId/capture", capturePayPalPayment);
paymentsRouter.get("/paypal/:orderId/details", getPayPalPaymentDetails);
paymentsRouter.post("/paypal/webhook", handlePayPalWebhook);

// Bank
paymentsRouter.post("/bank/create", createBankPayment);
paymentsRouter.get("/bank/:orderTrackingId/status", getBankPaymentStatus);
paymentsRouter.get("/bank/banks", getSupportedBanks);
paymentsRouter.get("/bank/ipn", handleBankPaymentIPN);
paymentsRouter.post("/bank/ipn", handleBankPaymentIPN);
