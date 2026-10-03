import type { Metadata } from "next";
import { BadgeCheck, CreditCard } from "lucide-react";
import { BookingClient } from "@/components/booking-client";
import { PageHero } from "@/components/page-hero";
import { getPublicSiteConfig } from "@/lib/site-config";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, serviceIds, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ service?: string; reference?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("book");
  return cmsMetadata(locale, "book", titleFor(locale, (await getSiteContent(locale)).booking.title), (await getSiteContent(locale)).booking.description);
}

export default async function BookPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("book");
  const query = await searchParams;
  const t = await getSiteContent(locale);
  const b = (await getExtraContent(locale)).booking;
  const config = await getPublicSiteConfig();
  const service = query.service && (serviceIds.includes(query.service) || query.service === "general") ? query.service : "general";
  const reference = query.reference && /^LAW-[A-Z0-9]{7,16}$/.test(query.reference) ? query.reference : undefined;
  return <>
    <PageHero locale={locale} title={t.booking.title} description={t.booking.description} content={t} crumbs={[{ label: t.booking.title }]} />
    <section className="page-section section-space"><div className="container contact-layout booking-layout">
      <aside className="info-card"><h2>{b.title}</h2>
        <ol className="mini-steps">{b.points.map((point, index) => <li key={point}><span>{String(index + 1).padStart(2, "0")}</span><div><p>{point}</p></div></li>)}</ol>
        <div className="pay-card"><CreditCard size={24} /><div><strong>{b.payTitle}</strong><p>{b.payText}</p></div></div>
        <p className="info-note"><BadgeCheck size={18} />{t.booking.feeNote}</p></aside>
      <div className="form-panel"><BookingClient locale={locale} content={t} config={config} initialService={service} reference={reference} /></div>
    </div></section>
  </>;
}
