import express from "express";
import {
  createPayPalPayment,
  capturePayPalPayment,
  getPayPalPaymentDetails,
  handlePayPalWebhook,
} from "./paypal";

import {
  initiateMpesaPayment,
  queryMpesaPayment,
  handleMpesaCallback,
  registerManualMpesaPayment,
  handleC2BValidation,
  handleC2BConfirmation,
} from "./mpesa";

import { createCardCheckoutSession } from "./card";

import { getPaymentStatus, getPaymentMethods } from "./core";

export const paymentsRouter = express.Router();

// Generic
paymentsRouter.get("/methods", getPaymentMethods);
paymentsRouter.get("/:paymentMethod/:paymentId/status", getPaymentStatus);

// M-Pesa
paymentsRouter.post("/mpesa/initiate", initiateMpesaPayment);
paymentsRouter.post("/mpesa/manual", registerManualMpesaPayment);
paymentsRouter.get("/mpesa/:checkoutRequestId/status", queryMpesaPayment);
paymentsRouter.post("/mpesa/callback", handleMpesaCallback);

// C2B (Paybill) automatic payment notifications — registered with
// Safaricom via POST /api/admin/payments/mpesa/register-c2b. Deliberately
// named without "mpesa"/"safaricom" in the path: Safaricom's URL
// registration rejects callback URLs containing those words.
paymentsRouter.post("/c2b/validation", handleC2BValidation);
paymentsRouter.post("/c2b/confirmation", handleC2BConfirmation);

// PayPal
paymentsRouter.post("/paypal/create", createPayPalPayment);
paymentsRouter.post("/paypal/:orderId/capture", capturePayPalPayment);
paymentsRouter.get("/paypal/:orderId/details", getPayPalPaymentDetails);
paymentsRouter.post("/paypal/webhook", handlePayPalWebhook);

// Card
paymentsRouter.post("/card/create-checkout-session", createCardCheckoutSession);
