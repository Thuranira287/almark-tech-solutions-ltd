// netlify/functions/api.ts
//
// This was previously commented out entirely, which meant every /api/*
// route (quotes, payments, receipt emails) silently 404'd in production
// even though netlify.toml redirects /api/* here. Restoring it.
import serverless from "serverless-http";
import { createServer } from "../../server";

export const handler = serverless(createServer());
