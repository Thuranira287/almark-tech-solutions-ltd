import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createFakeDb } from "./helpers/fakeDb";
import { fakeReqRes } from "./helpers/http";

const h = vi.hoisted(() => ({ db: null as any, receipts: [] as any[] }));
vi.mock("../db", () => ({ prisma: new Proxy({}, { get: (_t, k) => h.db[k as string] }) }));
vi.mock("../lib/receiptEmail", () => ({
  sendReceiptEmail: vi.fn(async (ref: string, payment: any) => {
    h.receipts.push({ ref, payment });
    return { success: true, message: "ok" };
  }),
}));

import { createServer } from "../index";
import { generateQuoteRef } from "../routes/quotes";
import { requireAdmin, requireTenantRole, createSessionCookieValue } from "../lib/adminAuth";
import { recordPendingPayment, recordManualPayment, markPaymentCompleted, markPaymentFailed } from "../lib/paymentGuard";

const root = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");

beforeEach(() => {
  h.db = createFakeDb();
  h.receipts.length = 0;
  process.env.ADMIN_SESSION_SECRET = "test-session-secret-at-least-long-enough";
  delete process.env.ADMIN_IP_ALLOWLIST;
});

describe("quote reference entropy", () => {
  it("uses 64 bits of cryptographic randomness in a fixed format", () => {
    const ref = generateQuoteRef();
    expect(ref).toMatch(/^ALM-[0-9A-F]{16}$/);
  });

  it("does not collide and is not derived from the clock", () => {
    const refs = new Set(Array.from({ length: 5000 }, generateQuoteRef));
    expect(refs.size).toBe(5000);
    const codeOnly = read("server/routes/quotes.ts").split("\n").filter((l) => !l.trim().startsWith("//")).join("\n");
    expect(codeOnly).not.toMatch(/Math\.random|Date\.now/);
  });
});

describe("quote lookup: enumeration protection and rate limiting", () => {
  let server: any;
  let base = "";

  beforeEach(async () => {
    await h.db.quote.create({
      data: {
        id: "q1",
        quoteRef: "ALM-1765455675618-OPRH",
        customerEmail: "Owner@Example.com",
        totalPrice: 10000,
        paidAmount: 2000,
        status: "partially_paid",
        services: [{ service: { id: "s1", name: "Web" }, priceAtQuote: 10000 }],
      },
    });
    const app = createServer();
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    base = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    await new Promise((r) => server.close(r));
  });

  const get = (p: string) => fetch(base + p);

  it("requires an email in addition to the quote reference", async () => {
    const r = await get("/api/quotes/ALM-1765455675618-OPRH");
    expect(r.status).toBe(400);
  });

  it("returns an identical response for a wrong email and a nonexistent quote", async () => {
    const wrongEmail = await get("/api/quotes/ALM-1765455675618-OPRH?email=attacker@example.com");
    const noSuchQuote = await get("/api/quotes/ALM-DOESNOTEXIST?email=attacker@example.com");
    expect(wrongEmail.status).toBe(404);
    expect(noSuchQuote.status).toBe(404);
    expect(await wrongEmail.json()).toEqual(await noSuchQuote.json());
  });

  it("returns the quote for the right reference and email, case-insensitively", async () => {
    const r = await get("/api/quotes/ALM-1765455675618-OPRH?email=owner@example.com");
    expect(r.status).toBe(200);
    const body: any = await r.json();
    expect(body.data.quoteId).toBe("ALM-1765455675618-OPRH");
    expect(body.data.balance).toBe(8000);
  });

  it("legacy quote references issued before the entropy change still work", async () => {
    const r = await get("/api/quotes/ALM-1765455675618-OPRH?email=Owner@Example.com");
    expect(r.status).toBe(200);
  });

  it("does not expose customer contact details", async () => {
    const body: any = await (await get("/api/quotes/ALM-1765455675618-OPRH?email=owner@example.com")).json();
    expect(JSON.stringify(body)).not.toMatch(/customerEmail|customerPhone|customerName/);
  });

  it("is rate limited aggressively: the 11th lookup in a window is refused", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) {
      statuses.push((await get(`/api/quotes/ALM-GUESS${i}?email=attacker@example.com`)).status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 404)).toBe(true);
    expect(statuses[10]).toBe(429);
    expect(statuses[11]).toBe(429);
  });

  it("the lookup limiter does not throttle unrelated endpoints", async () => {
    for (let i = 0; i < 12; i++) await get(`/api/quotes/ALM-GUESS${i}?email=a@b.co`);
    expect((await get("/api/ping")).status).toBe(200);
  });
});

