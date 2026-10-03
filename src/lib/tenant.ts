import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { tenants } from "@/db/schema";

export type Tenant = typeof tenants.$inferSelect;
export const DEFAULT_TENANT_SLUG = "labbaoui";
export const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || "plateforme.tn";

/** Resolves the tenant from the request host. Never trusts client-supplied identifiers. */
export const getTenant = cache(async (): Promise<Tenant | null> => {
  const headerList = await headers();
  const host = (headerList.get("x-forwarded-host") || headerList.get("host") || "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "");
  if (!host) return fallbackTenant();
  const [byDomain] = await db.select().from(tenants).where(eq(tenants.domain, host)).limit(1);
  if (byDomain) return byDomain.status === "active" ? byDomain : null;
  const label = host.endsWith(`.${PLATFORM_DOMAIN}`) ? host.slice(0, -(PLATFORM_DOMAIN.length + 1)) : "";
  if (label && !label.includes(".")) {
    const [bySlug] = await db.select().from(tenants).where(eq(tenants.slug, label)).limit(1);
    if (bySlug) return bySlug.status === "active" ? bySlug : null;
  }
  return fallbackTenant();
});

async function fallbackTenant(): Promise<Tenant | null> {
  const wanted = process.env.DEFAULT_TENANT_SLUG || DEFAULT_TENANT_SLUG;
  const [row] = await db.select().from(tenants).where(eq(tenants.slug, wanted)).limit(1);
  if (row) return row.status === "active" ? row : null;
  const [first] = await db.select().from(tenants).orderBy(tenants.id).limit(1);
  return first && first.status === "active" ? first : null;
}

export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) throw new Error("Tenant unavailable");
  return tenant;
}

export function tenantWhere(tenantId: number) {
  return { tenantId };
}

export { and, eq };
