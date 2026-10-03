import { savePages } from "@/app/admin/actions";
import { getCmsPages, pageDefinitions } from "@/lib/cms";
import { requireAdmin } from "@/lib/auth";

export default async function PagesPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const [{ saved }, pages] = await Promise.all([searchParams, getCmsPages()]);
  return <>
    <header className="adm-header"><div><h1>Pages & SEO</h1><p>Publiez ou masquez les pages, contrôlez le menu et les balises de recherche.</p></div></header>
    {saved && <p className="adm-success">Pages mises à jour.</p>}
    <form action={savePages} className="adm-stack">{pageDefinitions.map((definition) => {
      const page = pages[definition.key];
      return <details className="adm-card adm-page-card" key={definition.key} open={definition.key === "home"}>
        <summary><div><strong>{definition.labelFr}</strong><small>{definition.labelAr} · /fr/{definition.key === "home" ? "" : definition.key}</small></div><span className={`adm-badge ${page.enabled ? "adm-paid" : "adm-cancelled"}`}>{page.enabled ? "Publiée" : "Masquée"}</span></summary>
        <div className="adm-page-fields"><div className="adm-actions">
          <label className="adm-check"><input type="checkbox" name={`enabled:${definition.key}`} defaultChecked={page.enabled} disabled={definition.key === "home"} /><span>Page publiée</span></label>
          <label className="adm-check"><input type="checkbox" name={`nav:${definition.key}`} defaultChecked={page.showInNav} /><span>Afficher dans la navigation</span></label>
        </div><div className="adm-grid">
          <fieldset dir="rtl"><legend>SEO العربية</legend><label><span>عنوان الصفحة</span><input name={`metaTitleAr:${definition.key}`} defaultValue={page.metaTitleAr} maxLength={220} /></label><label><span>وصف محركات البحث</span><textarea name={`metaDescriptionAr:${definition.key}`} defaultValue={page.metaDescriptionAr} rows={3} maxLength={600} /></label></fieldset>
          <fieldset><legend>SEO Français</legend><label><span>Titre de la page</span><input name={`metaTitleFr:${definition.key}`} defaultValue={page.metaTitleFr} maxLength={220} /></label><label><span>Description pour les moteurs</span><textarea name={`metaDescriptionFr:${definition.key}`} defaultValue={page.metaDescriptionFr} rows={3} maxLength={600} /></label></fieldset>
        </div></div>
      </details>;
    })}<div className="adm-sticky-actions"><button className="adm-button adm-primary" type="submit">Enregistrer les pages</button></div></form>
  </>;
}
