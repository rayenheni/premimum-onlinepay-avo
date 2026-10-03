import type { Metadata } from "next";
import { PageHero } from "@/components/page-hero";
import { Pill } from "@/components/ui";
import { cmsMetadata, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("legal");
  return cmsMetadata(locale, "legal", titleFor(locale, (await getSiteContent(locale)).legal.title));
}

export default async function LegalPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("legal");
  const t = await getSiteContent(locale);
  return <>
    <PageHero locale={locale} title={t.legal.title} content={t} crumbs={[{ label: t.legal.title }]} />
    <section className="page-section section-space"><div className="container legal-page">{t.legal.paragraphs.map((p) => <p key={p}>{p}</p>)}<Pill href={`/${locale}/contact`}>{t.nav.contact}</Pill></div></section>
  </>;
}