describe("platform admin default and tenant authorization", () => {
  it("new admins are NOT platform admins by default (schema, migration, and both creation paths)", () => {
    expect(read("prisma/schema.prisma")).toMatch(/isPlatformAdmin\s+Boolean\s+@default\(false\)/);
    const migrations = fs.readdirSync(path.join(root, "prisma/migrations")).filter((d) => d.includes("platform_admin_default_false"));
    expect(migrations).toHaveLength(1);
    const sql = read(`prisma/migrations/${migrations[0]}/migration.sql`);
    expect(sql).toMatch(/ADD COLUMN "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false/);
    expect(sql).toMatch(/ALTER COLUMN "isPlatformAdmin" SET DEFAULT false/);
    expect(sql).toMatch(/information_schema\.columns/);
    const script = read("scripts/create-admin.ts");
    expect(script).toContain("--platform-admin");
    expect(script).toContain("isPlatformAdmin: wantsPlatformAdmin");
    expect(read("server/routes/admin.ts")).toMatch(/isPlatformAdmin: z\.boolean\(\)\.optional\(\)\.default\(false\)/);
  });

  async function run(mw: any, userId: string, params: Record<string, string> = {}) {
    const cookie = `almark_admin_session=${encodeURIComponent(createSessionCookieValue(userId))}`;
    const { req, res, out } = fakeReqRes({ headers: { cookie }, params });
    let nextCalled = false;
    mw(req, res, () => {
      nextCalled = true;
    });
    await new Promise((r) => setTimeout(r, 30));
    return { out, nextCalled };
  }

  beforeEach(async () => {
    await h.db.adminUser.create({ data: { id: "platform", email: "p@x.co", isPlatformAdmin: true } });
    await h.db.adminUser.create({ data: { id: "regular", email: "r@x.co", isPlatformAdmin: false } });
    await h.db.tenant.create({ data: { id: "T1", status: "active" } });
    await h.db.tenant.create({ data: { id: "T2", status: "active" } });
    await h.db.tenantMember.create({ data: { tenantId: "T1", adminUserId: "regular", role: "viewer" } });
  });

  it("requireAdmin refuses a non-platform admin and admits a platform admin", async () => {
    const denied = await run(requireAdmin, "regular");
    expect(denied.nextCalled).toBe(false);
    expect(denied.out.status).toBe(403);
    expect((await run(requireAdmin, "platform")).nextCalled).toBe(true);
  });

  it("requireAdmin refuses a request with no session", async () => {
    const { req, res, out } = fakeReqRes();
    let nextCalled = false;
    requireAdmin(req, res, () => {
      nextCalled = true;
    });
    await new Promise((r) => setTimeout(r, 30));
    expect(nextCalled).toBe(false);
    expect(out.status).toBe(401);
  });

  it("a tenant member cannot reach a tenant they do not belong to (and cannot tell it exists)", async () => {
    const r = await run(requireTenantRole("viewer"), "regular", { tenantId: "T2" });
    expect(r.nextCalled).toBe(false);
    expect(r.out.status).toBe(404);
  });

  it("role minimums are enforced", async () => {
    expect((await run(requireTenantRole("viewer"), "regular", { tenantId: "T1" })).nextCalled).toBe(true);
    const denied = await run(requireTenantRole("admin"), "regular", { tenantId: "T1" });
    expect(denied.nextCalled).toBe(false);
    expect(denied.out.status).toBe(403);
  });

  it("platform admins can act on any tenant; suspended tenants are closed to members", async () => {
    expect((await run(requireTenantRole("owner"), "platform", { tenantId: "T2" })).nextCalled).toBe(true);
    await h.db.tenant.update({ where: { id: "T1" }, data: { status: "suspended" } });
    const r = await run(requireTenantRole("viewer"), "regular", { tenantId: "T1" });
    expect(r.nextCalled).toBe(false);
    expect(r.out.status).toBe(403);
  });
});

describe("receipts are sent only after a payment is confirmed", () => {
  beforeEach(async () => {
    await h.db.quote.create({ data: { id: "q1", quoteRef: "ALM-RECEIPT0000000001", totalPrice: 10000, paidAmount: 0, status: "pending", customerEmail: "c@x.co" } });
  });

  it("creating a pending payment sends no receipt", async () => {
    await recordPendingPayment({ quoteId: "q1", method: "mpesa", amount: 5000, currency: "KES", providerRef: "ws_1" });
    expect(h.receipts).toHaveLength(0);
  });

  it("registering a manual M-Pesa payment sends no receipt and leaves the quote unpaid", async () => {
    const { payment } = await recordManualPayment({ quoteRef: "ALM-RECEIPT0000000001", amount: 4000, method: "mpesa" });
    expect(payment.status).toBe("pending");
    expect(payment.providerRef).toMatch(/^manual-/);
    expect(h.receipts).toHaveLength(0);
    expect((await h.db.quote.findUnique({ where: { id: "q1" } })).paidAmount).toBe(0);
  });

  it("a manual payment sends exactly one receipt only once it is confirmed", async () => {
    const { payment } = await recordManualPayment({ quoteRef: "ALM-RECEIPT0000000001", amount: 4000, method: "mpesa" });
    await markPaymentCompleted(payment.providerRef);
    await markPaymentCompleted(payment.providerRef);
    expect(h.receipts).toHaveLength(1);
    expect(h.receipts[0].payment).toEqual({ method: "mpesa", amount: 4000 });
    expect((await h.db.quote.findUnique({ where: { id: "q1" } })).paidAmount).toBe(4000);
  });

  it("a failed payment sends no receipt and does not touch the quote", async () => {
    await recordPendingPayment({ quoteId: "q1", method: "paypal", amount: 5000, currency: "KES", providerRef: "order_1" });
    await markPaymentFailed("order_1");
    expect(h.receipts).toHaveLength(0);
    expect((await h.db.quote.findUnique({ where: { id: "q1" } })).paidAmount).toBe(0);
  });

  it("completing an unknown provider reference sends nothing", async () => {
    expect(await markPaymentCompleted("nope")).toBeNull();
    expect(h.receipts).toHaveLength(0);
  });

  it("the receipt funnel is the only caller: no client call, no public route, no other importer", () => {
    const walk = (dir: string): string[] =>
      fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        if (e.name === "node_modules" || e.name === "__tests__" || e.name === "dist") return [];
        const full = path.join(dir, e.name);
        return e.isDirectory() ? walk(full) : [full];
      });
    const clientFiles = walk(path.join(root, "client")).filter((f) => /\.(ts|tsx)$/.test(f));
    for (const f of clientFiles) expect(fs.readFileSync(f, "utf8")).not.toContain("send-quote-receipt");
    expect(read("server/index.ts")).not.toContain("send-quote-receipt");
    const importers = walk(path.join(root, "server"))
      .filter((f) => /\.ts$/.test(f))
      .filter((f) => /import[^;]*sendReceiptEmail[^;]*receiptEmail/.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f))
      .sort();
    expect(importers).toEqual(["server/lib/paymentGuard.ts", "server/routes/email.ts"]);
  });
});
