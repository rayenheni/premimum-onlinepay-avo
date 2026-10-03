import Image from "next/image";
import Link from "next/link";
import { siteContent, type Locale } from "@/lib/site-content";
import { getPublicSiteConfig } from "@/lib/site-config";

export async function PageHero({ locale, title, description, crumbs = [], content }: {
  locale: Locale;
  title: string;
  description?: string;
  crumbs?: { label: string; href?: string }[];
  content?: (typeof siteContent)[Locale];
}) {
  const t = content || siteContent[locale];
  const config = await getPublicSiteConfig();
  return <section className="page-hero">
    <Image src={config.pageHeroImage} alt="" fill priority unoptimized sizes="100vw" />
    <div className="page-hero-shade" />
    <div className="container page-hero-inner">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={`/${locale}`}>{t.nav.home}</Link>
        {crumbs.map((crumb) => <span key={crumb.label}><i>/</i>{crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <b>{crumb.label}</b>}</span>)}
      </nav>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  </section>;
}
