import path from "path";
import express from "express";
import { createServer } from "./index";
import { logger } from "./lib/logger";

const app = createServer();
const port = process.env.PORT || 5000;

const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

app.use(express.static(distPath));

// SPA fallback for any non-API route
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(port, () => {
  logger.debug(`Almark Tech Solutions server running on port ${port}`);
  logger.debug(`Frontend: http://localhost:${port}`);
  logger.debug(`API: http://localhost:${port}/api`);
});

process.on("SIGTERM", () => {
  logger.debug("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.debug("Received SIGINT, shutting down gracefully");
  process.exit(0);
});
