import { RequestHandler } from "express";
import fetch from "node-fetch";
import { mpesaInitiateSchema, mpesaManualSchema, formatZodError } from "../../lib/validation";
import { logger } from "../../lib/logger";
import {
  assertQuoteAndAmount,
  recordPendingPayment,
  recordManualPayment,
  markPaymentCompleted,
  markPaymentFailed,
  verifyAndCompleteStkPayment,
  PaymentValidationError,
} from "../../lib/paymentGuard";
import { timingSafeEqual } from "../../lib/timingSafe";

// ---- Interfaces ----
export interface MpesaPaymentRequest {
  phoneNumber: string;
  amount: number;
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
  };
}

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  businessShortCode: string;
  passkey: string;
  callbackUrl: string;
  environment: "sandbox" | "production";
}

interface MpesaOAuthResponse {
  access_token: string;
  expires_in: string;
  errorCode?: string;
  errorMessage?: string;
  error_description?: string;
}

interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
  errorCode?: string;
  errorMessage?: string;
}

interface MpesaQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
  errorCode?: string;
  errorMessage?: string;
}

// ---- Config ----
const mpesaConfig: MpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || "",
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || "",
  businessShortCode: process.env.MPESA_SHORTCODE || "",
  passkey: process.env.MPESA_PASSKEY || "",
  callbackUrl: process.env.MPESA_CALLBACK_URL || "",
  environment:
    process.env.NODE_ENV === "production" ? "production" : "sandbox",
};

// ---- Service ----
class MpesaService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      mpesaConfig.environment === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
  }

  // Get OAuth token
  async getAccessToken(): Promise<string> {
    const auth = Buffer.from(
      `${mpesaConfig.consumerKey}:${mpesaConfig.consumerSecret}`
    ).toString("base64");

    const response = await fetch(
      `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = (await response.json()) as MpesaOAuthResponse;

    if (!response.ok) {
      throw new Error(
        `Failed to get access token: ${data.error_description || data.errorMessage || "Unknown error"}`
      );
    }

    return data.access_token;
  }

  // Generate timestamp
  generateTimestamp(): string {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      ("0" + (now.getMonth() + 1)).slice(-2) +
      ("0" + now.getDate()).slice(-2) +
      ("0" + now.getHours()).slice(-2) +
      ("0" + now.getMinutes()).slice(-2) +
      ("0" + now.getSeconds()).slice(-2)
    );
  }

  // Generate password
  generatePassword(timestamp: string): string {
    const data =
      mpesaConfig.businessShortCode + mpesaConfig.passkey + timestamp;
    return Buffer.from(data).toString("base64");
  }

  // Format phone number
  formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("0")) {
      cleaned = "254" + cleaned.slice(1);
    } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
      cleaned = "254" + cleaned;
    } else if (!cleaned.startsWith("254")) {
      cleaned = "254" + cleaned;
    }
    return cleaned;
  }

  // Initiate STK Push
  async initiateSTKPush(
    request: MpesaPaymentRequest
  ): Promise<MpesaSTKPushResponse> {
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber);

    const payload = {
      BusinessShortCode: mpesaConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: request.amount,
      PartyA: formattedPhone,
      PartyB: mpesaConfig.businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: mpesaConfig.callbackUrl,
      AccountReference: `ALM-${request.quoteId}`,
      TransactionDesc: `Payment for Quote ${request.quoteId} - Almark Tech Solutions`,
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as MpesaSTKPushResponse;

    if (!response.ok) {
      throw new Error(
        `M-Pesa STK Push failed: ${data.errorMessage || "Unknown error"}`
      );
    }

    return data;
  }

  // Query STK Push status
  async querySTKPushStatus(
    checkoutRequestId: string
  ): Promise<MpesaQueryResponse> {
    const accessToken = await this.getAccessToken();
    const timestamp = this.generateTimestamp();
    const password = this.generatePassword(timestamp);

    const payload = {
      BusinessShortCode: mpesaConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    };

    const response = await fetch(
      `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = (await response.json()) as MpesaQueryResponse;

    if (!response.ok) {
      throw new Error(
        `M-Pesa query failed: ${data.errorMessage || "Unknown error"}`
      );
    }

    return data;
  }

  // Registers where Safaricom should send C2B (Paybill) payment
  // notifications. A one-time (or infrequent) setup call, not something
  // that runs per-request — see registerC2BUrlsHandler below, which an
  // admin triggers manually after deploying. Safaricom blocks any
  // callback URL containing "mpesa"/"m-pesa"/"safaricom", so these must be
  // neutral paths (/api/payments/c2b/...), unlike the existing STK
  // callback path, which predates this and is left alone here.
  async registerC2BUrls(): Promise<{ ResponseCode: string; ResponseDescription: string }> {
    const accessToken = await this.getAccessToken();
    const confirmationURL = process.env.MPESA_C2B_CONFIRMATION_URL;
    const validationURL = process.env.MPESA_C2B_VALIDATION_URL;
    if (!confirmationURL) {
      throw new Error("MPESA_C2B_CONFIRMATION_URL is not set");
    }

    const response = await fetch(`${this.baseUrl}/mpesa/c2b/v1/registerurl`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ShortCode: mpesaConfig.businessShortCode,
        ResponseType: "Completed",
        ConfirmationURL: confirmationURL,
        ValidationURL: validationURL || confirmationURL,
      }),
    });

    const data = (await response.json()) as { errorMessage?: string; ResponseCode?: string; ResponseDescription?: string };
    if (!response.ok) {
      throw new Error(`C2B URL registration failed: ${data.errorMessage || JSON.stringify(data)}`);
    }
    return { ResponseCode: data.ResponseCode ?? "", ResponseDescription: data.ResponseDescription ?? "" };
  }
}

