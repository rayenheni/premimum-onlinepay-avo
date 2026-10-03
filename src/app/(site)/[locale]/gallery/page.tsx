import type { Metadata } from "next";
import Image from "next/image";
import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { CtaBanner } from "@/components/sections";
import { PageHero } from "@/components/page-hero";
import { cmsMetadata, getExtraContent, getSiteContent, requireEnabledPage } from "@/lib/cms";
import { getPublicSiteConfig } from "@/lib/site-config";
import { asLocale, titleFor } from "@/lib/meta";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = asLocale((await params).locale);
  const gallery = (await getExtraContent(locale)).gallery;
  return cmsMetadata(locale, "gallery", titleFor(locale, gallery.title), gallery.description);
}

export default async function GalleryPage({ params }: Props) {
  const locale = asLocale((await params).locale);
  await requireEnabledPage("gallery");
  const [content, extraContent, config, assets] = await Promise.all([
    getSiteContent(locale), getExtraContent(locale), getPublicSiteConfig(),
    db.select({ id: mediaAssets.id, altAr: mediaAssets.altAr, altFr: mediaAssets.altFr, captionAr: mediaAssets.captionAr, captionFr: mediaAssets.captionFr }).from(mediaAssets).where(eq(mediaAssets.showInGallery, true)).orderBy(desc(mediaAssets.createdAt)),
  ]);
  const gallery = extraContent.gallery;
  return <>
    <PageHero locale={locale} title={gallery.title} description={gallery.description} content={content} crumbs={[{ label: gallery.title }]} />
    <section className="page-section section-space"><div className="container">{assets.length ? <div className="public-gallery">{assets.map((asset) => {
      const alt = (locale === "ar" ? asset.altAr || asset.altFr : asset.altFr || asset.altAr) || "";
      const caption = locale === "ar" ? asset.captionAr || asset.captionFr : asset.captionFr || asset.captionAr;
      return <figure key={asset.id}><Image src={`/media/${asset.id}`} alt={alt} width={700} height={520} unoptimized />{caption && <figcaption>{caption}</figcaption>}</figure>;
    })}</div> : <p className="empty-note">{gallery.empty}</p>}</div></section>
    <CtaBanner locale={locale} content={content} config={config} />
  </>;
}
