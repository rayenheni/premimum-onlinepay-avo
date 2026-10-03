import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import "../../globals.css";
import type { Locale } from "@/lib/site-content";
import { SiteShell } from "@/components/site-shell";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale, locales } from "@/lib/meta";
import { cmsMetadata, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#3c271a", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const config = await getPublicSiteConfig();
  const fallbackTitle = locale === "ar" ? "أبو يحيى اللباوي — محامٍ في تونس | محاماة واستشارات قانونية" : "Abou Yahia Labbaoui — Avocat à Tunis | Conseil et représentation";
  const fallbackDescription = locale === "ar"
    ? "مكتب أبو يحيى اللباوي للمحاماة: استشارات وعقود ومرافقة قانونية للأفراد والشركات في تونس، باللغة العربية والفرنسية."
    : "Cabinet Abou Yahia Labbaoui : conseil, contrats et contentieux pour particuliers et entreprises en Tunisie, en français et en arabe.";
  const managed = await cmsMetadata(locale, "home", fallbackTitle, fallbackDescription);
  return { ...managed, robots: { index: config.seoIndexing, follow: config.seoIndexing } };
}

export default async function SiteLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const rawLocale = (await params).locale;
  if (!locales.includes(rawLocale as Locale)) notFound();
  const locale = asLocale(rawLocale);
  const [config, content] = await Promise.all([getPublicSiteConfig(), getSiteContent(locale)]);
  return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
    
    <body><SiteShell locale={locale} config={config} content={content}>{children}</SiteShell></body>
  </html>;
}
