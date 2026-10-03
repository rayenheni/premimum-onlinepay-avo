import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown, ArrowLeft, ArrowRight, Award, BadgeCheck, BookOpen, BriefcaseBusiness, Building2, Clock3, FileSearch, FileText,
  Gavel, Handshake, Headphones, HeartHandshake, Home, Landmark, LockKeyhole, MessageCircle, Scale, ShieldCheck, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import { type Locale } from "@/lib/site-content";
import type { SiteContent } from "@/lib/cms";
import type { ExtraContent } from "@/lib/cms";
import type { PublicSiteConfig } from "@/lib/site-config";
import type { ArticleView } from "@/lib/articles";
import { Pill, SectionLabel } from "@/components/ui";
import { HeroVideo } from "@/components/hero-video";
import { Timeline } from "@/components/timeline";
import { Faq } from "@/components/faq";

const statIcons: LucideIcon[] = [Scale, Clock3, FileText, BriefcaseBusiness, Gavel, Users, Handshake, Scale];
const areaIcons: Record<string, LucideIcon> = { commercial: BriefcaseBusiness, family: HeartHandshake, property: Home, employment: Users, criminal: Gavel, contracts: FileText };
const valueIcons: LucideIcon[] = [Scale, ShieldCheck, Users, Award];
const whyIcons: LucideIcon[] = [FileSearch, BadgeCheck, LockKeyhole, Headphones];

export function Hero({ locale, config, content }: { locale: Locale; config: PublicSiteConfig; content: SiteContent }) {
  const t = content;
  return <section className="hero-section" id="top">
    <Image src={config.heroImage} alt="" fill priority unoptimized sizes="100vw" className="hero-background" />
    <div className="hero-shade" />
    <div className="container hero-content">
      <div className="hero-copy">
        <div className="hero-eyebrow"><span /><p>{t.hero.label}</p></div>
        <h1>{t.hero.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
        <p className="hero-description">{t.hero.description}</p>
        <div className="hero-buttons">{config.pages.contact.enabled && <Link href={`/${locale}/contact`} className="hero-primary">{t.hero.contact}</Link>}{config.pages.about.enabled && <Link href={`/${locale}/about`} className="hero-secondary">{t.hero.more}</Link>}<Link href={`/${locale}/promo`} className="hero-promo-link">{locale === "ar" ? "شوفوا الفيديو" : "Voir la vidéo"}</Link></div>
      </div>
      <HeroVideo locale={locale} config={config} content={content} />
    </div>
    <a className="hero-scroll" href="#about" aria-label={t.hero.scroll}><ArrowDown size={17} /></a>
  </section>;
}

export function ReferenceStrip({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = content;
  const icons: LucideIcon[] = [Landmark, Scale, Building2, BookOpen, Wallet, ShieldCheck, MessageCircle, BriefcaseBusiness];
  const brands = t.referenceItems.map((item, index) => ({ ...item, Icon: icons[index] || Scale }));
  return <div className="reference-strip" aria-label={t.partnersLabel}><div className="reference-track">{[...brands, ...brands].map((brand, index) => <div className="reference-brand" key={`${brand.title}-${index}`} aria-hidden={index >= brands.length}><brand.Icon size={37} strokeWidth={1.3} /><div><strong>{brand.title}</strong><span>{brand.subtitle}</span></div></div>)}</div></div>;
}

export function AboutSection({ locale, content, config, headingTag = "h2" }: { locale: Locale; content: SiteContent; config: PublicSiteConfig; headingTag?: "h2" | "h3" }) {
  const t = content;
  const Heading = headingTag;
  return <section className="about-section section-space" id="about"><div className="container split-grid about-grid">
    <div className="about-copy"><SectionLabel>{t.about.label}</SectionLabel><Heading>{t.about.title}</Heading><p>{t.about.description}</p>
      <div className="about-values">{t.about.values.map((value, index) => { const Icon = valueIcons[index]; return <div key={value}><span><Icon size={22} strokeWidth={1.6} /></span><strong>{value}</strong></div>; })}</div></div>
    <div className="about-visual"><div className="about-photo-frame"><Image src={config.aboutImage} alt={t.about.imageAlt} width={800} height={700} unoptimized /></div>
      <div className="about-badge"><span><Award size={28} strokeWidth={1.6} /></span><div><strong dir="ltr">{t.about.badge}</strong><small>{t.about.badgeLabel}</small></div></div></div>
  </div></section>;
}

export function StatsSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = content;
  return <section className="statistics-section" id="statistics"><div className="container">
    <div className="section-heading on-dark"><h2>{t.stats.title}</h2><p>{t.stats.description}</p></div>
    <div className="statistics-grid">{t.stats.cards.map((stat, index) => { const Icon = statIcons[index]; return <article className="stat-card" key={stat.title}><span className="stat-icon"><Icon size={31} strokeWidth={1.8} /></span><strong className="stat-number" dir="ltr">{stat.value}</strong><h3>{stat.title}</h3><p>{stat.description}</p></article>; })}</div>
    <p className="demo-statistics-note"><span className="info-dot" aria-hidden="true">i</span>{t.stats.note}</p>
  </div></section>;
}

export function JourneySection({ locale, content, config }: { locale: Locale; content: SiteContent; config: PublicSiteConfig }) {
  const t = content;
  return <section className="journey-section section-space" id="journey"><div className="container split-grid journey-grid">
    <div className="journey-introduction"><SectionLabel>{t.journey.label}</SectionLabel><h2>{t.journey.title}</h2><p>{t.journey.description}</p>{config.pages.contact.enabled && <Pill href={`/${locale}/contact`}>{t.journey.contact}</Pill>}
      <div className="journey-image"><Image src={config.journeyImage} alt={t.journey.title} width={768} height={320} unoptimized /></div></div>
    <Timeline steps={t.journey.steps} stepLabel={t.journey.step} note={t.journey.note} />
  </div></section>;
}

export function PracticeSection({ locale, content, showAreas = false }: { locale: Locale; content: SiteContent; showAreas?: boolean }) {
  const t = content;
  return <section className="practice-section section-space" id="services"><div className="container">
    <div className="section-heading"><SectionLabel>{t.practice.label}</SectionLabel><h2>{t.practice.title}</h2><p>{t.practice.description}</p></div>
    <div className="practice-grid">{t.practice.groups.map((group) => <article className={`practice-card practice-${group.id}`} key={group.id}>
      <span className="practice-icon">{group.id === "corporate" ? <Building2 size={34} strokeWidth={1.8} /> : <Users size={34} strokeWidth={1.8} />}</span><h3>{group.title}</h3><p>{group.description}</p><Pill href={`/${locale}/services/${group.id}`}>{t.practice.more}</Pill></article>)}</div>
    {showAreas && <div className="area-grid">{t.practice.areas.map((area) => { const Icon = areaIcons[area.id] || Scale; return <Link key={area.id} href={`/${locale}/services/${area.id}`} className="area-card"><span><Icon size={26} strokeWidth={1.7} /></span><h3>{area.title}</h3><p>{area.description}</p></Link>; })}</div>}
  </div></section>;
}

export function WhySection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = content;
  return <section className="why-section section-space" id="why"><div className="container"><div className="section-heading"><SectionLabel>{t.why.label}</SectionLabel><h2>{t.why.title}</h2><p>{t.why.description}</p></div>
    <div className="why-grid">{t.why.cards.map((card, index) => { const Icon = whyIcons[index]; return <article className="why-card" key={card.title}><span><Icon size={29} strokeWidth={1.6} /></span><h3>{card.title}</h3><p>{card.description}</p></article>; })}</div></div></section>;
}

