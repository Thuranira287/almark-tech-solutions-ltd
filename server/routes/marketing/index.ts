import express from "express";
import { listTenants, createTenant, addTenantMember } from "./tenants";
import { getPlatformSettings, updatePlatformSettings, getTenantSettings, updateTenantSettings } from "./settings";
import { listMarketingProjects, createMarketingProject, updateMarketingProject } from "./projects";
import { listConnections, checkBufferChannels, createConnection, deleteConnection } from "./connections";
import {
  createDraft,
  listContent,
  approveContentRoute,
  rejectContentRoute,
  generateImageRoute,
  scheduleContentRoute,
} from "./content";
import { runAutomation, getProviderStatus } from "./automation";

// Nested under /api/admin — mergeParams so :tenantId from the parent
// mount is visible inside this router's own route params.
const tenantMarketingRouter = express.Router({ mergeParams: true });

tenantMarketingRouter.get("/settings", getTenantSettings);
tenantMarketingRouter.patch("/settings", updateTenantSettings);

tenantMarketingRouter.get("/projects", listMarketingProjects);
tenantMarketingRouter.post("/projects", createMarketingProject);
tenantMarketingRouter.patch("/projects/:projectId", updateMarketingProject);

tenantMarketingRouter.get("/connections", listConnections);
tenantMarketingRouter.post("/connections/check", checkBufferChannels);
tenantMarketingRouter.post("/connections", createConnection);
tenantMarketingRouter.delete("/connections/:connectionId", deleteConnection);

tenantMarketingRouter.get("/content", listContent);
tenantMarketingRouter.post("/content/draft", createDraft);
tenantMarketingRouter.post("/content/:contentId/approve", approveContentRoute);
tenantMarketingRouter.post("/content/:contentId/reject", rejectContentRoute);
tenantMarketingRouter.post("/content/:contentId/generate-image", generateImageRoute);
tenantMarketingRouter.post("/content/:contentId/schedule", scheduleContentRoute);

export const adminRouter = express.Router();

adminRouter.get("/tenants", listTenants);
adminRouter.post("/tenants", createTenant);
adminRouter.post("/tenants/:tenantId/members", addTenantMember);
adminRouter.use("/tenants/:tenantId/marketing", tenantMarketingRouter);

adminRouter.get("/platform-settings", getPlatformSettings);
adminRouter.patch("/platform-settings", updatePlatformSettings);
adminRouter.get("/marketing/provider-status", getProviderStatus);

// Mounted separately (no admin prefix, no session auth) in server/index.ts.
export const cronRouter = express.Router();
cronRouter.post("/run", runAutomation);
