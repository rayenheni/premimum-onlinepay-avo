import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, BookOpen, Scale, Search } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { listArticles } from "@/lib/articles";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale, normalize, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("search");
  return cmsMetadata(locale, "search", titleFor(locale, (await getSiteContent(locale)).nav.search));
}

export default async function SearchPage({ params, searchParams }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("search");
  const q = ((await searchParams).q || "").slice(0, 80);
  const t = await getSiteContent(locale);
  const [articles, x, config] = await Promise.all([listArticles(locale), getExtraContent(locale), getPublicSiteConfig()]);
  const items = [
    ...(config.pages.services.enabled ? t.practice.groups.map((g) => ({ title: g.title, description: g.description, href: `/${locale}/services/${g.id}`, kind: "service" })) : []),
    ...(config.pages.services.enabled ? t.practice.areas.map((a) => ({ title: a.title, description: a.description, href: `/${locale}/services/${a.id}`, kind: "service" })) : []),
    ...(config.pages.blog.enabled ? articles.map((a) => ({ title: a.title, description: a.excerpt, href: `/${locale}/blog/${a.slug}`, kind: "article" })) : []),
  ].filter((item) => !q || normalize(`${item.title} ${item.description}`).includes(normalize(q)));
  return <>
    <PageHero locale={locale} title={t.search.title} content={t} crumbs={[{ label: t.nav.search }]} />
    <section className="page-section section-space"><div className="container search-page">
      <form action={`/${locale}/search`} method="get" role="search" className="search-form"><div className="search-input"><Search size={22} /><input name="q" defaultValue={q} placeholder={t.search.placeholder} aria-label={t.search.placeholder} maxLength={80} /></div><button type="submit" className="pill pill-brown">{x.search.submit}</button></form>
      <p className="search-caption">{q ? `${t.search.results} (${items.length})` : x.search.hint}</p>
      <div className="search-results">{items.map((item) => <Link key={item.href} href={item.href}><span>{item.kind === "service" ? <Scale size={20} /> : <BookOpen size={20} />}</span><div><small>{item.kind === "service" ? t.search.service : t.search.article}</small><strong>{item.title}</strong></div><ArrowUpLeft size={18} /></Link>)}
        {items.length === 0 && <p className="search-empty">{t.search.empty}</p>}</div>
    </div></section>
  </>;
}
