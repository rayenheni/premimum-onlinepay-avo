import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getTenant } from "@/lib/tenant";

export const reservedAdminSlugs = new Set(["ar", "fr", "api", "admin", "media", "_next", "images", "videos", "fonts", "favicon.ico", "robots.txt", "sitemap.xml"]);

export function normalizeAdminSlug(value: string) {
  return value.toLowerCase().trim().replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 48);
}

export async function getAdminSlug() {
  const tenant = await getTenant();
  const tenantId = tenant?.id ?? 1;
  const [row] = await db.select().from(siteSettings).where(and(eq(siteSettings.tenantId, tenantId), eq(siteSettings.key, "adminPath"))).limit(1);
  const fromDb = row ? normalizeAdminSlug(row.value) : "";
  const fromEnv = normalizeAdminSlug(process.env.ADMIN_PATH || "");
  const candidate = fromDb || fromEnv || "admin";
  return reservedAdminSlugs.has(candidate) && candidate !== "admin" ? "admin" : candidate;
}

export async function adminHref(path = "") {
  const slug = await getAdminSlug();
  const suffix = path ? `/${path.replace(/^\/+/, "")}` : "";
  return `/${slug}${suffix}`;
}
