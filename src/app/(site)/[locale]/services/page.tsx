import type { Metadata } from "next";
import { CtaBanner, FaqSection, PracticeSection } from "@/components/sections";
import { getPublicSiteConfig } from "@/lib/site-config";
import { PageHero } from "@/components/page-hero";
import { cmsMetadata, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("services");
  return cmsMetadata(locale, "services", titleFor(locale, (await getSiteContent(locale)).practice.title), (await getSiteContent(locale)).practice.description);
}

export default async function ServicesPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("services");
  const t = await getSiteContent(locale);
  const config = await getPublicSiteConfig();
  return <>
    <PageHero locale={locale} title={t.practice.title} description={t.practice.description} content={t} crumbs={[{ label: t.nav.services }]} />
    <PracticeSection locale={locale} content={t} showAreas />
    <FaqSection locale={locale} content={t} />
    <CtaBanner locale={locale} content={t} config={config} />
  </>;
}
