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
} from "./mpesa";

import { createCardCheckoutSession } from "./card";

import { getPaymentStatus, getPaymentMethods } from "./core";

export const paymentsRouter = express.Router();

// Generic
paymentsRouter.get("/methods", getPaymentMethods);
paymentsRouter.get("/:paymentMethod/:paymentId/status", getPaymentStatus);

// M-Pesa
paymentsRouter.post("/mpesa/initiate", initiateMpesaPayment);
paymentsRouter.get("/mpesa/:checkoutRequestId/status", queryMpesaPayment);
paymentsRouter.post("/mpesa/callback", handleMpesaCallback);

// PayPal
paymentsRouter.post("/paypal/create", createPayPalPayment);
paymentsRouter.post("/paypal/:orderId/capture", capturePayPalPayment);
paymentsRouter.get("/paypal/:orderId/details", getPayPalPaymentDetails);
paymentsRouter.post("/paypal/webhook", handlePayPalWebhook);

// Card
paymentsRouter.post("/card/create-checkout-session", createCardCheckoutSession);
