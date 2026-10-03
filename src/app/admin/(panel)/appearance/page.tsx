import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { saveAppearance } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { DEFAULT_VIDEO, defaultImages, getSettingsMap } from "@/lib/site-config";

const fields = [
  ["logoUrl", "Logo", "Laissez vide pour utiliser le monogramme AL intégré."],
  ["heroImage", "Grande image de la page d’accueil", "Arrière-plan principal avec le drapeau tunisien."],
  ["aboutImage", "Image de présentation", "Image affichée dans la section À propos."],
  ["pageHeroImage", "Image des en-têtes de pages", "Arrière-plan commun des pages internes."],
  ["bannerImage", "Image du bandeau de consultation", "Image du dernier appel à l’action."],
  ["journeyImage", "Image du parcours", "Image des balances de justice."],
] as const;

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const [query, settings, media] = await Promise.all([searchParams, getSettingsMap(), db.select({ id: mediaAssets.id, filename: mediaAssets.filename }).from(mediaAssets)]);
  return <>
    <header className="adm-header"><div><h1>Logo & apparence</h1><p>Contrôlez toutes les images principales et la vidéo de présentation.</p></div></header>
    {query.saved && <p className="adm-success">Apparence mise à jour.</p>}{query.error && <p className="adm-error">Adresse de média ou de vidéo invalide.</p>}
    <form action={saveAppearance} className="adm-card adm-form"><datalist id="media-library">{media.map((asset) => <option key={asset.id} value={`/media/${asset.id}`}>{asset.filename}</option>)}</datalist>
      <div className="adm-grid">{fields.map(([key, label, note]) => <label key={key}><span>{label}</span><input name={key} list="media-library" dir="ltr" defaultValue={settings[key] || (key === "logoUrl" ? "" : defaultImages[key])} /><small>{note} Choisissez /media/… depuis la médiathèque ou une adresse HTTPS.</small></label>)}</div>
      <label><span>Vidéo de présentation</span><input name="introVideoUrl" dir="ltr" defaultValue={settings.introVideoUrl === undefined ? DEFAULT_VIDEO : settings.introVideoUrl} /><small>Fichier /videos/….mp4, lien HTTPS vers MP4, YouTube ou Vimeo. Vide = vidéo masquée.</small></label>
      <button className="adm-button adm-primary" type="submit">Enregistrer l’apparence</button>
    </form>
  </>;
}