const mpesaService = new MpesaService();

// ---- Handlers ----

// Initiate M-Pesa payment
export const initiateMpesaPayment: RequestHandler = async (req, res) => {
  try {
    const parsed = mpesaInitiateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
    }
    const { phoneNumber, amount, quoteId } = parsed.data;

    if (amount < 1 || amount > 70000) {
      return res.status(400).json({
        success: false,
        message: "Amount must be between KES 1 and KES 70,000",
      });
    }

    // Server-side authority check
    const quote = await assertQuoteAndAmount(quoteId, amount);

    logger.debug(
      `Initiating M-Pesa payment: KES ${amount} from ${phoneNumber} for quote ${quoteId}`
    );

    const result = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      quoteId,
      customerInfo: { name: quote.customerName, email: quote.customerEmail },
    });

    await recordPendingPayment({
      quoteId: quote.id,
      method: "mpesa",
      amount,
      currency: "KES",
      providerRef: result.CheckoutRequestID,
    });

    res.json({
      success: true,
      message: "M-Pesa payment initiated successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("M-Pesa payment initiation error:", error);
    res.status(500).json({
      success: false,
      message:
        "Failed to initiate M-Pesa payment",
    });
  }
};

// Query M-Pesa payment status
export const queryMpesaPayment: RequestHandler = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    if (!checkoutRequestId) {
      return res.status(400).json({
        success: false,
        message: "Missing checkoutRequestId parameter",
      });
    }

    const result = await mpesaService.querySTKPushStatus(checkoutRequestId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("M-Pesa query error:", error);
    res.status(500).json({
      success: false,
      message:
        "Failed to query M-Pesa payment",
    });
  }
};

