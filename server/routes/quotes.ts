import { RequestHandler } from "express";
import { prisma } from "../db";
import { createQuoteSchema, formatZodError } from "../lib/validation";

function generateQuoteRef() {
  return `ALM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const createQuote: RequestHandler = async (req, res) => {
  const parsed = createQuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  }
  const { serviceIds, customerInfo } = parsed.data;

  try {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, active: true },
    });

    if (services.length === 0) {
      return res.status(400).json({ success: false, message: "No valid services selected" });
    }
    if (services.length !== new Set(serviceIds).size) {
      return res.status(400).json({ success: false, message: "One or more selected services are unavailable" });
    }

    const totalPrice = services.reduce((sum, s) => sum + s.basePrice, 0);

    const quote = await prisma.quote.create({
      data: {
        quoteRef: generateQuoteRef(),
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        company: customerInfo.company || null,
        message: customerInfo.message || null,
        totalPrice,
        services: {
          create: services.map((s) => ({ serviceId: s.id, priceAtQuote: s.basePrice })),
        },
      },
      include: { services: { include: { service: true } } },
    });

    res.json({
      success: true,
      data: {
        quoteId: quote.quoteRef,
        totalPrice: quote.totalPrice,
        services: quote.services.map((qs) => ({
          id: qs.service.id,
          name: qs.service.name,
          description: qs.service.description,
          price: qs.priceAtQuote,
        })),
      },
    });
  } catch (error) {
    console.error("createQuote error:", error);
    res.status(500).json({ success: false, message: "Failed to create quote" });
  }
};

export const getQuote: RequestHandler = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { quoteRef: req.params.quoteId },
      include: { services: { include: { service: true } }, payments: true },
    });
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }
    res.json({
      success: true,
      data: {
        quoteId: quote.quoteRef,
        totalPrice: quote.totalPrice,
        paidAmount: quote.paidAmount,
        balance: quote.totalPrice - quote.paidAmount,
        status: quote.status,
        services: quote.services.map((qs) => ({
          id: qs.service.id,
          name: qs.service.name,
          price: qs.priceAtQuote,
        })),
      },
    });
  } catch (error) {
    console.error("getQuote error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quote" });
  }
};

export const listServices: RequestHandler = async (_req, res) => {
  try {
    const services = await prisma.service.findMany({ where: { active: true }, orderBy: { category: "asc" } });
    res.json({ success: true, data: services });
  } catch (error) {
    console.error("listServices error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch services" });
  }
};
