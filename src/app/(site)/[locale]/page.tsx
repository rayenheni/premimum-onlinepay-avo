import { AboutSection, BlogSection, CommitmentSection, CtaBanner, FaqSection, Hero, JourneySection, PracticeSection, ReferenceStrip, StatsSection, WhySection } from "@/components/sections";
import { listArticles } from "@/lib/articles";
import { getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale } from "@/lib/meta";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("home");
  const [config, content, extraContent, articles] = await Promise.all([getPublicSiteConfig(), getSiteContent(locale), getExtraContent(locale), listArticles(locale, 3)]);
  return <>
    <Hero locale={locale} config={config} content={content} />
    <ReferenceStrip locale={locale} content={content} />
    {config.pages.about.enabled && <AboutSection locale={locale} content={content} config={config} />}
    <StatsSection locale={locale} content={content} />
    <JourneySection locale={locale} content={content} config={config} />
    {config.pages.services.enabled && <PracticeSection locale={locale} content={content} />}
    <WhySection locale={locale} content={content} />
    <CommitmentSection locale={locale} content={content} />
    {config.pages.blog.enabled && <BlogSection locale={locale} articles={articles} content={content} extraContent={extraContent} />}
    <FaqSection locale={locale} content={content} />
    {config.pages.book.enabled && <CtaBanner locale={locale} content={content} config={config} />}
  </>;
}
