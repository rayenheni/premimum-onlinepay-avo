import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, consultationRequests, tenants } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/auth";
import { createTenant, setTenantStatus } from "@/app/admin/tenant-actions";
import { formatDate } from "@/lib/admin-labels";

const errors: Record<string, string> = {
  invalid: "Vérifiez les noms (AR/FR), l’e-mail et l’identifiant (lettres minuscules, chiffres et tirets, 3 à 60 caractères).",
  domain: "Domaine invalide. Exemple : cabinet-xyz.tn",
  email: "Cet e-mail est déjà utilisé par un administrateur.",
};

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN || "plateforme.tn";

export default async function TenantsPage({ searchParams }: { searchParams: Promise<{ created?: string; password?: string; error?: string }> }) {
  await requirePlatformAdmin();
  const query = await searchParams;
  const [rows, admins] = await Promise.all([
    db.select().from(tenants).orderBy(desc(tenants.createdAt)),
    db.select().from(adminUsers),
  ]);
  const requestCounts = new Map<number, number>();
  for (const tenant of rows) {
    const [row] = await db.select({ value: count() }).from(consultationRequests).where(eq(consultationRequests.tenantId, tenant.id));
    requestCounts.set(tenant.id, Number(row?.value ?? 0));
  }
  const createdAdmin = query.created ? admins.find((admin) => admin.tenantId === Number(query.created)) : undefined;

  return <>
    <header className="adm-header"><div><h1>Sites clients</h1><p>Chaque cabinet dispose de son site, son administration et ses paiements.</p></div></header>
    {query.error && errors[query.error] && <p className="adm-error" role="alert">{errors[query.error]}</p>}
    {query.created && query.password && <div className="adm-card adm-success-box">
      <h2>Site client créé</h2>
      <p>Transmettez ces identifiants une seule fois au cabinet. Le mot de passe provisoire n’est plus affichable ensuite.</p>
      <dl className="adm-facts">
        <div><dt>E-mail</dt><dd dir="ltr">{createdAdmin?.email}</dd></div>
        <div><dt>Mot de passe provisoire</dt><dd dir="ltr"><code>{decodeURIComponent(query.password)}</code></dd></div>
        <div><dt>Adresse du site</dt><dd dir="ltr">{createdAdmin ? `${PLATFORM_DOMAIN}` : ""}</dd></div>
      </dl>
      <p className="adm-hint">Le cabinet changera ce mot de passe à la première connexion (Paramètres → mot de passe).</p>
    </div>}

    <form action={createTenant} className="adm-card adm-form">
      <h2>Créer un nouveau site</h2>
      <div className="adm-grid">
        <label><span>Nom du cabinet (français)</span><input name="nameFr" required maxLength={200} placeholder="Cabinet …" /></label>
        <label dir="rtl"><span>اسم المكتب (عربي)</span><input name="nameAr" required maxLength={200} dir="rtl" /></label>
        <label><span>Identifiant</span><input name="slug" required pattern="[a-z][a-z0-9-]{2,59}" placeholder="cabinet-xyz" dir="ltr" /><small>Adresse : cabinet-xyz.{PLATFORM_DOMAIN}</small></label>
        <label><span>E-mail administrateur</span><input name="email" type="email" required dir="ltr" maxLength={180} /></label>
        <label><span>Domaine personnalisé (facultatif)</span><input name="domain" dir="ltr" placeholder="cabinet-xyz.tn" maxLength={190} /><small>À faire pointer vers ce serveur chez l’hébergeur.</small></label>
      </div>
      <button className="adm-button adm-primary" type="submit">Créer le site et son administration</button>
    </form>

    <div className="tenant-grid">{rows.map((tenant) => <article className="adm-card tenant-card" key={tenant.id}>
      <div className="tenant-card-head"><div><h3>{tenant.nameFr}</h3><p dir="rtl">{tenant.nameAr}</p></div>
        <span className={`adm-badge ${tenant.status === "active" ? "adm-paid" : "adm-cancelled"}`}>{tenant.status === "active" ? "Actif" : "Suspendu"}</span></div>
      <dl className="tenant-meta">
        <div><dt>Identifiant</dt><dd dir="ltr">/{tenant.slug}</dd></div>
        <div><dt>Domaine</dt><dd dir="ltr">{tenant.domain || `— (${tenant.slug}.${PLATFORM_DOMAIN})`}</dd></div>
        <div><dt>Formule</dt><dd>{tenant.plan}</dd></div>
        <div><dt>Administrateur</dt><dd dir="ltr">{admins.filter((admin) => admin.tenantId === tenant.id).map((admin) => admin.email).join(", ") || tenant.adminEmail}</dd></div>
        <div><dt>Créé le</dt><dd>{formatDate(tenant.createdAt)}</dd></div>
        <div><dt>Demandes de consultation</dt><dd>{requestCounts.get(tenant.id) ?? 0}</dd></div>
      </dl>
      <div className="adm-actions">
        <form action={setTenantStatus} className="adm-inline">
          <input type="hidden" name="id" value={tenant.id} />
          <input type="hidden" name="status" value={tenant.status === "active" ? "suspended" : "active"} />
          <button className="adm-button">{tenant.status === "active" ? "Suspendre" : "Réactiver"}</button>
        </form>
      </div>
    </article>)}</div>
  </>;
}
