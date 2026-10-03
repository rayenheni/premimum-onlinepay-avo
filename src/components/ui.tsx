import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpLeft } from "lucide-react";
import type { Locale } from "@/lib/site-content";

export function Brand({ locale, footer = false, logoUrl = "" }: { locale: Locale; footer?: boolean; logoUrl?: string }) {
  if (logoUrl) return <span className={`firm-brand${footer ? " firm-brand-footer" : ""}`}><Image src={logoUrl} alt={locale === "ar" ? "شعار المكتب القانوني" : "Logo du cabinet"} width={180} height={100} unoptimized /></span>;
  return <span className={`firm-brand${footer ? " firm-brand-footer" : ""}`}>
    <svg viewBox="0 0 160 84" role="img" aria-label="Votre Cabinet — Avocat" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">{Array.from({ length: 43 }, (_, index) => {
        const height = 12 + (1 - Math.abs(index - 21) / 21) * 32;
        return <rect key={index} x={28 + index * 2.43} y={48 - height} width="1.35" height={height} />;
      })}</g>
      <text x="80" y="66" textAnchor="middle" fill="currentColor" fontSize={locale === "ar" ? 19 : 18} fontWeight="700" fontFamily="IBM Plex Sans Arabic, Arial, sans-serif">{locale === "ar" ? "مكتبكم القانوني" : "CABINET"}</text>
      <text x="80" y="79" textAnchor="middle" fill="currentColor" fontSize={locale === "ar" ? 7 : 6.5} fontFamily="IBM Plex Sans Arabic, Arial, sans-serif">{locale === "ar" ? "محاماة واستشارات" : "AVOCAT · CONSEIL JURIDIQUE"}</text>
    </svg>
  </span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <span className="section-label"><i />{children}</span>;
}

export function Pill({ children, white = false, href, onClick, className = "", type = "button" }: {
  children: ReactNode; white?: boolean; href?: string; onClick?: () => void; className?: string; type?: "button" | "submit";
}) {
  const content = <><span>{children}</span><span className="pill-arrow"><ArrowUpLeft size={17} strokeWidth={1.8} /></span></>;
  const classes = `pill ${white ? "pill-white" : "pill-brown"} ${className}`;
  return href ? <Link href={href} className={classes}>{content}</Link> : <button type={type} onClick={onClick} className={classes}>{content}</button>;
}
