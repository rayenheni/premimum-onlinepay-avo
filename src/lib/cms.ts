import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { cmsPages, siteSettings } from "@/db/schema";
import { siteContent, type Locale } from "@/lib/site-content";
import { extra } from "@/lib/site-content-extra";

export type SiteContent = (typeof siteContent)[Locale];
export type ExtraContent = (typeof extra)[Locale];
export type PageKey = "home" | "about" | "services" | "blog" | "careers" | "contact" | "book" | "search" | "privacy" | "legal" | "gallery";
export type CmsPageState = {
  key: PageKey;
  enabled: boolean;
  showInNav: boolean;
  metaTitleAr: string;
  metaTitleFr: string;
  metaDescriptionAr: string;
  metaDescriptionFr: string;
};

export const pageDefinitions: { key: PageKey; labelFr: string; labelAr: string; defaultNav: boolean }[] = [
  { key: "home", labelFr: "Accueil", labelAr: "الرئيسية", defaultNav: true },
  { key: "about", labelFr: "Le cabinet", labelAr: "عن المكتب", defaultNav: true },
  { key: "services", labelFr: "Services", labelAr: "الخدمات", defaultNav: true },
  { key: "blog", labelFr: "Journal", labelAr: "المدونة", defaultNav: true },
  { key: "careers", labelFr: "Carrières", labelAr: "التوظيف", defaultNav: true },
  { key: "contact", labelFr: "Contact", labelAr: "تواصل معنا", defaultNav: true },
  { key: "book", labelFr: "Consultation", labelAr: "حجز استشارة", defaultNav: true },
  { key: "gallery", labelFr: "Galerie", labelAr: "معرض الصور", defaultNav: false },
  { key: "search", labelFr: "Recherche", labelAr: "البحث", defaultNav: true },
  { key: "privacy", labelFr: "Confidentialité", labelAr: "الخصوصية", defaultNav: false },
  { key: "legal", labelFr: "Mentions légales", labelAr: "الإشعارات القانونية", defaultNav: false },
];

const blockedLeafKeys = new Set(["id", "image"]);

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setAtPath(target: unknown, path: string, value: string | number) {
  const segments = path.split(".");
  let cursor = target as Record<string, unknown>;
  for (let index = 0; index < segments.length - 1; index++) {
    const segment = segments[index];
    const next = cursor[segment];
    if (next === null || typeof next !== "object") return;
    cursor = next as Record<string, unknown>;
  }
  const leaf = segments.at(-1);
  if (!leaf || !(leaf in cursor)) return;
  const current = cursor[leaf];
  if (typeof current === "string" && typeof value === "string") cursor[leaf] = value;
  if (typeof current === "number" && typeof value === "number" && Number.isFinite(value)) cursor[leaf] = value;
}

export function flattenEditableContent(value: unknown, prefix = "", result: { path: string; value: string | number }[] = []) {
  if (prefix.startsWith("blog.articles") || prefix.startsWith("introduction.slides")) return result;
  if (typeof value === "string" || typeof value === "number") {
    const leaf = prefix.split(".").at(-1) || "";
    if (!blockedLeafKeys.has(leaf)) result.push({ path: prefix, value });
    return result;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenEditableContent(item, prefix ? `${prefix}.${index}` : String(index), result));
    return result;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => flattenEditableContent(item, prefix ? `${prefix}.${key}` : key, result));
  }
  return result;
}

export function getValueAtPath(value: unknown, path: string): string | number | undefined {
  let cursor: unknown = value;
  for (const segment of path.split(".")) {
    if (!cursor || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[segment];
  }
  return typeof cursor === "string" || typeof cursor === "number" ? cursor : undefined;
}

async function getOverrides(key: string): Promise<Record<string, string | number>> {
  if (!databaseConfigured) return {};
  const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  if (!row) return {};
  try {
    const parsed = JSON.parse(row.value) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string" || typeof value === "number")) as Record<string, string | number>;
  } catch {
    return {};
  }
}

export async function getContentOverrides(locale: Locale) {
  return getOverrides(`contentOverrides:${locale}`);
}

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const content = deepClone(siteContent[locale]) as SiteContent;
  const overrides = await getContentOverrides(locale);
  Object.entries(overrides).forEach(([path, value]) => setAtPath(content, path, value));
  return content;
}

export async function getExtraOverrides(locale: Locale) {
  return getOverrides(`extraOverrides:${locale}`);
}

export async function getExtraContent(locale: Locale): Promise<ExtraContent> {
  const content = deepClone(extra[locale]) as ExtraContent;
  const overrides = await getExtraOverrides(locale);
  Object.entries(overrides).forEach(([path, value]) => setAtPath(content, path, value));
  return content;
}

function defaultPage(key: PageKey): CmsPageState {
  const definition = pageDefinitions.find((page) => page.key === key)!;
  return {
    key,
    enabled: true,
    showInNav: definition.defaultNav,
    metaTitleAr: "",
    metaTitleFr: "",
    metaDescriptionAr: "",
    metaDescriptionFr: "",
  };
}

export async function getCmsPages(): Promise<Record<PageKey, CmsPageState>> {
  const result = Object.fromEntries(pageDefinitions.map((definition) => [definition.key, defaultPage(definition.key)])) as Record<PageKey, CmsPageState>;
  if (!databaseConfigured) return result;
  const rows = await db.select().from(cmsPages);
  for (const row of rows) {
    if (!(row.key in result)) continue;
    const key = row.key as PageKey;
    result[key] = {
      key,
      enabled: row.enabled,
      showInNav: row.showInNav,
      metaTitleAr: row.metaTitleAr || "",
      metaTitleFr: row.metaTitleFr || "",
      metaDescriptionAr: row.metaDescriptionAr || "",
      metaDescriptionFr: row.metaDescriptionFr || "",
    };
  }
  return result;
}

export async function requireEnabledPage(key: PageKey) {
  const pages = await getCmsPages();
  if (!pages[key].enabled) notFound();
  return pages[key];
}

export async function cmsMetadata(locale: Locale, key: PageKey, fallbackTitle: string, fallbackDescription = "") {
  const page = await requireEnabledPage(key);
  const title = locale === "ar" ? page.metaTitleAr : page.metaTitleFr;
  const description = locale === "ar" ? page.metaDescriptionAr : page.metaDescriptionFr;
  return { title: title || fallbackTitle, description: description || fallbackDescription };
}
