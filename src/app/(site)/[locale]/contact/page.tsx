import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { PageHero } from "@/components/page-hero";
import { getPublicSiteConfig } from "@/lib/site-config";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("contact");
  return cmsMetadata(locale, "contact", titleFor(locale, (await getSiteContent(locale)).nav.contact), (await getSiteContent(locale)).contactForm.description);
}

export default async function ContactPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("contact");
  const t = await getSiteContent(locale);
  const c = (await getExtraContent(locale)).contact;
  const config = await getPublicSiteConfig();
  const rows = [
    { Icon: MapPin, label: c.address, value: config.address || t.footer.location, href: "" },
    { Icon: Mail, label: c.email, value: config.contactEmail, href: config.contactEmail ? `mailto:${config.contactEmail}` : "" },
    { Icon: Phone, label: c.phone, value: config.contactPhone, href: config.contactPhone ? `tel:${config.contactPhone}` : "" },
    { Icon: MessageCircle, label: c.whatsapp, value: config.whatsapp ? `+${config.whatsapp}` : "", href: config.whatsapp ? `https://wa.me/${config.whatsapp}` : "" },
  ].filter((row) => row.value);
  return <>
    <PageHero locale={locale} title={t.contactForm.title} description={t.contactForm.description} content={t} crumbs={[{ label: t.nav.contact }]} />
    <section className="page-section section-space"><div className="container contact-layout">
      <aside className="info-card"><h2>{c.info}</h2><p>{c.text}</p>
        <ul>{rows.map(({ Icon, label, value, href }) => <li key={label}><span><Icon size={21} /></span><div><small>{label}</small>{href ? <a href={href} dir="ltr" target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{value}</a> : <strong>{value}</strong>}</div></li>)}</ul>
        {!config.contactEmail && !config.contactPhone && <p className="info-note">{c.viaForm}</p>}
        <p className="info-note">{c.response}</p></aside>
      <div className="form-panel"><InquiryForm locale={locale} content={t} kind="contact" /></div>
    </div></section>
  </>;
}
