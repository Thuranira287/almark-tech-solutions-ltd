import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";
import { fakeReqRes } from "./helpers/http";

const h = vi.hoisted(() => ({ db: null as any, receipts: [] as any[] }));
vi.mock("../db", () => ({ prisma: new Proxy({}, { get: (_t, k) => h.db[k as string] }) }));
vi.mock("../lib/receiptEmail", () => ({
  sendReceiptEmail: vi.fn(async (ref: string, payment: any) => {
    h.receipts.push({ ref, payment });
    return { success: true, message: "ok" };
  }),
}));

import { handleMpesaCallback, handleC2BConfirmation, handleC2BValidation } from "../routes/payments/mpesa";
import { timingSafeEqual } from "../lib/timingSafe";

const STK_SECRET = "stk-secret-value-123";
const C2B_SECRET = "c2b-secret-value-456";

function stkBody(over: Record<string, any> = {}, amount: number | null = 5000) {
  return {
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_REAL",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            ...(amount === null ? [] : [{ Name: "Amount", Value: amount }]),
            { Name: "MpesaReceiptNumber", Value: "QWE123" },
          ],
        },
        ...over,
      },
    },
  };
}

async function seed() {
  await h.db.quote.create({ data: { id: "q1", quoteRef: "ALM-AAAA1111BBBB2222", totalPrice: 10000, paidAmount: 0, status: "pending", customerEmail: "c@example.com" } });
  await h.db.payment.create({ data: { id: "p1", providerRef: "ws_CO_REAL", status: "pending", amount: 5000, method: "mpesa", quoteId: "q1" } });
}

async function callStk(body: any, query: Record<string, any> = { secret: STK_SECRET }) {
  const { req, res, out } = fakeReqRes({ query, body });
  await handleMpesaCallback(req, res, (() => {}) as any);
  return out;
}

async function state() {
  return {
    payment: await h.db.payment.findUnique({ where: { id: "p1" } }),
    quote: await h.db.quote.findUnique({ where: { id: "q1" } }),
  };
}

beforeEach(async () => {
  h.db = createFakeDb();
  h.receipts.length = 0;
  process.env.MPESA_CALLBACK_SECRET = STK_SECRET;
  process.env.MPESA_C2B_SECRET = C2B_SECRET;
  await seed();
});

