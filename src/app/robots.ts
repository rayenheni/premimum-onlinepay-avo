import type { MetadataRoute } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getPublicSiteConfig();
  if (!config.seoIndexing) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/media"] }],
    sitemap: process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, "")}/sitemap.xml` : undefined,
  };
}
