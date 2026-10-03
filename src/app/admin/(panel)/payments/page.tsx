import { requireAdmin } from "@/lib/auth";
import { getSettingsMap } from "@/lib/site-config";
import { allPaymentMethods } from "@/lib/site-config";
import { savePaymentSettings } from "@/app/admin/payment-actions";

const messages: Record<string, string> = {
  methods: "Activez au moins une méthode de paiement.",
  rib: "RIB invalide : 10 à 40 caractères, chiffres et espaces uniquement. Obligatoire pour le virement.",
  phone: "Numéro D17 invalide : 8 à 20 caractères, chiffres, espaces et « + » autorisés. Obligatoire pour D17.",
};

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { saved, error } = await searchParams;
  const settings = await getSettingsMap();
  const enabled: string[] = (() => { try { const parsed = JSON.parse(settings.paymentMethods || "[]"); return Array.isArray(parsed) ? parsed : []; } catch { return []; } })();

  return <>
    <header className="adm-header"><div><h1>Paiements</h1><p>Méthodes acceptées, coordonnées bancaires et collecte D17.</p></div></header>
    {saved && <p className="adm-success" role="status">Paramètres de paiement enregistrés.</p>}
    {error && messages[error] && <p className="adm-error" role="alert">{messages[error]}</p>}

    <form action={savePaymentSettings} className="adm-card adm-form">
      <h2>Méthodes proposées aux clients</h2>
      <p className="adm-hint">Les paiements par carte, e-Dinar et wallet Konnect passent par la passerelle. Le virement bancaire et D17 sont encaissés puis vérifiés manuellement par le cabinet.</p>
      <div className="adm-grid">
        {allPaymentMethods.map((method) => <label className="adm-check" key={method}>
          <input type="checkbox" name={`method:${method}`} defaultChecked={enabled.includes(method)} />
          <span>{method === "card" ? "Carte bancaire (Konnect)" : method === "edinar" ? "e-Dinar (Konnect)" : method === "konnect" ? "Wallet Konnect" : method === "bank_transfer" ? "Virement bancaire" : "D17 (La Poste Tunisienne)"}</span>
        </label>)}
      </div>

      <h2>Virement bancaire</h2>
      <p className="adm-hint">Affiché au client après le choix du virement. Il devra indiquer la référence de son opération.</p>
      <div className="adm-grid">
        <label><span>Banque</span><input name="bank.name" defaultValue={settings["bank.name"] || ""} maxLength={120} /></label>
        <label><span>Bénéficiaire</span><input name="bank.beneficiary" defaultValue={settings["bank.beneficiary"] || ""} maxLength={160} /></label>
        <label><span>RIB</span><input name="bank.rib" defaultValue={settings["bank.rib"] || ""} dir="ltr" placeholder="00 000 0000000000000 00" /><small>Chiffres et espaces uniquement.</small></label>
      </div>
      <div className="adm-grid">
        <label dir="rtl"><span>تعليمات التحويل (عربي)</span><textarea name="bank.instructionsAr" defaultValue={settings["bank.instructionsAr"] || ""} rows={4} maxLength={600} /></label>
        <label><span>Instructions de virement (français)</span><textarea name="bank.instructionsFr" defaultValue={settings["bank.instructionsFr"] || ""} rows={4} maxLength={600} /></label>
      </div>

      <h2>D17 — La Poste Tunisienne</h2>
      <p className="adm-hint">Le client paie via l’application D17 puis saisit la référence de l’opération. La vérification se fait dans votre compte e-Dinar / D17 : aucun automate public ne confirme ce paiement.</p>
      <div className="adm-grid">
        <label><span>Numéro de paiement D17</span><input name="d17.phone" defaultValue={settings["d17.phone"] || ""} dir="ltr" placeholder="+216 …" /></label>
        <label><span>Code marchand (facultatif)</span><input name="d17.merchantCode" defaultValue={settings["d17.merchantCode"] || ""} dir="ltr" maxLength={60} /></label>
      </div>
      <div className="adm-grid">
        <label dir="rtl"><span>تعليمات الدفع (عربي)</span><textarea name="d17.instructionsAr" defaultValue={settings["d17.instructionsAr"] || ""} rows={4} maxLength={600} /></label>
        <label><span>Instructions de paiement (français)</span><textarea name="d17.instructionsFr" defaultValue={settings["d17.instructionsFr"] || ""} rows={4} maxLength={600} /></label>
      </div>

      <button className="adm-button adm-primary" type="submit">Enregistrer les paiements</button>
    </form>
  </>;
}
