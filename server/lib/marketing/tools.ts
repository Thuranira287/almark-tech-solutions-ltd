import Anthropic from "@anthropic-ai/sdk";

export type MarketingToolName =
  | "getPublicServices"
  | "getPublicPortfolio"
  | "getApprovedTestimonials"
  | "getMarketingAnalytics"
  | "getCampaignMetrics";

interface ToolDef {
  name: MarketingToolName;
  schema: Anthropic.Tool;
}

export const MARKETING_TOOLS: ToolDef[] = [
  {
    name: "getPublicServices",
    schema: {
      name: "getPublicServices",
      description: "Returns Almark's public service catalog (name, category, description, price range). Read-only.",
      input_schema: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    name: "getPublicPortfolio",
    schema: {
      name: "getPublicPortfolio",
      description: "Returns Almark's public portfolio entries. Read-only.",
      input_schema: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    name: "getApprovedTestimonials",
    schema: {
      name: "getApprovedTestimonials",
      description: "Returns only publicly-approved testimonials (never pending/rejected ones). Read-only.",
      input_schema: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    name: "getMarketingAnalytics",
    schema: {
      name: "getMarketingAnalytics",
      description:
        "Returns aggregated marketing metrics for the current project only, for a given date range. Never per-visitor data. Returns unavailable:true for anything not actually connected — never a fabricated number.",
      input_schema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "ISO date" },
          endDate: { type: "string", description: "ISO date" },
        },
        required: ["startDate", "endDate"],
        additionalProperties: false,
      },
    },
  },
  {
    name: "getCampaignMetrics",
    schema: {
      name: "getCampaignMetrics",
      description: "Returns aggregated metrics for a specific campaign belonging to the current project.",
      input_schema: {
        type: "object",
        properties: { campaignId: { type: "string" } },
        required: ["campaignId"],
        additionalProperties: false,
      },
    },
  },
];

const ALLOWED_NAMES = new Set(MARKETING_TOOLS.map((t) => t.name));

export async function runMarketingTool(
  name: string,
  input: Record<string, unknown>,
  scope: { tenantId: string; projectId?: string; publicServices: unknown[]; publicPortfolio: unknown[] },
): Promise<unknown> {
  if (!ALLOWED_NAMES.has(name as MarketingToolName)) {
    throw new Error(`Tool "${name}" is not in the marketing tool allowlist`);
  }

  const { prisma } = await import("../../db");

  switch (name as MarketingToolName) {
    case "getPublicServices":
      return scope.publicServices;

    case "getPublicPortfolio":
      return scope.publicPortfolio;

    case "getApprovedTestimonials": {
      const tenant = await prisma.tenant.findUnique({ where: { id: scope.tenantId }, select: { isPlatformOwner: true } });
      if (!tenant?.isPlatformOwner) return [];
      return prisma.testimonial.findMany({
        where: { status: "approved" },
        select: { rating: true, message: true, company: true },
        take: 20,
        orderBy: { createdAt: "desc" },
      });
    }

    case "getMarketingAnalytics": {
      const startDate = new Date(input.startDate as string);
      const endDate = new Date(input.endDate as string);
      const rows = await prisma.marketingMetric.findMany({
        where: {
          tenantId: scope.tenantId,
          ...(scope.projectId ? { projectId: scope.projectId } : {}),
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
        },
        select: { platform: true, metricName: true, value: true, unavailable: true },
      });
      return rows.length > 0 ? rows : { status: "NOT_CONNECTED" };
    }

    case "getCampaignMetrics": {
      const campaignId = String(input.campaignId ?? "");
      const campaign = await prisma.marketingCampaign.findFirst({
        where: { id: campaignId, tenantId: scope.tenantId, ...(scope.projectId ? { projectId: scope.projectId } : {}) },
        select: { id: true, projectId: true },
      });
      if (!campaign) return { status: "NOT_FOUND" };
      const rows = await prisma.marketingMetric.findMany({
        where: { tenantId: scope.tenantId, projectId: campaign.projectId, campaignId: campaign.id },
        select: { platform: true, metricName: true, value: true, unavailable: true },
      });
      return rows.length > 0 ? rows : { status: "NOT_CONNECTED" };
    }
  }
}
