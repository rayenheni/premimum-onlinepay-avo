"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowUpLeft, BadgeCheck, BriefcaseBusiness, Building2, ChevronDown, FileText, Gavel, HeartHandshake, Home,
  Mail, MapPin, Menu, MessageCircle, MessageSquare, Phone, Scale, Search, Users, X, type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/lib/site-content";
import type { SiteContent, PageKey } from "@/lib/cms";
import type { PublicSiteConfig } from "@/lib/site-config";
import { Brand, Pill } from "@/components/ui";

const areaIcons: Record<string, LucideIcon> = { commercial: BriefcaseBusiness, family: HeartHandshake, property: Home, employment: Users, criminal: Gavel, contracts: FileText };

function Facebook({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 22v-9h3l.5-3.5h-3.5V7.2c0-1 .3-1.7 1.8-1.7h1.9V2.4c-.9-.1-1.8-.2-2.7-.2-2.8 0-4.7 1.7-4.7 4.9v2.4H7.4V13h3.1v9h3.7Z" /></svg>;
}
function Linkedin({ size = 16 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.7 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM3 9h3.4v12H3V9Zm5.6 0h3.3v1.6h.1c.5-.9 1.6-1.9 3.5-1.9 3.6 0 4.3 2.3 4.3 5.4V21h-3.4v-6.1c0-1.5-.1-3.3-2-3.3s-2.3 1.6-2.3 3.2V21H8.6V9Z" /></svg>;
}
function WhatsAppIcon() {
  return <svg width="29" height="29" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.6l1.3-4.8a8.5 8.5 0 1 1 16.2-4Z" stroke="currentColor" strokeWidth="1.8" /><path d="m8.6 7.3 1.2 2-1 1c.6 1.6 1.7 2.7 3.2 3.3l1.1-1 2 1.2c.2.2.2.5 0 .9-.5 1-1.4 1.1-2.6.7-2.8-1-4.9-3.1-5.7-5.3-.5-1.5 0-2.3.8-2.8.4-.2.8-.2 1 0Z" fill="currentColor" /></svg>;
}

export function SiteShell({ locale, config, content, children }: { locale: Locale; config: PublicSiteConfig; content: SiteContent; children: ReactNode }) {
  const t = content;
  const arabic = locale === "ar";
  const base = `/${locale}`;
  const other: Locale = arabic ? "fr" : "ar";
  const pathname = usePathname() || base;
  const switchHref = pathname.replace(/^\/(ar|fr)(?=\/|$)/, `/${other}`);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [languageMenu, setLanguageMenu] = useState(false);
  const [servicesMenu, setServicesMenu] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMobileMenu(false); setLanguageMenu(false); setServicesMenu(false); setChatOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", onKey); };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { setMobileMenu(false); setLanguageMenu(false); setServicesMenu(false); setChatOpen(false); }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const active = (href: string) => href === base ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);
  const linkProps = (href: string) => ({ href, "aria-current": active(href) ? ("page" as const) : undefined, className: active(href) ? "nav-active" : undefined });
  const visible = (key: PageKey) => config.pages[key].enabled && config.pages[key].showInNav;
  const navItems = [
    { key: "home" as PageKey, href: base, label: t.nav.home },
    { key: "about" as PageKey, href: `${base}/about`, label: t.nav.about },
    { key: "services" as PageKey, href: `${base}/services`, label: t.nav.services },
    { key: "blog" as PageKey, href: `${base}/blog`, label: t.nav.blog },
    { key: "careers" as PageKey, href: `${base}/careers`, label: t.nav.careers },
    { key: "contact" as PageKey, href: `${base}/contact`, label: t.nav.contact },
    { key: "gallery" as PageKey, href: `${base}/gallery`, label: t.nav.gallery },
    { key: "search" as PageKey, href: `${base}/search`, label: t.nav.search },
  ].filter((item) => visible(item.key));

  function share(channel: "facebook" | "linkedin" | "email") {
    const url = encodeURIComponent(window.location.href);
    if (channel === "email") { window.location.href = `mailto:?subject=Cabinet%20Abou%20Yahia%20Labbaoui&body=${url}`; return; }
    window.open(channel === "facebook" ? `https://www.facebook.com/sharer/sharer.php?u=${url}` : `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, "_blank", "noopener,noreferrer");
  }
  const headerSolid = scrolled || mobileMenu;
  const social = (network: "facebook" | "linkedin", size: number) => {
    const href = network === "facebook" ? config.facebookUrl : config.linkedinUrl;
    const Icon = network === "facebook" ? Facebook : Linkedin;
    return href
      ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={network}><Icon size={size} /></a>
      : <button type="button" onClick={() => share(network)} aria-label={arabic ? `مشاركة على ${network}` : `Partager sur ${network}`}><Icon size={size} /></button>;
  };

  return <div className={`law-site${arabic ? " is-arabic" : " is-french"}`} dir={arabic ? "rtl" : "ltr"} lang={locale}>
    <header className={`site-header${headerSolid ? " header-scrolled" : ""}`}>
      <div className="topbar"><div className="container topbar-inner"><span className="topbar-address"><MapPin size={12} />{config.address || t.location}</span><div className="social-links">{social("facebook", 14)}<button type="button" onClick={() => share("email")} aria-label={arabic ? "مشاركة عبر البريد" : "Partager par e-mail"}><Mail size={14} /></button>{social("linkedin", 14)}</div></div></div>
      <div className="header-main"><div className="container nav-grid">
        <div className="nav-left"><div className="nav-tools">
          {config.pages.search.enabled && <Link href={`${base}/search`} className="icon-button header-search" aria-label={t.nav.search}><Search size={21} /></Link>}
          <div className="language-control"><button type="button" className="language-button" onClick={() => { setLanguageMenu((current) => !current); setServicesMenu(false); }} aria-expanded={languageMenu} aria-label={arabic ? "اختيار اللغة" : "Choisir la langue"}><ChevronDown size={15} /><span className="language-label">{t.nav.language}</span><span className="language-flag" aria-hidden="true">{arabic ? "🇹🇳" : "🇫🇷"}</span></button>
            {languageMenu && <div className="language-dropdown"><Link href={arabic ? pathname : switchHref} lang="ar" hrefLang="ar"><span>🇹🇳</span>العربية{arabic && <BadgeCheck size={15} />}</Link><Link href={arabic ? switchHref : pathname} lang="fr" hrefLang="fr"><span>🇫🇷</span>Français{!arabic && <BadgeCheck size={15} />}</Link></div>}</div>
          <button type="button" className="icon-button mobile-menu-toggle" onClick={() => { setMobileMenu((current) => !current); setLanguageMenu(false); }} aria-label={mobileMenu ? t.nav.close : t.nav.menu} aria-expanded={mobileMenu}>{mobileMenu ? <X size={23} /> : <Menu size={23} />}</button>
        </div>
          <nav className="secondary-navigation" aria-label={arabic ? "روابط المكتب" : "Liens du cabinet"}>{visible("blog") && <Link {...linkProps(`${base}/blog`)}>{t.nav.blog}</Link>}{visible("careers") && <Link {...linkProps(`${base}/careers`)}>{t.nav.careers}</Link>}{visible("contact") && <Link {...linkProps(`${base}/contact`)}>{t.nav.contact}</Link>}{visible("gallery") && <Link {...linkProps(`${base}/gallery`)}>{t.nav.gallery}</Link>}</nav></div>
        <Link href={base} className="nav-logo" aria-label={t.nav.home}><Brand locale={locale} logoUrl={config.logoUrl} /></Link>
        <div className="nav-right">{config.pages.book.enabled && <Pill white={!headerSolid} href={`${base}/book`} className="header-book"><span className="header-book-label">{t.nav.book}</span></Pill>}
          <nav className="primary-navigation" aria-label={arabic ? "التنقل الرئيسي" : "Navigation principale"}>{visible("home") && <Link {...linkProps(base)} className={`nav-home${active(base) ? " nav-active" : ""}`}>{t.nav.home}</Link>}{visible("about") && <Link {...linkProps(`${base}/about`)}>{t.nav.about}</Link>}
            {visible("services") && <div className="services-control" onMouseEnter={() => setServicesMenu(true)} onMouseLeave={() => setServicesMenu(false)}><Link href={`${base}/services`} className={`services-trigger${active(`${base}/services`) ? " nav-active" : ""}`} onFocus={() => setServicesMenu(true)}>{t.nav.services}<ChevronDown size={15} /></Link>
              {servicesMenu && <div className="services-dropdown"><span>{t.practice.title}</span>{t.practice.groups.map((group) => <Link key={group.id} href={`${base}/services/${group.id}`}>{group.id === "corporate" ? <Building2 size={19} /> : <Users size={19} />}{group.title}<ArrowUpLeft size={15} /></Link>)}<div className="dropdown-divider" />{t.practice.areas.map((area) => { const AreaIcon = areaIcons[area.id] || Scale; return <Link key={area.id} href={`${base}/services/${area.id}`}><AreaIcon size={17} />{area.title}</Link>; })}</div>}</div>}
          </nav></div>
      </div></div>
      {mobileMenu && <nav className="mobile-navigation" aria-label={t.nav.menu}>{navItems.map(({ href, label }) => <Link key={href} href={href}>{label}<ArrowUpLeft size={18} /></Link>)}{config.pages.book.enabled && <Pill href={`${base}/book`}>{t.nav.book}</Pill>}</nav>}
    </header>

    <main>{children}</main>

    <footer className="site-footer"><div className="container footer-grid">
      <div className="footer-about"><Link href={base}><Brand locale={locale} footer logoUrl={config.logoUrl} /></Link><p>{t.footer.description}</p><div className="footer-social social-links">{social("facebook", 17)}{social("linkedin", 17)}{config.pages.contact.enabled && <Link href={`${base}/contact`} aria-label={t.nav.contact}><Mail size={17} /></Link>}</div></div>
      <div className="footer-column"><h3>{t.footer.navigation}</h3>{navItems.filter((item) => item.key !== "search").map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}{config.pages.book.enabled && <Link href={`${base}/book`}>{t.nav.book}</Link>}</div>
      <div className="footer-column"><h3>{t.footer.services}</h3>{config.pages.services.enabled && t.practice.areas.map((area) => <Link key={area.id} href={`${base}/services/${area.id}`}>{area.title}</Link>)}</div>
      <div className="footer-column footer-contact"><h3>{t.footer.contact}</h3><span><MapPin size={17} />{config.address || t.footer.location}</span>{config.contactEmail ? <a href={`mailto:${config.contactEmail}`}><Mail size={17} /><b dir="ltr">{config.contactEmail}</b></a> : config.pages.contact.enabled && <Link href={`${base}/contact`}><Mail size={17} />{t.footer.email}</Link>}{config.contactPhone ? <a href={`tel:${config.contactPhone}`}><Phone size={17} /><b dir="ltr">{config.contactPhone}</b></a> : config.pages.book.enabled && <Link href={`${base}/book`}><Phone size={17} />{t.footer.office}</Link>}<span><MessageCircle size={17} />{t.footer.languages}</span><div className="footer-payments"><span>VISA</span><span>e-Dinar</span><span>Konnect</span></div></div>
    </div><div className="container footer-bottom"><p>© {new Date().getFullYear()} {t.footer.rights}</p><div>{config.pages.privacy.enabled && <Link href={`${base}/privacy`}>{t.footer.privacy}</Link>}{config.pages.legal.enabled && <Link href={`${base}/legal`}>{t.footer.legal}</Link>}</div></div><p className="footer-demo-note container">{t.footer.demo}</p></footer>

    <div className="floating-contact">{config.whatsapp ? <a className="whatsapp-button" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label={t.contactForm.whatsapp}><WhatsAppIcon /></a> : config.pages.contact.enabled && <Link className="whatsapp-button" href={`${base}/contact`} aria-label={t.nav.contact}><WhatsAppIcon /></Link>}<button type="button" className={`chat-button${chatOpen ? " is-open" : ""}`} aria-label={chatOpen ? t.nav.close : t.contactForm.chat} aria-expanded={chatOpen} onClick={() => setChatOpen((current) => !current)}>{chatOpen ? <X size={24} /> : <MessageSquare size={26} fill="currentColor" />}</button></div>
    {chatOpen && <aside className="quick-contact" aria-label={t.contactForm.chat}><div className="quick-contact-heading"><span><Scale size={21} /></span><strong>{t.promise.author}</strong><button type="button" className="icon-button" onClick={() => setChatOpen(false)} aria-label={t.nav.close}><X size={17} /></button></div><div className="quick-contact-body"><h3>{t.contactForm.chat}</h3><p>{t.contactForm.chatText}</p>{config.pages.contact.enabled && <Pill href={`${base}/contact`}>{t.contactForm.submit}</Pill>}{config.pages.book.enabled && <Link href={`${base}/book`} className="quick-book-link">{t.nav.book}<ArrowUpLeft size={16} /></Link>}</div></aside>}
  </div>;
}
