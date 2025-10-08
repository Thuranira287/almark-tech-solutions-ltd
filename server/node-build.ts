import path from "path";
import { createServer } from "./index";
import * as express from "express";
import bodyParser from "body-parser";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import { initiateSTKPush } from "./m-pesa";

const app = createServer();
const port = process.env.PORT || 5000;

// Middlewares
app.use(bodyParser.json());

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

/**
 * API ROUTES
 */

// Send Quote + Email + Trigger M-Pesa STK Push
app.post("/api/send-quote-receipt", async (req, res) => {
  try {
    const { customer, services, total, paymentMethod } = req.body;

    // --- Generate PDF Receipt ---
    const doc = new PDFDocument();
    const filePath = path.join(__dirname, `receipt-${Date.now()}.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(20).text("Almmark Tech Solutions", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Customer: ${customer.name}`);
    doc.text(`Email: ${customer.email}`);
    doc.text(`Phone: ${customer.phone}`);

    doc.moveDown();
    doc.text("Services:");
    services.forEach((s: any) => {
      doc.text(`- ${s.name}: ${s.price}`);
    });

    doc.moveDown();
    doc.fontSize(16).text(`Total: KES ${total}`);

    doc.end();

    await new Promise((resolve) => stream.on("finish", () => resolve));

    // --- Send Email ---
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App password
      },
    });

    await transporter.sendMail({
      from: `"Almmark Tech Solutions" <${process.env.EMAIL_USER}>`,
      to: customer.email,
      subject: "Your Quote Receipt",
      text: "Attached is your receipt for the services.",
      attachments: [
        {
          filename: "receipt.pdf",
          path: filePath,
        },
      ],
    });

    // --- Trigger STK Push if M-Pesa selected ---
    if (paymentMethod === "mpesa") {
      const phoneNumber = customer.phone;
      await initiateSTKPush(phoneNumber, total);
    }

    res.json({ success: true, message: "Quote processed successfully!" });
  } catch (err: any) {
    console.error("❌ Error processing quote:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Callback URL (Safaricom will POST here after STK push)
app.post("/api/mpesa/callback", (req, res) => {
  console.log("📩 M-Pesa Callback:", JSON.stringify(req.body, null, 2));
  // TODO: Save transaction status in DB
  res.json({ status: "Callback received successfully" });
});

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Almmark Tech Solutions server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
