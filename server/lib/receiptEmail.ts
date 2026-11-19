import sgMail from "@sendgrid/mail";
import { prisma } from "../db";
import { escapeHtml } from "./sanitize";
import { generateReceiptPdf } from "./receiptPdf";
import { logger } from "./logger";

const senderEmail = process.env.EMAIL_SENDER;

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

interface QuoteReceiptData {
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    message?: string;
  };
  selectedServices: Array<{ id: string; name: string; description: string; price: number }>;
  totalPrice: number;
  paymentMethod: string;
  paymentAmount: number;
  balance: number;
  quoteId: string;
}

// Only ever called after a payment provider has confirmed a real payment
// (see paymentGuard.ts's markPaymentCompleted) or by an admin explicitly
// resending a receipt for a quote that is already marked paid/partially
// paid. It is never triggered by quote creation alone, and every figure
// below comes from the stored quote/payment state — never from a
// caller-supplied amount — so nothing here can be used to make an unpaid
// quote look paid.
export async function sendReceiptEmail(
  quoteRef: string,
  triggeringPayment?: { method: string; amount: number },
): Promise<{ success: boolean; message: string }> {
  try {
    const quote = await prisma.quote.findUnique({
      where: { quoteRef },
      include: { services: { include: { service: true } } },
    });
    if (!quote) {
      return { success: false, message: "Quote not found" };
    }

    const quoteData: QuoteReceiptData = {
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
      paymentMethod: triggeringPayment?.method ?? "",
      paymentAmount: triggeringPayment?.amount ?? quote.paidAmount,
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

    await sgMail.send({
      to: quoteData.customerInfo.email,
      from: senderEmail,
      subject: `Payment Receipt – Almark Tech Solutions (ID: ${quoteData.quoteId})`,
      html: emailBodyHTML,
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: `Almark-Receipt-${quoteData.quoteId}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    logger.debug("Receipt email sent to:", quoteData.customerInfo.email);
    return { success: true, message: "Receipt email sent" };
  } catch (error: any) {
    console.error("sendReceiptEmail error:", error.response?.body || error);
    return { success: false, message: "Failed to send receipt email" };
  }
}

function generateEmailBodyHTML(quoteData: QuoteReceiptData): string {
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
<title>Almark Tech Solutions - Payment Receipt</title>
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
    <p>We've received your payment${quoteData.paymentMethod ? ` via ${escapeHtml(quoteData.paymentMethod)}` : ""}. Your receipt is attached to this
      email as a PDF (Total: <strong>KES ${quoteData.totalPrice.toLocaleString()}</strong>, Amount Paid:
      <strong>KES ${quoteData.paymentAmount.toLocaleString()}</strong>${
        quoteData.balance > 0
          ? `, Balance Due: <strong>KES ${quoteData.balance.toLocaleString()}</strong>`
          : ""
      }).</p>

    <h4>Next Steps</h4>
    <ol>
      <li>We will review your request within 24 hours.</li>
      <li>We will contact you to confirm project details.</li>
      ${quoteData.balance > 0 ? "<li>An invoice for the remaining balance will follow.</li>" : ""}
      <li>Work starts now that payment has been received.</li>
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
