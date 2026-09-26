// server/lib/paymentGuard.ts
// Shared logic every payment-initiation route (mpesa/paypal/bank) must go
// through: look up the quote server-side, and reject any requested amount
// that exceeds the real outstanding balance. This is what prevents the
// "pay KES 1 for a KES 35,000 quote" bypass — the client can no longer
// dictate what a quote costs, only how much of the real balance to pay now.
import { prisma } from "../db";

export type PaymentMethodType = "mpesa" | "paypal" | "bank" | "creditcard";

export class PaymentValidationError extends Error {}

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
  quoteId: string; // internal Quote.id (not quoteRef)
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

// Marks a payment completed and rolls the amount into the quote's paidAmount,
// idempotently — a duplicate callback for the same providerRef is a no-op.
export async function markPaymentCompleted(providerRef: string, rawCallback?: unknown) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { providerRef } });
    if (!payment) return null;
    if (payment.status === "completed") return payment; // idempotent

    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "completed", rawCallback: rawCallback as any },
    });

    const quote = await tx.quote.update({
      where: { id: payment.quoteId },
      data: { paidAmount: { increment: payment.amount } },
    });

    await tx.quote.update({
      where: { id: quote.id },
      data: { status: quote.paidAmount >= quote.totalPrice ? "paid" : "partially_paid" },
    });

    return updated;
  });
}

export async function markPaymentFailed(providerRef: string, rawCallback?: unknown) {
  return prisma.payment.updateMany({
    where: { providerRef, status: "pending" },
    data: { status: "failed", rawCallback: rawCallback as any },
  });
}
