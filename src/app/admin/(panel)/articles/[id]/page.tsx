import { requireAdmin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { articles } from "@/db/schema";
import { adminHref } from "@/lib/admin-path";
import { ArticleForm } from "@/components/admin/article-form";

export default async function EditArticlePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) notFound();
  const [article] = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  if (!article) notFound();
  const { error } = await searchParams;
  const base = await adminHref();
  return <><header className="adm-header"><div><h1>Modifier l’article</h1><p>/{article.slug}</p></div></header><ArticleForm article={article} error={error} backHref={`${base}/articles`} /></>;
}
