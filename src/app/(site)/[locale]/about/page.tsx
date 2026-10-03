import type { Metadata } from "next";
import { getPublicSiteConfig } from "@/lib/site-config";
import { AboutSection, CommitmentSection, CtaBanner, JourneySection, StatsSection, WhySection } from "@/components/sections";
import { PageHero } from "@/components/page-hero";
import { cmsMetadata, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("about");
  return cmsMetadata(locale, "about", titleFor(locale, (await getSiteContent(locale)).nav.about), (await getSiteContent(locale)).about.description.slice(0, 160));
}

export default async function AboutPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("about");
  const t = await getSiteContent(locale);
  const config = await getPublicSiteConfig();
  return <>
    <PageHero locale={locale} title={t.about.title} description={t.promise.quote} content={t} crumbs={[{ label: t.nav.about }]} />
    <AboutSection locale={locale} content={t} config={config} headingTag="h2" />
    <WhySection locale={locale} content={t} />
    <StatsSection locale={locale} content={t} />
    <CommitmentSection locale={locale} content={t} />
    <JourneySection locale={locale} content={t} config={config} />
    <CtaBanner locale={locale} content={t} config={config} />
  </>;
}
