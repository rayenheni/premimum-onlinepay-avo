import Link from "next/link";
import type { articles } from "@/db/schema";
import { saveArticle } from "@/app/admin/actions";

type Article = typeof articles.$inferSelect;
const errors: Record<string, string> = {
  title: "Ajoutez au moins un titre (arabe ou français).",
  body: "Ajoutez le contenu de l’article dans au moins une langue.",
  slug: "Ce lien (slug) est déjà utilisé. Choisissez-en un autre.",
};

export function ArticleForm({ article, error, backHref }: { article?: Article; error?: string; backHref: string }) {
  return <form action={saveArticle} className="adm-card adm-form adm-article-form">
    {article && <input type="hidden" name="id" value={article.id} />}
    {error && errors[error] && <p className="adm-error" role="alert">{errors[error]}</p>}
    <div className="adm-grid">
      <label><span>Lien de l’article (slug)</span><input name="slug" defaultValue={article?.slug} placeholder="ex. bail-commercial-conseils" dir="ltr" pattern="[a-zA-Z0-9\-]*" /><small>Lettres, chiffres et tirets. Généré depuis le titre français si laissé vide.</small></label>
      <label><span>Image</span><input name="image" defaultValue={article?.image || "/images/article-family.jpg"} list="article-images" dir="ltr" /><datalist id="article-images"><option value="/images/article-family.jpg" /><option value="/images/article-contracts.jpg" /><option value="/images/article-business.jpg" /><option value="/images/justice.png" /></datalist><small>Choisissez une image du site ou collez une adresse https://.</small></label>
    </div>
    <div className="adm-grid">
      <fieldset><legend>Français</legend>
        <label><span>Titre</span><input name="titleFr" defaultValue={article?.titleFr || ""} maxLength={220} /></label>
        <label><span>Catégorie</span><input name="categoryFr" defaultValue={article?.categoryFr || ""} maxLength={120} /></label>
        <label><span>Résumé</span><textarea name="excerptFr" defaultValue={article?.excerptFr || ""} rows={3} maxLength={600} /></label>
        <label><span>Contenu (séparez les paragraphes par une ligne vide)</span><textarea name="bodyFr" defaultValue={article?.bodyFr || ""} rows={12} /></label></fieldset>
      <fieldset dir="rtl"><legend>العربية</legend>
        <label><span>العنوان</span><input name="titleAr" defaultValue={article?.titleAr || ""} maxLength={220} /></label>
        <label><span>التصنيف</span><input name="categoryAr" defaultValue={article?.categoryAr || ""} maxLength={120} /></label>
        <label><span>ملخص</span><textarea name="excerptAr" defaultValue={article?.excerptAr || ""} rows={3} maxLength={600} /></label>
        <label><span>المحتوى (افصلوا الفقرات بسطر فارغ)</span><textarea name="bodyAr" defaultValue={article?.bodyAr || ""} rows={12} /></label></fieldset>
    </div>
    <label className="adm-check"><input type="checkbox" name="published" defaultChecked={article ? article.published : true} /><span>Publié sur le site</span></label>
    <div className="adm-actions"><button type="submit" className="adm-button adm-primary">Enregistrer l’article</button><Link href="/admin/articles" className="adm-button">Annuler</Link></div>
  </form>;
}
