export type TenantRoleValue = "viewer" | "editor" | "admin" | "owner";

const RANK: Record<TenantRoleValue, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };

export function roleAtLeast(role: TenantRoleValue | null | undefined, minimum: TenantRoleValue): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[minimum];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
