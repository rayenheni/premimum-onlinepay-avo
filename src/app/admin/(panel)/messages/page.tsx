import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { Download } from "lucide-react";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { cabinetInquiries } from "@/db/schema";
import { deleteInquiry, updateInquiryStatus } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { formatDate } from "@/lib/admin-labels";

export default async function MessagesPage() {
  await requireAdmin();
  const rows = await db.select().from(cabinetInquiries).orderBy(desc(cabinetInquiries.createdAt)).limit(300);
  return <>
    <header className="adm-header"><div><h1>Messages</h1><p>Messages de contact et candidatures spontanées.</p></div><Link href="/api/admin/export?type=messages" className="adm-button"><Download size={16} />Exporter CSV</Link></header>
    {rows.length === 0 ? <p className="adm-card adm-empty">Aucun message pour le moment.</p> : <div className="adm-stack">{rows.map((row) => <article className="adm-card adm-item" key={row.id}>
      <div className="adm-item-top"><div><h2>{row.fullName}</h2><p><a href={`mailto:${row.email}`}>{row.email}</a>{row.phone && <> · <a href={`tel:${row.phone}`} dir="ltr">{row.phone}</a></>}</p></div>
        <div className="adm-badges"><span className="adm-badge adm-kind">{row.kind === "career" ? "Candidature" : "Contact"}</span><span className={`adm-badge adm-${row.status}`}>{row.status === "new" ? "Nouveau" : "Traité"}</span></div></div>
      {row.subject && <h3 className="adm-subject">{row.subject}</h3>}
      <p className="adm-message">{row.message}</p>
      <p className="adm-meta"><span dir="ltr">{row.reference}</span> · {formatDate(row.createdAt)} · {row.locale === "ar" ? "Arabe" : "Français"}</p>
      <div className="adm-actions">
        <form action={updateInquiryStatus}><input type="hidden" name="id" value={row.id} /><input type="hidden" name="status" value={row.status === "new" ? "handled" : "new"} /><button type="submit" className="adm-button adm-primary">{row.status === "new" ? "Marquer comme traité" : "Marquer comme nouveau"}</button></form>
        <form action={deleteInquiry}><input type="hidden" name="id" value={row.id} /><ConfirmButton message="Supprimer définitivement ce message ?">Supprimer</ConfirmButton></form>
      </div></article>)}</div>}
  </>;
}
