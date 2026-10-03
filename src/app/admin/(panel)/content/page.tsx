import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contentRevisions } from "@/db/schema";
import { resetContent, restoreContentRevision, saveContent } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { flattenEditableContent, getExtraContent, getSiteContent, getValueAtPath } from "@/lib/cms";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/admin-labels";

const labels: Record<string, string> = {
  nav: "Navigation", hero: "Bannière d’accueil", about: "Présentation du cabinet", stats: "Chiffres et repères",
  journey: "Parcours du dossier", practice: "Services", why: "Pourquoi le cabinet", promise: "Engagement",
  blog: "Journal", faq: "Questions fréquentes", cta: "Appel à l’action", booking: "Réservation et paiement",
  contactForm: "Contact et carrières", search: "Recherche", footer: "Pied de page", privacy: "Confidentialité",
  legal: "Mentions légales", introduction: "Présentation vidéo", location: "Localisation", partnersLabel: "Ruban de références",
};

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ saved?: string; restored?: string; reset?: string }> }) {
  await requireAdmin();
  const status = await searchParams;
  const [ar, fr, extraAr, extraFr, revisions] = await Promise.all([
    getSiteContent("ar"), getSiteContent("fr"), getExtraContent("ar"), getExtraContent("fr"),
    db.select().from(contentRevisions).orderBy(desc(contentRevisions.createdAt)).limit(12),
  ]);
  const entries = [
    ...flattenEditableContent(ar).map((item) => ({ namespace: "content", path: item.path })),
    ...flattenEditableContent(extraAr).map((item) => ({ namespace: "extra", path: item.path })),
  ];
  const grouped = Object.groupBy(entries, (item) => item.namespace === "extra" ? `extra.${item.path.split(".")[0]}` : item.path.split(".")[0]);
  return <>
    <header className="adm-header"><div><h1>Tous les textes</h1><p>Modifiez chaque libellé, paragraphe, bouton, tarif et durée en arabe et en français.</p></div></header>
    {(status.saved || status.restored || status.reset) && <p className="adm-success" role="status">Contenu enregistré et publié.</p>}
    <form action={saveContent} className="adm-content-form">
      {Object.entries(grouped).map(([group, groupPaths]) => <details className="adm-card adm-content-group" key={group} open={["hero", "about"].includes(group)}>
        <summary><strong>{labels[group] || group}</strong><small>{groupPaths?.length || 0} champs</small></summary>
        <div className="adm-content-fields">{groupPaths?.map((entry) => {
          const arSource = entry.namespace === "extra" ? extraAr : ar;
          const frSource = entry.namespace === "extra" ? extraFr : fr;
          const arValue = getValueAtPath(arSource, entry.path) ?? "";
          const frValue = getValueAtPath(frSource, entry.path) ?? "";
          const multiline = String(arValue).length > 100 || String(frValue).length > 100 || /(description|body|text|paragraph|quote|disclaimer|intro)/i.test(entry.path);
          const numeric = typeof arValue === "number";
          const key = `${entry.namespace}:${entry.path}`;
          return <div className="adm-cms-field" key={key}><code>{key}</code><div className="adm-grid">
            <label dir="rtl"><span>العربية</span>{multiline ? <textarea name={`ar:${key}`} defaultValue={arValue} rows={4} /> : <input name={`ar:${key}`} type={numeric ? "number" : "text"} defaultValue={arValue} />}</label>
            <label><span>Français</span>{multiline ? <textarea name={`fr:${key}`} defaultValue={frValue} rows={4} /> : <input name={`fr:${key}`} type={numeric ? "number" : "text"} defaultValue={frValue} />}</label>
          </div></div>;
        })}</div>
      </details>)}
      <div className="adm-sticky-actions"><button className="adm-button adm-primary" type="submit">Enregistrer tous les textes</button></div>
    </form>
    <section className="adm-card adm-revisions"><h2>Historique et restauration</h2><p className="adm-hint">Chaque enregistrement crée automatiquement une sauvegarde des textes précédents.</p>
      <div className="adm-revision-list">{revisions.map((revision) => <form action={restoreContentRevision} key={revision.id}><input type="hidden" name="id" value={revision.id} /><span>{revision.locale === "ar" ? "العربية" : "Français"} · {formatDate(revision.createdAt)}</span><ConfirmButton message="Restaurer cette version ? La version actuelle sera sauvegardée." className="adm-button">Restaurer</ConfirmButton></form>)}</div>
      <div className="adm-actions">{(["ar", "fr"] as const).map((locale) => <form action={resetContent} key={locale}><input type="hidden" name="locale" value={locale} /><ConfirmButton message={`Rétablir tous les textes ${locale === "ar" ? "arabes" : "français"} d’origine ?`}>Réinitialiser {locale.toUpperCase()}</ConfirmButton></form>)}</div>
    </section>
  </>;
}
