import crypto from "crypto";
import { prisma } from "../db";
import { sendReceiptEmail } from "./receiptEmail";
import { logger } from "./logger";

export type PaymentMethodType = "mpesa" | "paypal" | "creditcard";

export class PaymentValidationError extends Error {}

export interface StkVerificationResult {
  ok: boolean;
  reason?: string;
  alreadyCompleted?: boolean;
}

// The full validation chain the STK callback must pass before
// markPaymentCompleted ever runs — a valid callback secret proves the
// request came through Safaricom's callback mechanism, but says nothing
// about WHICH payment it's confirming or whether the amount matches what
// we actually asked for. Each check below is independent of the secret
// check and of each other; any failure stops short of completion.
export async function verifyAndCompleteStkPayment(params: {
  checkoutRequestId: string;
  callbackAmount: number | undefined;
  rawCallback: unknown;
}): Promise<StkVerificationResult> {
  const { checkoutRequestId, callbackAmount, rawCallback } = params;

  if (!checkoutRequestId) {
    return { ok: false, reason: "missing_checkout_request_id" };
  }

  const payment = await prisma.payment.findUnique({ where: { providerRef: checkoutRequestId } });
  if (!payment) {
    logger.error(`[MPESA] STK callback for unknown CheckoutRequestID: ${checkoutRequestId}`);
    return { ok: false, reason: "no_matching_payment" };
  }

  if (payment.status === "completed") {
    return { ok: true, alreadyCompleted: true };
  }

  const quote = await prisma.quote.findUnique({ where: { id: payment.quoteId } });
  if (!quote) {
    logger.error(`[MPESA] Payment ${payment.id} (ref ${checkoutRequestId}) has no matching quote — data integrity issue`);
    return { ok: false, reason: "no_matching_quote" };
  }

  if (typeof callbackAmount !== "number" || Number.isNaN(callbackAmount)) {
    logger.error(`[MPESA] STK callback for ${checkoutRequestId} missing/invalid Amount in metadata`);
    return { ok: false, reason: "missing_amount" };
  }
  if (Math.round(callbackAmount) !== Math.round(payment.amount)) {
    logger.error(
      `[MPESA] Amount mismatch for ${checkoutRequestId}: expected ${payment.amount}, callback reported ${callbackAmount}`,
    );
    return { ok: false, reason: "amount_mismatch" };
  }

  await markPaymentCompleted(checkoutRequestId, rawCallback);
  return { ok: true };
}

export async function assertQuoteAndAmount(quoteRef: string, requestedAmount: number) {
  const quote = await prisma.quote.findUnique({ where: { quoteRef } });
  if (!quote) throw new PaymentValidationError("Quote not found");
  if (quote.status === "cancelled") throw new PaymentValidationError("This quote has been cancelled");

  const balance = quote.totalPrice - quote.paidAmount;
  if (balance <= 0) throw new PaymentValidationError("This quote is already fully paid");
  if (requestedAmount > balance) {
    throw new PaymentValidationError(
      `Amount exceeds outstanding balance of KES ${balance.toLocaleString()}`,
    );
  }
  if (requestedAmount <= 0) throw new PaymentValidationError("Amount must be greater than zero");

  return quote;
}

export async function recordPendingPayment(opts: {
  quoteId: string;
  method: PaymentMethodType;
  amount: number;
  currency: string;
  providerRef?: string | null;
}) {
  return prisma.payment.create({
    data: {
      quoteId: opts.quoteId,
      method: opts.method,
      amount: opts.amount,
      currency: opts.currency,
      status: "pending",
      providerRef: opts.providerRef ?? null,
    },
  });
}

// Records a payment the customer says they made manually (e.g. M-Pesa
// Paybill, no STK push / no automatic callback). This does NOT mark the
// payment completed and does NOT trigger a receipt — it only creates a
// real, auditable "pending" row so an admin can later confirm it actually
// arrived (see adminConfirmPayment in routes/admin.ts) and so the receipt
// email only fires once that confirmation happens, same as every other
// payment method.
export async function recordManualPayment(opts: { quoteRef: string; amount: number; method: PaymentMethodType }) {
  const quote = await assertQuoteAndAmount(opts.quoteRef, opts.amount);
  const providerRef = `manual-${quote.id}-${crypto.randomUUID()}`;
  const payment = await recordPendingPayment({
    quoteId: quote.id,
    method: opts.method,
    amount: opts.amount,
    currency: "KES",
    providerRef,
  });
  return { payment, quote };
}

// The single place every payment method (M-Pesa callback, PayPal
// capture/webhook, Stripe webhook, and an admin manually confirming a
// pending payment) converges on to mark a payment completed. Rolls the
// amount into the quote's paidAmount, and — only on a genuine first-time
// completion, never on an idempotent repeat — sends the receipt email.
// This is deliberately the ONLY place that sends a payment receipt: it
// only runs once money has actually been confirmed received, never at
// quote-creation time and never from a client-supplied "I paid" claim.
export async function markPaymentCompleted(providerRef: string, rawCallback?: unknown) {
  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { providerRef } });
    if (!payment) return null;
    if (payment.status === "completed") return { payment, quote: null }; // idempotent — already sent a receipt the first time

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "completed", rawCallback: rawCallback as any },
    });

    const incremented = await tx.quote.update({
      where: { id: payment.quoteId },
      data: { paidAmount: { increment: payment.amount } },
    });

    const quote = await tx.quote.update({
      where: { id: incremented.id },
      data: { status: incremented.paidAmount >= incremented.totalPrice ? "paid" : "partially_paid" },
    });

    return { payment: updated, quote };
  });

  if (result?.quote) {
    try {
      await sendReceiptEmail(result.quote.quoteRef, { method: result.payment.method, amount: result.payment.amount });
    } catch (error) {
      // A failed email must never undo a confirmed payment. Logged loudly
      // so it's visible in production monitoring and can be resent by an
      // admin via POST /api/admin/quotes/:quoteId/resend-receipt.
      logger.error("[PAYMENT] Payment confirmed but receipt email failed to send:", error);
    }
  }

  return result?.payment ?? null;
}

export async function markPaymentFailed(providerRef: string, rawCallback?: unknown) {
  return prisma.payment.updateMany({
    where: { providerRef, status: "pending" },
    data: { status: "failed", rawCallback: rawCallback as any },
  });
}