// M-Pesa callback handler
export const handleMpesaCallback: RequestHandler = async (req, res) => {
  try {
    const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
    const providedSecret = req.query.secret;
    if (!expectedSecret || typeof providedSecret !== "string" || !timingSafeEqual(providedSecret, expectedSecret)) {
      console.warn("M-Pesa callback rejected: missing/invalid secret");
      return res.status(403).json({ ResultCode: 1, ResultDesc: "Rejected" });
    }

    logger.debug("M-Pesa Callback received:", JSON.stringify(req.body, null, 2));

    const callbackData = req.body;

    if (callbackData.Body?.stkCallback) {
      const callback = callbackData.Body.stkCallback;
      const resultCode = callback.ResultCode;
      const checkoutRequestId = callback.CheckoutRequestID;

      if (resultCode === 0) {
        logger.debug(
          `M-Pesa payment successful for CheckoutRequestID: ${checkoutRequestId}`
        );

        const callbackMetadata = callback.CallbackMetadata?.Item || [];
        const rawAmount = callbackMetadata.find((item: any) => item.Name === "Amount")?.Value;
        const paymentDetails = {
          amount: rawAmount,
          mpesaReceiptNumber: callbackMetadata.find(
            (item: any) => item.Name === "MpesaReceiptNumber"
          )?.Value,
          transactionDate: callbackMetadata.find(
            (item: any) => item.Name === "TransactionDate"
          )?.Value,
          phoneNumber: callbackMetadata.find(
            (item: any) => item.Name === "PhoneNumber"
          )?.Value,
        };

        logger.debug("Payment details:", paymentDetails);

        // A valid secret only proves the request came through Safaricom's
        // callback mechanism — it says nothing about which payment this is
        // for or whether the amount is right. verifyAndCompleteStkPayment
        // checks CheckoutRequestID match, quote/payment relationship,
        // amount match, and not-already-completed before ever calling
        // markPaymentCompleted.
        const verification = await verifyAndCompleteStkPayment({
          checkoutRequestId,
          callbackAmount: typeof rawAmount === "number" ? rawAmount : parseFloat(rawAmount),
          rawCallback: { ...callback, paymentDetails },
        });
        if (!verification.ok) {
          logger.error(`[MPESA] STK callback verification failed for ${checkoutRequestId}: ${verification.reason}`);
        }
      } else {
        logger.debug(
          `M-Pesa payment failed for CheckoutRequestID: ${checkoutRequestId}`,
          callback.ResultDesc
        );
        await markPaymentFailed(checkoutRequestId, callback);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ success: false });
  }
};

// Registers a real, auditable record of a manually-made M-Pesa payment
// (e.g. the customer was given Paybill instructions because STK push
// isn't available right now). This never claims the payment is complete
// and never sends a receipt — it only exists so an admin can later
// confirm the money actually arrived (POST
// /api/admin/payments/:paymentId/confirm), which is the point at which
// markPaymentCompleted actually fires the receipt email. Replaces a
// previous client-side fallback that silently reported "success" whenever
// the real STK push call failed, with no record created anywhere.
export const registerManualMpesaPayment: RequestHandler = async (req, res) => {
  try {
    const parsed = mpesaManualSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
    }
    const { amount, quoteId } = parsed.data;

    const { payment } = await recordManualPayment({ quoteRef: quoteId, amount, method: "mpesa" });

    res.json({
      success: true,
      message: "Manual payment recorded — pending confirmation",
      data: {
        paymentId: payment.id,
        instructions: {
          paybillNumber: "0716227616",
          accountName: "Almark Tech Solutions",
          amount,
          reference: quoteId,
        },
      },
    });
  } catch (error) {
    if (error instanceof PaymentValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error("Manual M-Pesa registration error:", error);
    res.status(500).json({ success: false, message: "Failed to record manual payment" });
  }
};

function checkC2BSecret(req: Parameters<RequestHandler>[0]): boolean {
  const expected = process.env.MPESA_C2B_SECRET;
  const provided = req.query.secret;
  return typeof provided === "string" && timingSafeEqual(provided, expected);
}

