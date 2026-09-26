import PDFDocument from "pdfkit";

export interface ReceiptPdfData {
  quoteId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    company?: string;
    message?: string;
  };
  selectedServices: Array<{ name: string; description: string; price: number }>;
  totalPrice: number;
  paymentMethod: string;
  paymentAmount: number;
  balance: number;
  date: Date;
}

const BRAND_DARK = "#0B1F3A";
const BRAND_GOLD = "#D4AF37";

export function generateReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Header
    doc
      .fillColor(BRAND_DARK)
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Almark Tech Solutions", { continued: false });
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text("Your Tech Partner");
    doc.moveDown(0.5);
    doc
      .strokeColor(BRAND_GOLD)
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke();
    doc.moveDown(1);

    doc.fillColor(BRAND_DARK).fontSize(14).font("Helvetica-Bold").text("Quote Receipt");
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(`Quote ID: ${data.quoteId}`)
      .text(`Date: ${data.date.toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}`);
    doc.moveDown(1);

    // Customer info
    doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_DARK).text("Customer Information");
    doc.fontSize(10).font("Helvetica").fillColor("#333333");
    doc.text(`Name: ${data.customerInfo.name}`);
    doc.text(`Email: ${data.customerInfo.email}`);
    doc.text(`Phone: ${data.customerInfo.phone}`);
    if (data.customerInfo.company) doc.text(`Company: ${data.customerInfo.company}`);
    doc.moveDown(1);

    // Services table
    doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_DARK).text("Selected Services");
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 420;
    doc.fontSize(9).font("Helvetica-Bold").fillColor("#666666");
    doc.text("Service", col1, tableTop);
    doc.text("Price (KES)", col2, tableTop, { width: 95, align: "right" });
    doc.moveTo(50, doc.y + 3).lineTo(545, doc.y + 3).strokeColor("#dddddd").lineWidth(1).stroke();
    doc.moveDown(0.5);

    doc.font("Helvetica").fillColor("#333333").fontSize(10);
    for (const service of data.selectedServices) {
      const rowY = doc.y;
      doc.text(service.name, col1, rowY, { width: 350 });
      doc.text(service.price.toLocaleString(), col2, rowY, { width: 95, align: "right" });
      doc.moveDown(0.4);
    }
    doc.moveTo(50, doc.y + 2).lineTo(545, doc.y + 2).strokeColor("#dddddd").stroke();
    doc.moveDown(0.7);

    // Totals — explicit x/width here, since the table rows above set a
    // narrow column context (col2/95) that pdfkit would otherwise carry
    // into these right-aligned lines and wrap them oddly.
    doc.fontSize(11).font("Helvetica-Bold").fillColor(BRAND_DARK);
    doc.text(`Total Amount: KES ${data.totalPrice.toLocaleString()}`, 50, doc.y, { width: 495, align: "right" });
    if (data.paymentAmount > 0) {
      doc.fontSize(10).font("Helvetica").fillColor("#2E7D32");
      doc.text(`Amount Paid: KES ${data.paymentAmount.toLocaleString()}`, 50, doc.y, { width: 495, align: "right" });
      doc.fillColor("#B45309");
      doc.text(`Balance Due: KES ${data.balance.toLocaleString()}`, 50, doc.y, { width: 495, align: "right" });
    }
    doc.moveDown(1.5);

    // Next steps
    doc.x = 50;
    doc.fontSize(12).font("Helvetica-Bold").fillColor(BRAND_DARK).text("Next Steps", 50, doc.y, { width: 495 });
    doc.fontSize(10).font("Helvetica").fillColor("#333333");
    doc.list(
      [
        "We will review your request within 24 hours.",
        "We will contact you to confirm project details.",
        "You will receive an invoice after confirmation.",
        "Work starts upon initial payment.",
      ],
      50,
      doc.y,
      { width: 495 },
    );
    doc.moveDown(1.5);

    // Footer
    doc.strokeColor(BRAND_GOLD).lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#666666").font("Helvetica");
    doc.text("Thank you for choosing Almark Tech Solutions!", { align: "center" });
    doc.text("Phone: +254716227616  |  Email: info@almarktech.com  |  Nairobi, Kenya", {
      align: "center",
    });

    doc.end();
  });
}
