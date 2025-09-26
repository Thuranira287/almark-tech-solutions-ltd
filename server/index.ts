import "dotenv/config"; 
import express from "express"; 
import cors from "cors"; 
import { handleDemo } from "./routes/demo"; 
import { sendQuoteReceipt } from "./routes/email"; 
import { paymentsRouter } from "./routes/payments"; 
export function createServer() { 
  const app = express(); 
  // Middleware 
  app.use(cors()); 
  app.use(express.json()); 
  app.use(express.urlencoded({ extended: true })); 
  // Example API routes 
  app.get("/api/ping", (_req, res) => { 
    const ping = process.env.PING_MESSAGE ?? "ping"; 
    res.json({ message: ping }); }); 
    app.get("/api/demo", handleDemo);
    // Quote and email routes 
    app.post("/api/send-quote-receipt", sendQuoteReceipt);
     // Mount the payments router 
    app.use("/api/payments", paymentsRouter); 

    return app;
  }