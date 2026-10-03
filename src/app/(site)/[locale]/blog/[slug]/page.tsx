import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { CtaBanner } from "@/components/sections";
import { PageHero } from "@/components/page-hero";
import { Pill } from "@/components/ui";
import { getArticleBySlug, listArticles } from "@/lib/articles";
import { getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  await requireEnabledPage("blog");
  const article = await getArticleBySlug(locale, slug);
  return article ? { title: titleFor(locale, article.title), description: article.excerpt } : {};
}

export default async function ArticlePage({ params }: Props) {
  const { locale: raw, slug } = await params;
  const locale = asLocale(raw);
  await requireEnabledPage("blog");
  const [article, content, config] = await Promise.all([getArticleBySlug(locale, slug), getSiteContent(locale), getPublicSiteConfig()]);
  if (!article) notFound();
  const x = await getExtraContent(locale);
  const others = (await listArticles(locale, 4)).filter((item) => item.slug !== slug).slice(0, 3);
  const date = article.createdAt.toLocaleDateString(locale === "ar" ? "ar-TN" : "fr-TN", { dateStyle: "long", timeZone: "Africa/Tunis" });
  return <>
    <PageHero locale={locale} title={article.title} description={article.excerpt} content={content} crumbs={[{ label: content.nav.blog, href: `/${locale}/blog` }, { label: article.category || article.title }]} />
    <section className="page-section section-space"><div className="container article-layout">
      <article className="article-page">
        <Image src={article.image} alt="" width={768} height={512} unoptimized priority />
        <p className="article-meta"><span className="article-category">{article.category}</span><time dateTime={article.createdAt.toISOString()}>{x.published} {date}</time></p>
        {article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="article-disclaimer"><ShieldCheck size={20} />{content.blog.disclaimer}</div>
        <div className="article-actions"><Pill href={`/${locale}/book`}>{content.nav.book}</Pill><Link href={`/${locale}/blog`} className="back-button">{x.readingBack}</Link></div>
      </article>
      {others.length > 0 && <aside className="service-aside"><h3>{x.otherArticles}</h3>{others.map((item) => <Link key={item.id} href={`/${locale}/blog/${item.slug}`}>{item.title}</Link>)}</aside>}
    </div></section>
    <CtaBanner locale={locale} content={content} config={config} />
  </>;
}
