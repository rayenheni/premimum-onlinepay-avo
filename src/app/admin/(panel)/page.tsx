import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { articles, cabinetInquiries, consultationRequests } from "@/db/schema";
import { adminHref } from "@/lib/admin-path";
import { consultationStatuses, formatDate, serviceLabel } from "@/lib/admin-labels";

export default async function DashboardPage() {
  await requireAdmin();
  const base = await adminHref();
  const [[total], [pending], [paid], [messages], [published], recent, recentMessages] = await Promise.all([
    db.select({ value: count() }).from(consultationRequests),
    db.select({ value: count() }).from(consultationRequests).where(eq(consultationRequests.status, "awaiting_confirmation")),
    db.select({ value: count() }).from(consultationRequests).where(eq(consultationRequests.status, "paid")),
    db.select({ value: count() }).from(cabinetInquiries).where(eq(cabinetInquiries.status, "new")),
    db.select({ value: count() }).from(articles).where(eq(articles.published, true)),
    db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt)).limit(5),
    db.select().from(cabinetInquiries).orderBy(desc(cabinetInquiries.createdAt)).limit(5),
  ]);
  const [revenue] = await db.select({ value: sql<number>`coalesce(sum(${consultationRequests.amount}), 0)` })
    .from(consultationRequests)
    .where(eq(consultationRequests.status, "paid"));
  const cards = [
    { label: "Demandes de consultation", value: total.value, href: `${base}/consultations` },
    { label: "À confirmer", value: pending.value, href: `${base}/consultations` },
    { label: "Payées en ligne", value: paid.value, href: `${base}/consultations`, note: `${Number(revenue.value)} TND encaissés` },
    { label: "Nouveaux messages", value: messages.value, href: `${base}/messages` },
    { label: "Articles publiés", value: published.value, href: `${base}/articles` },
  ];
  return <>
    <header className="adm-header"><div><h1>Tableau de bord</h1><p>Vue d’ensemble de l’activité du site.</p></div></header>
    <div className="adm-stats">{cards.map((card) => <Link key={card.label} href={card.href} className="adm-stat"><strong>{card.value}</strong><span>{card.label}</span>{card.note && <small>{card.note}</small>}</Link>)}</div>
    <div className="adm-two-col">
      <section className="adm-card"><div className="adm-card-head"><h2>Dernières consultations</h2><Link href={`${base}/consultations`}>Tout voir</Link></div>
        {recent.length === 0 ? <p className="adm-empty">Aucune demande pour le moment.</p> : <ul className="adm-list">{recent.map((item) => <li key={item.id}><div><strong>{item.fullName}</strong><small>{serviceLabel(item.service)} · {item.amount} TND</small></div><div className="adm-list-end"><span className={`adm-badge adm-${item.status}`}>{consultationStatuses[item.status] || item.status}</span><small>{formatDate(item.createdAt)}</small></div></li>)}</ul>}</section>
      <section className="adm-card"><div className="adm-card-head"><h2>Derniers messages</h2><Link href={`${base}/messages`}>Tout voir</Link></div>
        {recentMessages.length === 0 ? <p className="adm-empty">Aucun message pour le moment.</p> : <ul className="adm-list">{recentMessages.map((item) => <li key={item.id}><div><strong>{item.fullName}</strong><small>{item.kind === "career" ? "Candidature" : "Contact"} · {item.subject || item.message.slice(0, 50)}</small></div><div className="adm-list-end"><span className={`adm-badge adm-${item.status}`}>{item.status === "new" ? "Nouveau" : "Traité"}</span><small>{formatDate(item.createdAt)}</small></div></li>)}</ul>}</section>
    </div>
  </>;
}
