import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { CtaBanner } from "@/components/sections";
import { PageHero } from "@/components/page-hero";
import { Pill, SectionLabel } from "@/components/ui";
import { getExtraContent, getSiteContent, requireEnabledPage, type ExtraContent, type SiteContent } from "@/lib/cms";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale, serviceIds, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string; slug: string }> };

function resolve(content: SiteContent, extraContent: ExtraContent, slug: string) {
  const group = content.practice.groups.find((item) => item.id === slug);
  const area = content.practice.areas.find((item) => item.id === slug);
  if (!group && !area) return null;
  const detail = extraContent.details[slug];
  const items: readonly string[] = group ? group.details : detail.items;
  return { title: (group?.title || area?.title) as string, description: (group?.description || area?.description) as string, intro: detail.intro, items };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  await requireEnabledPage("services");
  const [content, extraContent] = await Promise.all([getSiteContent(locale), getExtraContent(locale)]);
  const service = resolve(content, extraContent, slug);
  return service ? { title: titleFor(locale, service.title), description: service.intro } : {};
}

export default async function ServicePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  await requireEnabledPage("services");
  if (!serviceIds.includes(slug)) notFound();
  const [content, config, x] = await Promise.all([getSiteContent(locale), getPublicSiteConfig(), getExtraContent(locale)]);
  const service = resolve(content, x, slug);
  if (!service) notFound();
  const others = [...content.practice.groups, ...content.practice.areas].filter((item) => item.id !== slug);
  return <>
    <PageHero locale={locale} title={service.title} description={service.intro} content={content} crumbs={[{ label: content.nav.services, href: `/${locale}/services` }, { label: service.title }]} />
    <section className="page-section section-space"><div className="container service-layout">
      <article className="service-main">
        <SectionLabel>{content.practice.label}</SectionLabel><h2>{service.title}</h2><p className="service-description">{service.description}</p>
        {service.items.length > 0 && <ul className="check-list">{service.items.map((item) => <li key={item}><BadgeCheck size={21} />{item}</li>)}</ul>}
        <h3 className="service-subtitle">{content.journey.label}</h3>
        <ol className="mini-steps">{content.journey.steps.slice(0, 4).map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.description}</p></div></li>)}</ol>
        <p className="service-disclaimer"><ShieldCheck size={20} />{content.blog.disclaimer}</p><Pill href={`/${locale}/book?service=${slug}`}>{x.bookThis}</Pill>
      </article>
      <aside className="service-aside"><h3>{x.relatedServices}</h3>{others.map((item) => <Link key={item.id} href={`/${locale}/services/${item.id}`}>{item.title}</Link>)}<Link href={`/${locale}/services`} className="aside-all">{x.allServices}</Link></aside>
    </div></section>
    <CtaBanner locale={locale} content={content} config={config} />
  </>;
}
