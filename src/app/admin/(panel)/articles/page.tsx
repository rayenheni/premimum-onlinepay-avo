import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { deleteArticle } from "@/app/admin/actions";
import { ConfirmButton } from "@/components/admin/confirm-button";
import { listArticles } from "@/lib/articles";
import { adminHref } from "@/lib/admin-path";
import { formatDate } from "@/lib/admin-labels";

export default async function ArticlesAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const base = await adminHref();
  await listArticles("fr", 1); // seeds the starter articles on first use
  const rows = await db.select().from(articles).orderBy(desc(articles.createdAt));
  return <>
    <header className="adm-header"><div><h1>Articles</h1><p>Gérez le contenu du journal en français et en arabe.</p></div><Link href={`${base}/articles/new`} className="adm-button adm-primary">Nouvel article</Link></header>
    {saved && <p className="adm-success" role="status">Article enregistré.</p>}
    {rows.length === 0 ? <p className="adm-card adm-empty">Aucun article. Créez le premier.</p> : <div className="adm-stack">{rows.map((row) => <article className="adm-card adm-item adm-row" key={row.id}>
      <div><h2>{row.titleFr || row.titleAr}</h2><p className="adm-meta">{row.titleFr && row.titleAr ? row.titleAr : "Une seule langue"} · /{row.slug} · {formatDate(row.updatedAt)}</p></div>
      <div className="adm-actions"><span className={`adm-badge ${row.published ? "adm-paid" : "adm-cancelled"}`}>{row.published ? "Publié" : "Brouillon"}</span>
        <Link href={`${base}/articles/${row.id}`} className="adm-button adm-primary">Modifier</Link>
        {row.published && <Link href={`/fr/blog/${row.slug}`} target="_blank" className="adm-button">Voir</Link>}
        <form action={deleteArticle}><input type="hidden" name="id" value={row.id} /><ConfirmButton message="Supprimer définitivement cet article ?">Supprimer</ConfirmButton></form></div>
    </article>)}</div>}
  </>;
}
