import { describe, it, expect, beforeEach, vi } from "vitest";
import { createFakeDb } from "./helpers/fakeDb";

const h = vi.hoisted(() => ({ db: null as any, publish: null as any }));
vi.mock("../db", () => ({ prisma: new Proxy({}, { get: (_t, k) => h.db[k as string] }) }));
vi.mock("../lib/marketing/tokenCrypto", () => ({ decryptToken: () => "plain-api-key", encryptToken: (s: string) => s }));
vi.mock("../lib/marketing/claude", () => ({ generateMarketingContent: vi.fn(), estimateCostUsd: () => 0 }));
vi.mock("../lib/marketing/providers/socialProvider", () => ({
  getSocialProvider: () => ({
    name: "buffer",
    isConfigured: () => true,
    listChannels: vi.fn(),
    publish: (req: any) => h.publish(req),
  }),
}));

import { scheduleContent, publishScheduledPost, runDuePosts } from "../lib/marketing/agent";
import { runMarketingTool } from "../lib/marketing/tools";

async function seed() {
  const db = h.db;
  await db.platformMarketingSettings.create({ data: { id: 1, automationEnabled: true } });
  for (const [id, owner] of [["A", true], ["B", false]] as const) {
    await db.tenant.create({ data: { id, name: `Tenant ${id}`, status: "active", isPlatformOwner: owner } });
    await db.tenantMarketingSettings.create({
      data: { tenantId: id, automationEnabled: true, maxAiCostPerDayUsd: 100, maxAiCostPerMonthUsd: 1000, maxImageGensPerDay: 100, maxImageGensPerMonth: 1000, maxPostsPerDay: 50, maxPostsPerMonth: 500 },
    });
    await db.marketingProject.create({ data: { id: `p${id}`, tenantId: id, name: `Project ${id}`, active: true, autonomyMode: "APPROVAL", maxPostsPerDay: 50, ctaDefault: null, allowedContentTypes: [] } });
    await db.marketingContent.create({ data: { id: `c${id}`, tenantId: id, projectId: `p${id}`, body: "A friendly update about our work this week.", status: "approved", contentHash: `seed-${id}` } });
    await db.socialConnection.create({ data: { id: `k${id}`, tenantId: id, status: "connected", externalChannelId: `ch-${id}`, encryptedApiKey: "enc", platform: "linkedin" } });
    await db.mediaAsset.create({ data: { id: `m${id}`, tenantId: id, secureUrl: `https://img.example/${id}.png`, provider: "fal.ai", providerAssetId: "x", cloudinaryPublicId: "y", mimeType: "image/png", prompt: "p" } });
    await db.marketingCampaign.create({ data: { id: `cmp${id}`, tenantId: id, projectId: `p${id}`, name: `Campaign ${id}` } });
    await db.marketingMetric.create({ data: { id: `met${id}`, tenantId: id, projectId: `p${id}`, campaignId: `cmp${id}`, metricName: `secret-metric-of-${id}`, value: 1, unavailable: false, platform: "linkedin" } });
  }
}

beforeEach(async () => {
  h.db = createFakeDb();
  h.publish = vi.fn(async () => ({ success: true, externalPostId: "ext-1" }));
  await seed();
});

const future = () => new Date(Date.now() + 3600_000);

describe("cross-tenant media access", () => {
  const base = { tenantId: "A", contentId: "cA", socialConnectionId: "kA", platform: "linkedin" as const };

  it("scheduling with the tenant's own media succeeds", async () => {
    const r = await scheduleContent({ ...base, scheduledFor: future(), mediaAssetIds: ["mA"] });
    expect(r.success).toBe(true);
  });

  it("scheduling with another tenant's media is rejected and creates nothing", async () => {
    const r = await scheduleContent({ ...base, scheduledFor: future(), mediaAssetIds: ["mB"] });
    expect(r.success).toBe(false);
    expect(r.reason).toMatch(/media assets do not belong/i);
    expect(await h.db.scheduledPost.count({ where: {} })).toBe(0);
  });

  it("a mixed list (one owned, one foreign) is rejected as a whole", async () => {
    const r = await scheduleContent({ ...base, scheduledFor: future(), mediaAssetIds: ["mA", "mB"] });
    expect(r.success).toBe(false);
  });

  it("a nonexistent media id is rejected", async () => {
    const r = await scheduleContent({ ...base, scheduledFor: future(), mediaAssetIds: ["does-not-exist"] });
    expect(r.success).toBe(false);
  });

  it("scheduling through another tenant's social connection or content is rejected", async () => {
    expect((await scheduleContent({ ...base, socialConnectionId: "kB", scheduledFor: future() })).success).toBe(false);
    expect((await scheduleContent({ ...base, contentId: "cB", scheduledFor: future() })).success).toBe(false);
  });

  it("at publish time, a foreign media id on an existing post is NOT attached", async () => {
    await h.db.marketingContent.update({ where: { id: "cA" }, data: { status: "scheduled" } });
    await h.db.scheduledPost.create({
      data: { id: "sp-tamper", tenantId: "A", projectId: "pA", contentId: "cA", socialConnectionId: "kA", platform: "linkedin", adaptedText: "hi", mediaAssetIds: ["mB", "mA"], scheduledFor: new Date(Date.now() - 1000), idempotencyKey: "tamper", status: "scheduled", attempts: 0 },
    });
    const r = await publishScheduledPost("sp-tamper");
    expect(r.success).toBe(true);
    const sent = h.publish.mock.calls[0][0];
    expect(sent.mediaAssetUrls).toEqual(["https://img.example/A.png"]);
  });
});

