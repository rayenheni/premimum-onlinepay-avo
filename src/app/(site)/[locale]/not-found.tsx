"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale } from "lucide-react";

export default function NotFound() {
  const fr = (usePathname() || "").startsWith("/fr");
  return <section className="not-found-page"><div className="container">
    <span className="not-found-icon"><Scale size={34} /></span>
    <p className="not-found-code">404</p>
    <h1>{fr ? "Page introuvable" : "الصفحة غير موجودة"}</h1>
    <p>{fr ? "La page demandée n’existe pas ou a été déplacée." : "الصفحة التي تبحثون عنها غير موجودة أو تم نقلها."}</p>
    <div className="not-found-actions"><Link href={fr ? "/fr" : "/ar"} className="pill pill-brown">{fr ? "Retour à l’accueil" : "العودة إلى الرئيسية"}</Link><Link href={fr ? "/fr/contact" : "/ar/contact"} className="hero-secondary not-found-secondary">{fr ? "Nous contacter" : "تواصل معنا"}</Link></div>
  </div></section>;
}