export function CommitmentSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = content;
  return <section className="commitment-section"><div className="container commitment-inner"><div className="commitment-heading"><SectionLabel>{t.promise.label}</SectionLabel><h2>{t.promise.title}</h2></div>
    <div className="commitment-quote"><span className="quote-symbol">“</span><blockquote>{t.promise.quote}</blockquote><div><span className="quote-avatar"><Scale size={23} /></span><p><strong>{t.promise.author}</strong><small>{t.promise.role}</small></p></div></div></div></section>;
}

export function ArticleCard({ locale, article, content }: { locale: Locale; article: ArticleView; content: SiteContent }) {
  const t = content;
  const href = `/${locale}/blog/${article.slug}`;
  return <article className="blog-card"><Link href={href} className="blog-image" aria-label={article.title}><Image src={article.image} alt="" width={768} height={512} unoptimized /></Link>
    <div className="blog-card-content"><span className="article-category">{article.category}</span><h3><Link href={href}>{article.title}</Link></h3><p>{article.excerpt}</p>
      <Link href={href} className="article-link">{t.blog.more}{locale === "ar" ? <ArrowLeft size={17} /> : <ArrowRight size={17} />}</Link></div></article>;
}

export function BlogSection({ locale, articles, content, extraContent, showAll = true }: { locale: Locale; articles: ArticleView[]; content: SiteContent; extraContent: ExtraContent; showAll?: boolean }) {
  const t = content;
  const x = extraContent;
  return <section className="blog-section section-space" id="blog"><div className="container">
    <div className="section-heading"><SectionLabel>{t.blog.label}</SectionLabel><h2>{t.blog.title}</h2><p>{t.blog.description}</p></div>
    {articles.length ? <div className="blog-grid">{articles.map((article) => <ArticleCard key={article.id} locale={locale} article={article} content={content} />)}</div> : <p className="empty-note">{x.noArticles}</p>}
    {showAll && <div className="section-action"><Pill href={`/${locale}/blog`}>{x.viewAll}</Pill></div>}
  </div></section>;
}

export function FaqSection({ locale, content }: { locale: Locale; content: SiteContent }) {
  const t = content;
  return <section className="faq-section section-space"><div className="container faq-grid"><div><SectionLabel>{t.faq.label}</SectionLabel><h2>{t.faq.title}</h2><Pill href={`/${locale}/contact`}>{t.nav.contact}</Pill></div><Faq items={t.faq.items} /></div></section>;
}

export function CtaBanner({ locale, content, config }: { locale: Locale; content: SiteContent; config: PublicSiteConfig }) {
  const t = content;
  return <section className="consultation-banner" id="contact"><Image src={config.bannerImage} alt="" fill unoptimized sizes="100vw" /><div className="banner-shade" />
    <div className="container banner-content"><SectionLabel>{t.cta.label}</SectionLabel><h2>{t.cta.title}</h2><p>{t.cta.description}</p>{config.pages.book.enabled && <Pill white href={`/${locale}/book`}>{t.cta.book}</Pill>}</div></section>;
}