describe("cross-tenant campaign metrics", () => {
  const scopeA = { tenantId: "A", publicServices: [], publicPortfolio: [] };

  it("returns the tenant's own campaign metrics", async () => {
    const rows: any = await runMarketingTool("getCampaignMetrics", { campaignId: "cmpA" }, scopeA);
    expect(rows.map((r: any) => r.metricName)).toEqual(["secret-metric-of-A"]);
  });

  it("another tenant's campaign id returns nothing and leaks no metrics", async () => {
    const res: any = await runMarketingTool("getCampaignMetrics", { campaignId: "cmpB" }, scopeA);
    expect(res).toEqual({ status: "NOT_FOUND" });
    expect(JSON.stringify(res)).not.toContain("secret-metric-of-B");
  });

  it("a campaign from a different project within the same tenant is not readable when scoped to a project", async () => {
    await h.db.marketingProject.create({ data: { id: "pA2", tenantId: "A", name: "Second", active: true, autonomyMode: "APPROVAL", maxPostsPerDay: 1 } });
    await h.db.marketingCampaign.create({ data: { id: "cmpA2", tenantId: "A", projectId: "pA2", name: "Other project campaign" } });
    await h.db.marketingMetric.create({ data: { id: "metA2", tenantId: "A", projectId: "pA2", campaignId: "cmpA2", metricName: "other-project-metric", value: 5, unavailable: false } });
    const res: any = await runMarketingTool("getCampaignMetrics", { campaignId: "cmpA2" }, { ...scopeA, projectId: "pA" });
    expect(res).toEqual({ status: "NOT_FOUND" });
  });

  it("a metric row whose tenantId disagrees with its campaign is not returned", async () => {
    await h.db.marketingMetric.create({ data: { id: "metBad", tenantId: "B", projectId: "pA", campaignId: "cmpA", metricName: "planted-by-B", value: 9, unavailable: false } });
    const rows: any = await runMarketingTool("getCampaignMetrics", { campaignId: "cmpA" }, scopeA);
    expect(rows.map((r: any) => r.metricName)).not.toContain("planted-by-B");
  });

  it("analytics are limited to the tenant and, when scoped, the project", async () => {
    const rows: any = await runMarketingTool("getMarketingAnalytics", { startDate: "2000-01-01", endDate: "2100-01-01" }, scopeA);
    expect(JSON.stringify(rows)).not.toContain("secret-metric-of-B");
  });
});

describe("getApprovedTestimonials is enforced server-side", () => {
  beforeEach(async () => {
    await h.db.testimonial.create({ data: { id: "t1", status: "approved", rating: 5, message: "Great work", company: "Acme" } });
    await h.db.testimonial.create({ data: { id: "t2", status: "pending", rating: 1, message: "Not yet approved", company: null } });
  });

  it("returns approved testimonials only to the platform-owner tenant", async () => {
    const rows: any = await runMarketingTool("getApprovedTestimonials", {}, { tenantId: "A", publicServices: [], publicPortfolio: [] });
    expect(rows).toHaveLength(1);
    expect(rows[0].message).toBe("Great work");
  });

  it("returns nothing for any other tenant, even when called directly", async () => {
    const rows = await runMarketingTool("getApprovedTestimonials", {}, { tenantId: "B", publicServices: [], publicPortfolio: [] });
    expect(rows).toEqual([]);
  });

  it("returns nothing for an unknown tenant", async () => {
    const rows = await runMarketingTool("getApprovedTestimonials", {}, { tenantId: "ghost", publicServices: [], publicPortfolio: [] });
    expect(rows).toEqual([]);
  });
});

describe("the AI tool allowlist", () => {
  it("rejects every privileged or generic tool name", async () => {
    const scope = { tenantId: "A", publicServices: [], publicPortfolio: [] };
    for (const name of ["publishPost", "schedulePost", "executeSQL", "runCommand", "readFile", "readEnvironment", "httpRequest"]) {
      await expect(runMarketingTool(name, {}, scope)).rejects.toThrow(/allowlist/);
    }
  });
});

async function makeDuePost(over: Record<string, any> = {}) {
  await h.db.marketingContent.update({ where: { id: "cA" }, data: { status: "scheduled" } });
  return h.db.scheduledPost.create({
    data: { id: "sp1", tenantId: "A", projectId: "pA", contentId: "cA", socialConnectionId: "kA", platform: "linkedin", adaptedText: "hello", mediaAssetIds: [], scheduledFor: new Date(Date.now() - 1000), idempotencyKey: "key-1", status: "scheduled", attempts: 0, ...over },
  });
}

