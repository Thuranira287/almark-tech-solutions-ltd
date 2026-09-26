import { z } from "zod";

export const customerInfoSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(7).max(20),
  company: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().max(2000).optional().default(""),
});

export const createQuoteSchema = z.object({
  serviceIds: z.array(z.string().min(1)).min(1, "Select at least one service"),
  customerInfo: customerInfoSchema,
});

export const paymentMethodEnum = z.enum(["mpesa", "paypal", "bank", "creditcard"]);

export const mpesaInitiateSchema = z.object({
  phoneNumber: z.string().trim().min(9).max(15),
  amount: z.number().positive(),
  quoteId: z.string().min(1),
});

export const paypalCreateSchema = z.object({
  amount: z.number().positive(), 
  quoteId: z.string().min(1),
  returnUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export function formatZodError(err: z.ZodError) {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}

export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(150).optional().default(""),
  projectName: z.string().trim().max(150).optional().default(""),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().min(10, "Please write at least a few words").max(1000),
});
