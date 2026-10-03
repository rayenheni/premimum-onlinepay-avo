import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { PageHero } from "@/components/page-hero";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("careers");
  return cmsMetadata(locale, "careers", titleFor(locale, (await getSiteContent(locale)).nav.careers), (await getSiteContent(locale)).contactForm.careerDescription);
}

export default async function CareersPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("careers");
  const t = await getSiteContent(locale);
  const c = (await getExtraContent(locale)).careers;
  return <>
    <PageHero locale={locale} title={t.contactForm.careerTitle} description={t.contactForm.careerDescription} content={t} crumbs={[{ label: t.nav.careers }]} />
    <section className="page-section section-space"><div className="container contact-layout">
      <aside className="info-card"><h2>{c.title}</h2><p>{c.intro}</p><ul className="check-list compact">{c.points.map((point) => <li key={point}><BadgeCheck size={20} />{point}</li>)}</ul></aside>
      <div className="form-panel"><InquiryForm locale={locale} content={t} kind="career" /></div>
    </div></section>
  </>;
}
