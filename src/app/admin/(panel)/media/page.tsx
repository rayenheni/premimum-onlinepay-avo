import Image from "next/image";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { deleteMedia, updateMedia, uploadMedia } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/admin-labels";

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ uploaded?: string; error?: string }> }) {
  await requireAdmin();
  const [query, assets] = await Promise.all([searchParams, db.select({ id: mediaAssets.id, filename: mediaAssets.filename, mimeType: mediaAssets.mimeType, size: mediaAssets.size, altAr: mediaAssets.altAr, altFr: mediaAssets.altFr, captionAr: mediaAssets.captionAr, captionFr: mediaAssets.captionFr, showInGallery: mediaAssets.showInGallery, createdAt: mediaAssets.createdAt }).from(mediaAssets).orderBy(desc(mediaAssets.createdAt))]);
  return <>
    <header className="adm-header"><div><h1>Médiathèque & galerie</h1><p>Importez vos propres images, ajoutez les textes alternatifs et choisissez celles de la galerie publique.</p></div></header>
    {query.uploaded && <p className="adm-success">Image importée.</p>}{query.error && <p className="adm-error">{query.error === "used" ? "Cette image est utilisée par un article. Modifiez d’abord l’image de l’article." : "Fichier refusé. Formats acceptés : JPG, PNG ou WebP, 5 Mo maximum."}</p>}
    <form action={uploadMedia} className="adm-card adm-form" encType="multipart/form-data"><h2>Importer une image</h2><div className="adm-grid"><label><span>Fichier *</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label><label className="adm-check"><input type="checkbox" name="showInGallery" /><span>Afficher dans la galerie publique</span></label><label dir="rtl"><span>النص البديل</span><input name="altAr" maxLength={240} /></label><label><span>Texte alternatif français</span><input name="altFr" maxLength={240} /></label><label dir="rtl"><span>التعليق</span><input name="captionAr" maxLength={300} /></label><label><span>Légende française</span><input name="captionFr" maxLength={300} /></label></div><button className="adm-button adm-primary" type="submit">Importer</button></form>
    <div className="adm-media-grid">{assets.map((asset) => <article className="adm-card adm-media" key={asset.id}><div className="adm-media-preview"><Image src={`/media/${asset.id}`} alt={asset.altFr || asset.altAr || ""} width={500} height={320} unoptimized /></div><p><strong>{asset.filename}</strong><small>{Math.ceil(asset.size / 1024)} Ko · {formatDate(asset.createdAt)}</small><code>/media/{asset.id}</code></p>
      <form action={updateMedia} className="adm-form"><input type="hidden" name="id" value={asset.id} /><div className="adm-grid"><label dir="rtl"><span>النص البديل</span><input name="altAr" defaultValue={asset.altAr || ""} /></label><label><span>Alt français</span><input name="altFr" defaultValue={asset.altFr || ""} /></label><label dir="rtl"><span>التعليق</span><input name="captionAr" defaultValue={asset.captionAr || ""} /></label><label><span>Légende</span><input name="captionFr" defaultValue={asset.captionFr || ""} /></label></div><label className="adm-check"><input type="checkbox" name="showInGallery" defaultChecked={asset.showInGallery} /><span>Galerie publique</span></label><button className="adm-button adm-primary" type="submit">Mettre à jour</button></form>
      <form action={deleteMedia}><input type="hidden" name="id" value={asset.id} /><ConfirmButton message="Supprimer définitivement cette image ?">Supprimer</ConfirmButton></form></article>)}</div>
  </>;
}
