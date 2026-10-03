import { requireAdmin } from "@/lib/auth";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { deleteConsultation, updateConsultationStatus } from "@/app/admin/actions";
import { verifyConsultationPayment } from "@/app/admin/payment-actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { consultationStatuses, formatDate, manualStatuses, paymentMethods, serviceLabel } from "@/lib/admin-labels";

export default async function ConsultationsPage() {
  await requireAdmin();
  const rows = await db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt)).limit(300);
  return <>
    <header className="adm-header"><div><h1>Consultations</h1><p>Demandes de rendez-vous et état des paiements.</p></div></header>
    {rows.length === 0 ? <p className="adm-card adm-empty">Aucune demande de consultation pour le moment.</p> : <div className="adm-stack">{rows.map((row) => <article className="adm-card adm-item" key={row.id}>
      <div className="adm-item-top"><div><h2>{row.fullName}</h2><p><a href={`mailto:${row.email}`}>{row.email}</a> · <a href={`tel:${row.phone}`} dir="ltr">{row.phone}</a></p></div>
        <span className={`adm-badge adm-${row.status}`}>{consultationStatuses[row.status] || row.status}</span></div>
      <dl className="adm-facts"><div><dt>Référence</dt><dd dir="ltr">{row.reference}</dd></div><div><dt>Domaine</dt><dd>{serviceLabel(row.service)}</dd></div><div><dt>Montant</dt><dd>{row.amount} TND</dd></div><div><dt>Paiement</dt><dd>{paymentMethods[row.paymentMethod] || row.paymentMethod}</dd></div>
        {row.paymentReference && <div><dt>Référence client</dt><dd dir="ltr">{row.paymentReference}{row.verifiedAt ? ` · vérifié le ${formatDate(row.verifiedAt)}` : ""}</dd></div>}<div><dt>Date souhaitée</dt><dd>{row.preferredDate || "—"}{row.preferredTime ? ` à ${row.preferredTime}` : ""}</dd></div><div><dt>Langue</dt><dd>{row.locale === "ar" ? "Arabe" : "Français"}</dd></div><div><dt>Reçue le</dt><dd>{formatDate(row.createdAt)}</dd></div></dl>
      {row.message && <p className="adm-message">{row.message}</p>}
      <div className="adm-actions">
        <form action={updateConsultationStatus} className="adm-inline"><input type="hidden" name="id" value={row.id} />
          <select name="status" defaultValue={row.status} aria-label="Statut">{!manualStatuses.includes(row.status) && <option value={row.status} disabled>{consultationStatuses[row.status] || row.status}</option>}{manualStatuses.map((status) => <option key={status} value={status}>{consultationStatuses[status]}</option>)}</select>
          <button type="submit" className="adm-button adm-primary">Mettre à jour</button></form>
        {row.paymentReference && row.status !== "paid" && <form action={verifyConsultationPayment} className="adm-inline"><input type="hidden" name="id" value={row.id} /><button type="submit" className="adm-button adm-primary">Vérifier et marquer payé</button></form>}
        <form action={deleteConsultation}><input type="hidden" name="id" value={row.id} /><ConfirmButton message="Supprimer définitivement cette demande ?">Supprimer</ConfirmButton></form>
      </div></article>)}</div>}
  </>;
}