// Safaricom only calls this if "External Validation" has been specifically
// enabled on the shortcode by Safaricom (disabled by default for most
// Paybills). When it IS enabled, this is the one place we could reject a
// payment before it's processed — here, that only happens for a
// completely unrecognized BillRefNumber, since by the time this fires the
// customer has already committed to sending money and the honest default
// is to accept and reconcile at confirmation time.
export const handleC2BValidation: RequestHandler = async (req, res) => {
  if (!checkC2BSecret(req)) {
    return res.status(403).json({ ResultCode: "C2B00016", ResultDesc: "Rejected" });
  }
  try {
    const billRefNumber = String(req.body?.BillRefNumber || "").trim();
    if (!billRefNumber) {
      return res.json({ ResultCode: "C2B00012", ResultDesc: "Rejected" });
    }
    const { prisma } = await import("../../db");
    const quote = await prisma.quote.findUnique({ where: { quoteRef: billRefNumber } });
    if (!quote) {
      logger.error(`[C2B] Validation: no quote found for BillRefNumber "${billRefNumber}"`);
      return res.json({ ResultCode: "C2B00012", ResultDesc: "Rejected" });
    }
    res.json({ ResultCode: "0", ResultDesc: "Accepted" });
  } catch (error) {
    logger.error("[C2B] Validation error:", error);
    // Fail open rather than blocking a real payment on our own error.
    res.json({ ResultCode: "0", ResultDesc: "Accepted" });
  }
};

// The real automation: Safaricom calls this once money has actually
// landed in the Paybill, for every C2B payment — including the manual
// Paybill payments this subsystem's "manual M-Pesa" instructions ask
// customers to make. No admin action required for the normal case. This
// is always acknowledged with ResultCode 0 (per Daraja's requirement —
// confirmations can't be rejected, the money has already moved); matching
// failures are logged loudly for manual admin follow-up instead.
export const handleC2BConfirmation: RequestHandler = async (req, res) => {
  if (!checkC2BSecret(req)) {
    return res.status(403).json({ ResultCode: "C2B00016", ResultDesc: "Rejected" });
  }

  const ack = () => res.json({ ResultCode: "0", ResultDesc: "Success" });

  try {
    const body = req.body || {};
    const transId = String(body.TransID || "");
    const billRefNumber = String(body.BillRefNumber || "").trim();
    const transAmount = parseFloat(body.TransAmount);

    if (!transId || !billRefNumber || Number.isNaN(transAmount)) {
      logger.error("[C2B] Confirmation payload missing required fields:", JSON.stringify(body));
      return ack();
    }

    const { prisma } = await import("../../db");
    const quote = await prisma.quote.findUnique({ where: { quoteRef: billRefNumber } });
    if (!quote) {
      // Real money arrived that we can't match to a quote — this needs a
      // human to reconcile manually, but Safaricom still gets a clean ack
      // so it doesn't retry indefinitely.
      logger.error(`[C2B] Unmatched payment: TransID=${transId} amount=${transAmount} BillRefNumber="${billRefNumber}" — needs manual reconciliation`);
      return ack();
    }

    try {
      await recordPendingPayment({
        quoteId: quote.id,
        method: "mpesa",
        amount: transAmount,
        currency: "KES",
        providerRef: transId,
      });
    } catch (error) {
      // providerRef is unique — a create failure here almost certainly
      // means Safaricom retried a confirmation we already processed.
      logger.debug(`[C2B] TransID ${transId} already recorded — treating as idempotent repeat`);
      return ack();
    }

    await markPaymentCompleted(transId, body);
    logger.debug(`[C2B] Confirmed manual M-Pesa payment for quote ${billRefNumber}: KES ${transAmount} (TransID ${transId})`);
    return ack();
  } catch (error) {
    logger.error("[C2B] Confirmation handler error:", error);
    // Still ack — Safaricom retrying won't fix an internal error, and
    // failing to ack risks it hammering this endpoint.
    return ack();
  }
};

// Admin-triggered, not customer-facing: run once after deploying (and
// again any time the C2B URLs change) to tell Safaricom where to send
// Paybill payment notifications. See routes/admin.ts.
export const registerC2BUrlsHandler: RequestHandler = async (_req, res) => {
  try {
    const result = await mpesaService.registerC2BUrls();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("C2B URL registration error:", error);
    res.status(500).json({ success: false, message: "Registration failed" });
  }
};
