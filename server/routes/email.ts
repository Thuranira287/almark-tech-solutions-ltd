import { RequestHandler } from "express";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
dotenv.config();

const senderEmail = process.env.EMAIL_SENDER;

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

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

export const sendQuoteReceipt: RequestHandler = async (req, res) => {
  try {
    const quoteData: QuoteRequest = req.body;

    const receiptHTML = generateReceiptHTML(quoteData);

    // Email payload
    const msg = {
      to: quoteData.customerInfo.email, // recipient
      from: senderEmail,     // your verified sender
      subject: `Your Quote Receipt – Almark Tech Solutions (ID: ${quoteData.quoteId})`,
      html: receiptHTML,
    };

    // Send email
    await sgMail.send(msg);

    console.log("Quote email successfully sent to:", quoteData.customerInfo.email);

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


function generateReceiptHTML(quoteData: QuoteRequest): string {
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
  .services-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  .services-table th, .services-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
  .total-row { background: #f8f9fa; font-weight: bold; font-size: 18px; }
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

    <h3>Customer Information</h3>
    <p><strong>Name:</strong> ${quoteData.customerInfo.name}</p>
    <p><strong>Email:</strong> ${quoteData.customerInfo.email}</p>
    <p><strong>Phone:</strong> ${quoteData.customerInfo.phone}</p>
    ${quoteData.customerInfo.company ? `<p><strong>Company:</strong> ${quoteData.customerInfo.company}</p>` : ""}
    ${quoteData.customerInfo.message ? `<p><strong>Message:</strong> ${quoteData.customerInfo.message}</p>` : ""}

    <h3>Selected Services</h3>
    <table class="services-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Description</th>
          <th>Price (KES)</th>
        </tr>
      </thead>
      <tbody>
        ${quoteData.selectedServices.map(
          (s) => `
          <tr>
            <td>${s.name}</td>
            <td>${s.description}</td>
            <td>${s.price.toLocaleString()}</td>
          </tr>`
        ).join("")}

        <tr class="total-row">
          <td colspan="2">Total Amount</td>
          <td>KES ${quoteData.totalPrice.toLocaleString()}</td>
        </tr>

        ${
          quoteData.paymentAmount > 0
            ? `
          <tr style="background:#f0f9ff;">
            <td colspan="2"><strong>Amount Paid</strong></td>
            <td>KES ${quoteData.paymentAmount.toLocaleString()}</td>
          </tr>
          <tr style="background:#fef3c7;">
            <td colspan="2"><strong>Balance Due</strong></td>
            <td>KES ${quoteData.balance.toLocaleString()}</td>
          </tr>`
            : ""
        }
      </tbody>
    </table>

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
    <p>📞 +254716227616 | 📧 info@almarktech.com | 📍 Nairobi, Kenya</p>
  </div>
</body>
</html>
  `;
}
