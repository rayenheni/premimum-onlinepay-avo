import type { Metadata } from "next";
import { ArticleCard, CtaBanner } from "@/components/sections";
import { getPublicSiteConfig } from "@/lib/site-config";
import { PageHero } from "@/components/page-hero";
import { listArticles } from "@/lib/articles";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("blog");
  return cmsMetadata(locale, "blog", titleFor(locale, (await getSiteContent(locale)).blog.title), (await getSiteContent(locale)).blog.description);
}

export default async function BlogPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("blog");
  const t = await getSiteContent(locale);
  const config = await getPublicSiteConfig();
  const [articles, x] = await Promise.all([listArticles(locale), getExtraContent(locale)]);
  return <>
    <PageHero locale={locale} title={t.blog.title} description={t.blog.description} content={t} crumbs={[{ label: t.nav.blog }]} />
    <section className="page-section section-space"><div className="container">
      {articles.length ? <div className="blog-grid">{articles.map((article) => <ArticleCard key={article.id} locale={locale} article={article} content={t} />)}</div> : <p className="empty-note">{x.noArticles}</p>}
      <p className="blog-disclaimer">{t.blog.disclaimer}</p>
    </div></section>
    <CtaBanner locale={locale} content={t} config={config} />
  </>;
}
