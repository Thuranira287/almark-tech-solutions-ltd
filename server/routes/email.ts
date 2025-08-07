import { RequestHandler } from "express";

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
  quoteId: string;
}

export const sendQuoteReceipt: RequestHandler = async (req, res) => {
  try {
    const quoteData: QuoteRequest = req.body;

    // Generate quote receipt HTML
    const receiptHTML = generateReceiptHTML(quoteData);

    // In a real application, you would use a service like:
    // - SendGrid, Mailgun, or AWS SES for sending emails
    // - For now, we'll simulate sending and return the receipt

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log(`Quote receipt sent to: ${quoteData.customerInfo.email}`);
    console.log(`Quote ID: ${quoteData.quoteId}`);
    console.log(`Total Amount: KES ${quoteData.totalPrice.toLocaleString()}`);

    res.json({
      success: true,
      message: "Quote receipt sent successfully",
      quoteId: quoteData.quoteId,
      receiptHTML: receiptHTML,
    });
  } catch (error) {
    console.error("Error sending quote receipt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send quote receipt",
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
        .header { background: linear-gradient(135deg, #1a1a1a, #2d2d2d); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .logo { color: #FFD700; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .tagline { color: #FFD700; font-style: italic; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; }
        .quote-id { background: #f8f9fa; padding: 15px; border-left: 4px solid #FFD700; margin-bottom: 20px; }
        .customer-info { margin-bottom: 30px; }
        .services-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .services-table th, .services-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .services-table th { background: #f8f9fa; font-weight: bold; }
        .total-row { background: #f8f9fa; font-weight: bold; font-size: 18px; }
        .payment-info { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
        .contact-info { margin-top: 20px; font-size: 14px; color: #666; }
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
        
        <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${quoteData.customerInfo.name}</p>
            <p><strong>Email:</strong> ${quoteData.customerInfo.email}</p>
            <p><strong>Phone:</strong> ${quoteData.customerInfo.phone}</p>
            ${quoteData.customerInfo.company ? `<p><strong>Company:</strong> ${quoteData.customerInfo.company}</p>` : ""}
            ${quoteData.customerInfo.message ? `<p><strong>Additional Requirements:</strong> ${quoteData.customerInfo.message}</p>` : ""}
        </div>
        
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
                ${quoteData.selectedServices
                  .map(
                    (service) => `
                    <tr>
                        <td>${service.name}</td>
                        <td>${service.description}</td>
                        <td>${service.price.toLocaleString()}</td>
                    </tr>
                `,
                  )
                  .join("")}
                <tr class="total-row">
                    <td colspan="2"><strong>Total Amount</strong></td>
                    <td><strong>KES ${quoteData.totalPrice.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="payment-info">
            <h4>Payment Information</h4>
            <p><strong>Preferred Payment Method:</strong> ${quoteData.paymentMethod === "mpesa" ? "M-Pesa" : "PayPal"}</p>
            <p><strong>Payment Terms:</strong> 50% upfront, 50% on completion</p>
            <p><em>*Final pricing may vary based on specific requirements and project scope</em></p>
        </div>
        
        <h4>Next Steps</h4>
        <ol>
            <li>Our team will review your requirements within 24 hours</li>
            <li>We'll contact you to discuss project details and timeline</li>
            <li>Upon agreement, we'll send you a formal contract and invoice</li>
            <li>Project begins after initial payment is received</li>
        </ol>
    </div>
    
    <div class="footer">
        <p><strong>Thank you for choosing Almark Tech Solutions!</strong></p>
        <div class="contact-info">
            <p>📞 +254716227616 | 📧 info@almarktech.com | 📍 Nairobi, Kenya</p>
            <p>💬 WhatsApp: <a href="https://wa.me/254716227616">wa.me/254716227616</a></p>
        </div>
    </div>
</body>
</html>
  `;
}