describe("STK callback: secret authentication", () => {
  it("rejects when MPESA_CALLBACK_SECRET is not configured", async () => {
    delete process.env.MPESA_CALLBACK_SECRET;
    const out = await callStk(stkBody());
    expect(out.status).toBe(403);
    const s = await state();
    expect(s.payment.status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });

  it("rejects when the secret query parameter is missing", async () => {
    const out = await callStk(stkBody(), {});
    expect(out.status).toBe(403);
    expect((await state()).payment.status).toBe("pending");
  });

  it("rejects an incorrect secret, including one of a different length", async () => {
    for (const bad of ["wrong", "stk-secret-value-124", STK_SECRET + "x", ""]) {
      const out = await callStk(stkBody(), { secret: bad });
      expect(out.status).toBe(403);
    }
    expect((await state()).payment.status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });

  it("rejects a secret passed as an array (query-string parameter pollution)", async () => {
    const out = await callStk(stkBody(), { secret: [STK_SECRET, STK_SECRET] });
    expect(out.status).toBe(403);
  });

  it("accepts the correct secret and completes a valid payment", async () => {
    const out = await callStk(stkBody());
    expect(out.status).toBe(200);
    const s = await state();
    expect(s.payment.status).toBe("completed");
    expect(s.quote.paidAmount).toBe(5000);
    expect(s.quote.status).toBe("partially_paid");
    expect(h.receipts).toHaveLength(1);
  });
});

describe("timing-safe comparison", () => {
  it("is correct for equal, same-length-different, different-length, and empty/undefined inputs", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
    expect(timingSafeEqual("abc", "abcdef")).toBe(false);
    expect(timingSafeEqual("abcdef", "abc")).toBe(false);
    expect(timingSafeEqual(undefined, "abc")).toBe(false);
    expect(timingSafeEqual("abc", undefined)).toBe(false);
    expect(timingSafeEqual("", "")).toBe(false);
    expect(timingSafeEqual(undefined, undefined)).toBe(false);
  });

  it("the callback handlers use it rather than a plain === comparison", async () => {
    const fs = await import("fs");
    const src = fs.readFileSync(new URL("../routes/payments/mpesa.ts", import.meta.url), "utf8");
    expect(src).toContain("timingSafeEqual(providedSecret, expectedSecret)");
    expect(src).toContain("timingSafeEqual(provided, expected)");
    expect(src).not.toMatch(/query\.secret\s*[!=]==/);
  });
});

describe("STK callback: payment transaction validation", () => {
  it("a forged 'successful' callback for an unknown CheckoutRequestID does nothing", async () => {
    const out = await callStk(stkBody({ CheckoutRequestID: "ws_CO_ATTACKER" }, 999999));
    expect(out.status).toBe(200);
    const s = await state();
    expect(s.payment.status).toBe("pending");
    expect(s.quote.paidAmount).toBe(0);
    expect(await h.db.payment.count({ where: {} })).toBe(1);
    expect(h.receipts).toHaveLength(0);
  });

  it("a callback with the wrong CheckoutRequestID does not complete the real payment", async () => {
    await callStk(stkBody({ CheckoutRequestID: "ws_CO_WRONG" }));
    expect((await state()).payment.status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });

  it("a callback with the wrong amount does not complete the payment", async () => {
    await callStk(stkBody({}, 1));
    const s = await state();
    expect(s.payment.status).toBe("pending");
    expect(s.quote.paidAmount).toBe(0);
    expect(h.receipts).toHaveLength(0);
  });

  it("a callback with no Amount in its metadata does not complete the payment", async () => {
    await callStk(stkBody({}, null));
    expect((await state()).payment.status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });

  it("a payment whose quote no longer exists is not completed", async () => {
    await h.db.quote.delete({ where: { id: "q1" } });
    await callStk(stkBody());
    expect((await h.db.payment.findUnique({ where: { id: "p1" } })).status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });

  it("a duplicate callback is idempotent: one completion, one receipt", async () => {
    await callStk(stkBody());
    await callStk(stkBody());
    await callStk(stkBody());
    const s = await state();
    expect(s.payment.status).toBe("completed");
    expect(s.quote.paidAmount).toBe(5000);
    expect(h.receipts).toHaveLength(1);
  });

  it("a replay with a different amount after completion changes nothing", async () => {
    await callStk(stkBody());
    await callStk(stkBody({}, 9000));
    const s = await state();
    expect(s.quote.paidAmount).toBe(5000);
    expect(h.receipts).toHaveLength(1);
  });

  it("a failed M-Pesa callback (ResultCode != 0) marks the payment failed and sends no receipt", async () => {
    const out = await callStk(stkBody({ ResultCode: 1032, ResultDesc: "Request cancelled by user", CallbackMetadata: undefined }));
    expect(out.status).toBe(200);
    const s = await state();
    expect(s.payment.status).toBe("failed");
    expect(s.quote.paidAmount).toBe(0);
    expect(s.quote.status).toBe("pending");
    expect(h.receipts).toHaveLength(0);
  });
});

describe("C2B (Paybill) callbacks: secret authentication", () => {
  const c2b = (over: Record<string, any> = {}) => ({
    TransID: "RKTQDM7W6S",
    BillRefNumber: "ALM-AAAA1111BBBB2222",
    TransAmount: "3000.00",
    MSISDN: "254700000000",
    ...over,
  });

  async function callConfirm(body: any, query: Record<string, any> = { secret: C2B_SECRET }) {
    const { req, res, out } = fakeReqRes({ query, body });
    await handleC2BConfirmation(req, res, (() => {}) as any);
    return out;
  }

  it("confirmation rejects when MPESA_C2B_SECRET is not configured", async () => {
    delete process.env.MPESA_C2B_SECRET;
    const out = await callConfirm(c2b());
    expect(out.status).toBe(403);
    expect(await h.db.payment.count({ where: { providerRef: "RKTQDM7W6S" } })).toBe(0);
  });

  it("confirmation rejects a missing or incorrect secret", async () => {
    for (const query of [{}, { secret: "nope" }, { secret: C2B_SECRET + "x" }]) {
      const out = await callConfirm(c2b(), query);
      expect(out.status).toBe(403);
    }
    expect(h.receipts).toHaveLength(0);
  });

  it("validation rejects when the secret is not configured, missing, or incorrect", async () => {
    delete process.env.MPESA_C2B_SECRET;
    for (const query of [{ secret: C2B_SECRET }, {}]) {
      const { req, res, out } = fakeReqRes({ query, body: c2b() });
      await handleC2BValidation(req, res, (() => {}) as any);
      expect(out.status).toBe(403);
    }
    process.env.MPESA_C2B_SECRET = C2B_SECRET;
    const { req, res, out } = fakeReqRes({ query: { secret: "bad" }, body: c2b() });
    await handleC2BValidation(req, res, (() => {}) as any);
    expect(out.status).toBe(403);
  });

  it("with the correct secret, a matched payment completes and sends exactly one receipt", async () => {
    const out = await callConfirm(c2b());
    expect(out.status).toBe(200);
    expect(out.body.ResultCode).toBe("0");
    const payment = await h.db.payment.findUnique({ where: { providerRef: "RKTQDM7W6S" } });
    expect(payment.status).toBe("completed");
    expect(payment.amount).toBe(3000);
    expect(h.receipts).toHaveLength(1);
  });

  it("a duplicate TransID is idempotent", async () => {
    await callConfirm(c2b());
    await callConfirm(c2b());
    expect(h.receipts).toHaveLength(1);
    expect((await h.db.quote.findUnique({ where: { id: "q1" } })).paidAmount).toBe(3000);
  });

  it("an unmatched BillRefNumber is acknowledged but records and receipts nothing", async () => {
    const out = await callConfirm(c2b({ BillRefNumber: "ALM-DOESNOTEXIST0000" }));
    expect(out.status).toBe(200);
    expect(await h.db.payment.count({ where: { providerRef: "RKTQDM7W6S" } })).toBe(0);
    expect(h.receipts).toHaveLength(0);
  });
});