describe("publishing is re-authorised at the moment of publication", () => {
  it("baseline: when everything is enabled, the post publishes once", async () => {
    await makeDuePost();
    const r = await publishScheduledPost("sp1");
    expect(r.success).toBe(true);
    expect(h.publish).toHaveBeenCalledTimes(1);
    expect((await h.db.scheduledPost.findUnique({ where: { id: "sp1" } })).status).toBe("published");
    expect(await h.db.publishedPost.count({ where: { scheduledPostId: "sp1" } })).toBe(1);
  });

  it("running it twice never publishes twice (scheduler fires twice)", async () => {
    await makeDuePost();
    await publishScheduledPost("sp1");
    const second = await publishScheduledPost("sp1");
    expect(second.success).toBe(false);
    expect(h.publish).toHaveBeenCalledTimes(1);
    const sweep = await runDuePosts();
    expect(sweep.processed).toBe(0);
    expect(h.publish).toHaveBeenCalledTimes(1);
  });

  it("a post scheduled BEFORE the kill switch was activated does not publish afterwards", async () => {
    const s = await scheduleContent({ tenantId: "A", contentId: "cA", socialConnectionId: "kA", platform: "linkedin", scheduledFor: new Date(Date.now() - 1000) });
    expect(s.success).toBe(true);
    await h.db.platformMarketingSettings.update({ where: { id: 1 }, data: { automationEnabled: false } });
    const sweep = await runDuePosts();
    expect(sweep.processed).toBe(1);
    expect(sweep.succeeded).toBe(0);
    expect(h.publish).not.toHaveBeenCalled();
    const post = await h.db.scheduledPost.findUnique({ where: { id: s.scheduledPostId } });
    expect(post.status).toBe("scheduled");
  });

  it("the post is released, not failed, so it publishes once automation is re-enabled", async () => {
    await makeDuePost();
    await h.db.platformMarketingSettings.update({ where: { id: 1 }, data: { automationEnabled: false } });
    expect((await publishScheduledPost("sp1")).success).toBe(false);
    await h.db.platformMarketingSettings.update({ where: { id: 1 }, data: { automationEnabled: true } });
    expect((await publishScheduledPost("sp1")).success).toBe(true);
    expect(h.publish).toHaveBeenCalledTimes(1);
  });

  const blockers: Array<[string, () => Promise<void>]> = [
    ["platform automation disabled", async () => { await h.db.platformMarketingSettings.update({ where: { id: 1 }, data: { automationEnabled: false } }); }],
    ["tenant automation disabled", async () => { await h.db.tenantMarketingSettings.update({ where: { tenantId: "A" }, data: { automationEnabled: false } }); }],
    ["project deactivated", async () => { await h.db.marketingProject.update({ where: { id: "pA" }, data: { active: false } }); }],
    ["project switched to MANUAL mode", async () => { await h.db.marketingProject.update({ where: { id: "pA" }, data: { autonomyMode: "MANUAL" } }); }],
    ["tenant suspended", async () => { await h.db.tenant.update({ where: { id: "A" }, data: { status: "suspended" } }); }],
    ["content rejected after scheduling", async () => { await h.db.marketingContent.update({ where: { id: "cA" }, data: { status: "rejected" } }); }],
    ["content cancelled after scheduling", async () => { await h.db.marketingContent.update({ where: { id: "cA" }, data: { status: "cancelled" } }); }],
    ["social connection disconnected", async () => { await h.db.socialConnection.update({ where: { id: "kA" }, data: { status: "disconnected" } }); }],
    ["social connection needs re-auth", async () => { await h.db.socialConnection.update({ where: { id: "kA" }, data: { status: "reauth_required" } }); }],
    ["tenant automation row missing", async () => { await h.db.tenantMarketingSettings.delete({ where: { tenantId: "A" } }); }],
  ];

  for (const [label, apply] of blockers) {
    it(`does not publish when: ${label}`, async () => {
      await makeDuePost();
      await apply();
      const r = await publishScheduledPost("sp1");
      expect(r.success).toBe(false);
      expect(h.publish).not.toHaveBeenCalled();
      expect(await h.db.publishedPost.count({ where: {} })).toBe(0);
      expect((await h.db.scheduledPost.findUnique({ where: { id: "sp1" } })).status).toBe("scheduled");
    });
  }

  it("does not publish through a social connection that belongs to another tenant", async () => {
    await makeDuePost({ socialConnectionId: "kB" });
    const r = await publishScheduledPost("sp1");
    expect(r.success).toBe(false);
    expect(h.publish).not.toHaveBeenCalled();
  });

  it("a failed provider call is never recorded as published", async () => {
    h.publish = vi.fn(async () => ({ success: false, errorSafe: "Buffer rejected the post", retryable: false }));
    await makeDuePost();
    const r = await publishScheduledPost("sp1");
    expect(r.success).toBe(false);
    expect(await h.db.publishedPost.count({ where: {} })).toBe(0);
    expect((await h.db.scheduledPost.findUnique({ where: { id: "sp1" } })).status).toBe("failed");
  });
});
