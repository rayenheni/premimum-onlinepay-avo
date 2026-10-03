import Link from "next/link";
import type { ReactNode } from "react";
import { count, eq } from "drizzle-orm";
import {
  BookOpen, CalendarCheck, ClipboardList, ExternalLink, FilePenLine, GalleryHorizontal, Image,
  Inbox, LayoutDashboard, LogOut, PanelsTopLeft, Settings, ShieldCheck, Scale, WalletCards,
} from "lucide-react";
import { db } from "@/db";
import { cabinetInquiries, consultationRequests } from "@/db/schema";
import { adminHref } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/admin/actions";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  const base = await adminHref();
  const [[newMessages], [toConfirm]] = await Promise.all([
    db.select({ value: count() }).from(cabinetInquiries).where(eq(cabinetInquiries.status, "new")),
    db.select({ value: count() }).from(consultationRequests).where(eq(consultationRequests.status, "awaiting_confirmation")),
  ]);
  const links = [
    { href: base, label: "Tableau de bord", Icon: LayoutDashboard, badge: 0 },
    { href: `${base}/consultations`, label: "Consultations", Icon: CalendarCheck, badge: toConfirm.value },
    { href: `${base}/messages`, label: "Messages", Icon: Inbox, badge: newMessages.value },
    { href: `${base}/articles`, label: "Articles", Icon: BookOpen, badge: 0 },
    { href: `${base}/content`, label: "Tous les textes", Icon: FilePenLine, badge: 0 },
    { href: `${base}/pages`, label: "Pages & SEO", Icon: PanelsTopLeft, badge: 0 },
    { href: `${base}/media`, label: "Médiathèque", Icon: GalleryHorizontal, badge: 0 },
    { href: `${base}/appearance`, label: "Logo & apparence", Icon: Image, badge: 0 },
    { href: `${base}/audit`, label: "Journal de sécurité", Icon: ShieldCheck, badge: 0 },
    { href: `${base}/payments`, label: "Paiements", Icon: WalletCards, badge: 0 },
    { href: `${base}/settings`, label: "Paramètres", Icon: Settings, badge: 0 },
  ];
  return <div className="adm-shell">
    <aside className="adm-sidebar">
      <div className="adm-brand"><span><Scale size={22} /></span><div><strong>Votre Cabinet</strong><small>Administration CMS</small></div></div>
      <nav>{links.map(({ href, label, Icon, badge }) => <Link key={href} href={href}><Icon size={19} />{label}{badge > 0 && <em>{badge}</em>}</Link>)}</nav>
      <div className="adm-sidebar-footer"><Link href="/ar" target="_blank"><ExternalLink size={17} />Voir le site</Link><Link href="/api/admin/export?type=backup"><ClipboardList size={17} />Exporter le contenu</Link><p>{admin.email}</p>
        <form action={logoutAction}><button type="submit" className="adm-logout"><LogOut size={17} />Déconnexion</button></form></div>
    </aside>
    <main className="adm-main">{children}</main>
  </div>;
}
