import type { MetadataRoute } from "next";
import { listArticles } from "@/lib/articles";
import { getCmsPages } from "@/lib/cms";
import { serviceIds } from "@/lib/meta";
import { getPublicSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL?.replace(/\/$/, "");
  const [config, pages] = await Promise.all([getPublicSiteConfig(), getCmsPages()]);
  if (!origin || !config.seoIndexing) return [];
  const result: MetadataRoute.Sitemap = [];
  for (const locale of ["ar", "fr"] as const) {
    const pathByKey: Record<string, string> = { home: "", about: "about", services: "services", blog: "blog", careers: "careers", contact: "contact", book: "book", gallery: "gallery", privacy: "privacy", legal: "legal" };
    for (const [key, path] of Object.entries(pathByKey)) if (pages[key as keyof typeof pages].enabled) result.push({ url: `${origin}/${locale}${path ? `/${path}` : ""}`, changeFrequency: key === "blog" ? "weekly" : "monthly", priority: key === "home" ? 1 : .7 });
    if (pages.services.enabled) for (const service of serviceIds) result.push({ url: `${origin}/${locale}/services/${service}`, changeFrequency: "monthly", priority: .7 });
    if (pages.blog.enabled) for (const article of await listArticles(locale)) result.push({ url: `${origin}/${locale}/blog/${article.slug}`, lastModified: article.createdAt, changeFrequency: "monthly", priority: .6 });
  }
  return result;
}
