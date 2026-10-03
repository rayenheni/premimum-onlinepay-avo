import { changeAdminPath, changePassword, saveSettings } from "@/app/admin/actions";
import { getAdminSlug } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { emailIsConfigured } from "@/lib/notifications";
import { getPublicSiteConfig, getSettingsMap } from "@/lib/site-config";

const messages: Record<string, string> = {
  email: "Adresse e-mail invalide.", phone: "Numéro de téléphone invalide.", url: "Les réseaux sociaux doivent utiliser une adresse HTTPS.",
  hours: "Horaires invalides : l’heure de fin doit être après l’ouverture.", current: "Le mot de passe actuel est incorrect.",
  newpassword: "Le nouveau mot de passe doit faire 10 caractères minimum et être confirmé.",
  adminpath: "Le chemin privé doit contenir au moins 8 caractères, uniquement des lettres, chiffres et tirets, et ne pas être réservé.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; changed?: string }> }) {
  await requireAdmin();
  const [query, settings, config, adminSlug] = await Promise.all([searchParams, getSettingsMap(), getPublicSiteConfig(), getAdminSlug()]);
  return <>
    <header className="adm-header"><div><h1>Paramètres</h1><p>Coordonnées, notifications, horaires, référencement et sécurité.</p></div></header>
    {(query.saved || query.changed) && <p className="adm-success" role="status">{query.changed === "path" ? `Nouvelle adresse d’administration active : /${adminSlug}` : query.saved === "password" ? "Mot de passe modifié." : "Paramètres enregistrés."}</p>}
    {query.error && messages[query.error] && <p className="adm-error" role="alert">{messages[query.error]}</p>}

    <form action={saveSettings} className="adm-card adm-form"><h2>Coordonnées et notifications</h2><p className="adm-hint">Les champs vides ne sont pas affichés. Les clés Konnect et Resend restent exclusivement dans les variables serveur.</p>
      <div className="adm-grid">
        <label><span>E-mail public</span><input name="contactEmail" type="email" defaultValue={settings.contactEmail || ""} dir="ltr" /></label>
        <label><span>E-mail recevant les alertes</span><input name="notificationEmail" type="email" defaultValue={settings.notificationEmail || ""} dir="ltr" /><small>État de l’envoi : {emailIsConfigured() ? "configuré" : "inactif — ajoutez RESEND_API_KEY et EMAIL_FROM"}.</small></label>
        <label><span>Téléphone</span><input name="contactPhone" defaultValue={settings.contactPhone || ""} dir="ltr" placeholder="+216 …" /></label>
        <label><span>WhatsApp (avec indicatif)</span><input name="whatsapp" defaultValue={settings.whatsapp || ""} dir="ltr" placeholder="216…" /></label>
        <label><span>Adresse</span><input name="address" defaultValue={settings.address || ""} maxLength={200} /></label>
        <label><span>Facebook</span><input name="facebookUrl" defaultValue={settings.facebookUrl || ""} dir="ltr" placeholder="https://…" /></label>
        <label><span>LinkedIn</span><input name="linkedinUrl" defaultValue={settings.linkedinUrl || ""} dir="ltr" placeholder="https://…" /></label>
      </div>
      <h2>Rendez-vous</h2><div className="adm-grid"><label><span>Ouverture</span><input name="officeStart" type="time" defaultValue={config.officeStart} required /></label><label><span>Fermeture</span><input name="officeEnd" type="time" defaultValue={config.officeEnd} required /></label><label><span>Durée d’un créneau</span><select name="slotMinutes" defaultValue={config.slotMinutes}>{[15, 30, 45, 60].map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label></div>
      <label className="adm-check"><input type="checkbox" name="seoIndexing" defaultChecked={config.seoIndexing} /><span>Autoriser l’indexation par Google et les moteurs de recherche</span></label>
      <div className="adm-actions"><button type="submit" className="adm-button adm-primary">Enregistrer les paramètres</button></div>
    </form>

    <form action={changeAdminPath} className="adm-card adm-form"><h2>Adresse privée de l’administration</h2><p className="adm-hint">Adresse actuelle : <code>/{adminSlug}</code>. La changer réduit les scans automatisés, mais la vraie protection reste le mot de passe et la session sécurisée. Enregistrez la nouvelle adresse dans votre gestionnaire de mots de passe.</p>
      <label><span>Nouveau chemin privé</span><input name="adminPath" defaultValue={adminSlug} pattern="[a-z0-9-]{8,48}" required dir="ltr" /></label>
      <div className="adm-actions"><button type="submit" className="adm-button adm-primary">Changer l’adresse d’administration</button></div>
    </form>

    <form action={changePassword} className="adm-card adm-form"><h2>Changer le mot de passe</h2><div className="adm-grid"><label><span>Mot de passe actuel</span><input name="current" type="password" required autoComplete="current-password" /></label><span /><label><span>Nouveau mot de passe</span><input name="next" type="password" required minLength={10} autoComplete="new-password" /></label><label><span>Confirmer</span><input name="confirm" type="password" required minLength={10} autoComplete="new-password" /></label></div><div className="adm-actions"><button type="submit" className="adm-button adm-primary">Modifier le mot de passe</button></div></form>
  </>;
}
