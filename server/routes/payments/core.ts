// server/routes/payments/core.ts
import { Request, Response } from "express";
import { prisma } from "../../db";

// Generic status lookup across all payment methods, backed by the database
// (previously a hardcoded stub that always returned "pending").
export const getPaymentStatus = async (req: Request, res: Response) => {
  try {
    const { paymentMethod, paymentId } = req.params;
    const payment = await prisma.payment.findFirst({
      where: { providerRef: paymentId, method: paymentMethod as any },
    });
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }
    res.json({ success: true, status: payment.status, amount: payment.amount, currency: payment.currency });
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment status" });
  }
};

export const getPaymentMethods = (req: Request, res: Response) => {
  res.json({ success: true, data: { methods: ["mpesa", "paypal", "creditcard"] } });
};
