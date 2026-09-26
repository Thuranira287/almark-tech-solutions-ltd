import { RequestHandler } from "express";
import sgMail from "@sendgrid/mail";
import { z } from "zod";
import { prisma } from "../db";
import { escapeHtml } from "../lib/sanitize";
import { generateReceiptPdf } from "../lib/receiptPdf";
import { logger } from "../lib/logger";

const senderEmail = process.env.EMAIL_SENDER;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface QuoteRequest {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    message?: string;
  };
  selectedServices: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
  }>;
  totalPrice: number;
  paymentMethod: string;
  paymentAmount: number;
  balance: number;
  quoteId: string;
}

const sendReceiptSchema = z.object({
  quoteId: z.string().min(1),
  paymentMethod: z.string().optional().default(""),
  paymentAmount: z.number().min(0).optional().default(0),
});

export const sendQuoteReceipt: RequestHandler = async (req, res) => {
  try {
    const parsed = sendReceiptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: "Invalid request" });
    }
    const { quoteId, paymentMethod, paymentAmount } = parsed.data;

    const quote = await prisma.quote.findUnique({
      where: { quoteRef: quoteId },
      include: { services: { include: { service: true } } },
    });
    if (!quote) {
      return res.status(404).json({ success: false, message: "Quote not found" });
    }

    const quoteData: QuoteRequest = {
      customerInfo: {
        name: quote.customerName,
        email: quote.customerEmail,
        phone: quote.customerPhone,
        company: quote.company || undefined,
        message: quote.message || undefined,
      },
      selectedServices: quote.services.map((qs) => ({
        id: qs.service.id,
        name: qs.service.name,
        description: qs.service.description,
        price: qs.priceAtQuote,
      })),
      totalPrice: quote.totalPrice,
      paymentMethod,
      paymentAmount,
      balance: Math.max(quote.totalPrice - quote.paidAmount, 0),
      quoteId: quote.quoteRef,
    };

    const pdfBuffer = await generateReceiptPdf({
      quoteId: quoteData.quoteId,
      customerInfo: quoteData.customerInfo,
      selectedServices: quoteData.selectedServices,
      totalPrice: quoteData.totalPrice,
      paymentMethod: quoteData.paymentMethod,
      paymentAmount: quoteData.paymentAmount,
      balance: quoteData.balance,
      date: quote.createdAt,
    });

    const emailBodyHTML = generateEmailBodyHTML(quoteData);

    // Email payload
    const msg = {
      to: quoteData.customerInfo.email,
      from: senderEmail,
      subject: `Your Quote Receipt – Almark Tech Solutions (ID: ${quoteData.quoteId})`,
      html: emailBodyHTML,
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: `Almark-Receipt-${quoteData.quoteId}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    // Send email
    await sgMail.send(msg);

    logger.debug("Quote email successfully sent to:", quoteData.customerInfo.email);

    return res.json({
      success: true,
      message: "Quote receipt email sent successfully",
      quoteId: quoteData.quoteId,
    });

  } catch (error: any) {
    console.error("SendGrid Error:", error.response?.body || error);

    return res.status(500).json({
      success: false,
      message: "Failed to send quote receipt email",
      error: error.message,
    });
  }
};


function generateEmailBodyHTML(quoteData: QuoteRequest): string {
  const currentDate = new Date().toLocaleDateString("en-KE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Almark Tech Solutions - Quote Receipt</title>
<style>
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #1a1a1a; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
  .logo { color: #FFD700; font-size: 24px; font-weight: bold; }
  .tagline { color: #FFD700; font-style: italic; }
  .content { background: white; padding: 30px; border: 1px solid #ddd; }
  .quote-id { background: #f8f9fa; padding: 15px; border-left: 4px solid #FFD700; margin-bottom: 20px; }
  .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
</style>
</head>

<body>
  <div class="header">
    <div class="logo">ALMARK TECH SOLUTIONS</div>
    <div class="tagline">Your Tech Partner</div>
  </div>

  <div class="content">
    <div class="quote-id">
      <strong>Quote ID:</strong> ${quoteData.quoteId}<br>
      <strong>Date:</strong> ${currentDate}
    </div>

    <p>Hi ${escapeHtml(quoteData.customerInfo.name)},</p>
    <p>Thanks for requesting a quote from Almark Tech Solutions. Your itemized receipt is attached to this
      email as a PDF (Total: <strong>KES ${quoteData.totalPrice.toLocaleString()}</strong>${
        quoteData.paymentAmount > 0
          ? `, Amount Paid: <strong>KES ${quoteData.paymentAmount.toLocaleString()}</strong>, Balance Due: <strong>KES ${quoteData.balance.toLocaleString()}</strong>`
          : ""
      }).</p>

    <h4>Next Steps</h4>
    <ol>
      <li>We will review your request within 24 hours.</li>
      <li>We will contact you to confirm project details.</li>
      <li>You will receive an invoice after confirmation.</li>
      <li>Work starts upon initial payment.</li>
    </ol>
  </div>

  <div class="footer">
    <p><strong>Thank you for choosing Almark Tech Solutions!</strong></p>
    <p>Phone: +254716227616 &nbsp;|&nbsp; Email: info@almarktech.com &nbsp;|&nbsp; Nairobi, Kenya</p>
  </div>
</body>
</html>
  `;
}
