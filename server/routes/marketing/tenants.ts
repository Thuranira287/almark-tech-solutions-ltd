import { RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../db";
import { requireAdmin, requireSession, getSessionUser } from "../../lib/adminAuth";
import { formatZodError } from "../../lib/validation";
import { slugify } from "../../lib/tenancy";

export const listTenants: RequestHandler = [requireSession, async (req, res) => {
  try {
    const user = getSessionUser(req);
    if (user.isPlatformAdmin) {
      const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: "asc" } });
      return res.json({ success: true, data: tenants.map((t) => ({ ...t, role: "owner" })) });
    }
    const memberships = await prisma.tenantMember.findMany({
      where: { adminUserId: user.id },
      include: { tenant: true },
    });
    res.json({ success: true, data: memberships.map((m) => ({ ...m.tenant, role: m.role })) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load tenants" });
  }
}] as any;

const createTenantSchema = z.object({ name: z.string().min(1).max(150) });

export const createTenant: RequestHandler = [requireAdmin, async (req, res) => {
  const parsed = createTenantSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const baseSlug = slugify(parsed.data.name) || "tenant";
    let slug = baseSlug;
    let n = 1;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++n}`;
    }
    const tenant = await prisma.tenant.create({ data: { name: parsed.data.name, slug } });
    await prisma.tenantMarketingSettings.create({ data: { tenantId: tenant.id } });
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create tenant" });
  }
}] as any;

const addMemberSchema = z.object({ adminUserEmail: z.string().email(), role: z.enum(["viewer", "editor", "admin", "owner"]) });

export const addTenantMember: RequestHandler = [requireAdmin, async (req, res) => {
  const parsed = addMemberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, message: formatZodError(parsed.error) });
  try {
    const user = await prisma.adminUser.findUnique({ where: { email: parsed.data.adminUserEmail.toLowerCase() } });
    if (!user) return res.status(404).json({ success: false, message: "No admin account with that email" });
    const member = await prisma.tenantMember.upsert({
      where: { tenantId_adminUserId: { tenantId: req.params.tenantId, adminUserId: user.id } },
      update: { role: parsed.data.role },
      create: { tenantId: req.params.tenantId, adminUserId: user.id, role: parsed.data.role },
    });
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to add tenant member" });
  }
}] as any;
