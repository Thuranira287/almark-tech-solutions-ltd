import { RequestHandler } from "express";
import { z } from "zod";
import { requireAdmin } from "../lib/adminAuth";
import { sendReceiptEmail } from "../lib/receiptEmail";

// Admin-only. Receipts are sent automatically once a payment is actually
// confirmed (see server/lib/paymentGuard.ts) — this exists only for a
// support case where an admin needs to resend one, e.g. a customer says
// they never got the email.
const resendSchema = z.object({ quoteId: z.string().min(1) });

export const resendReceipt: RequestHandler = [requireAdmin, async (req, res) => {
  const parsed = resendSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: "Invalid request" });
  }
  const result = await sendReceiptEmail(parsed.data.quoteId);
  if (!result.success) {
    return res.status(404).json({ success: false, message: result.message });
  }
  res.json({ success: true, message: result.message });
}] as any;
