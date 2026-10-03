import { requireAdmin } from "@/lib/auth";
import { adminHref } from "@/lib/admin-path";
import { ArticleForm } from "@/components/admin/article-form";

export default async function NewArticlePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const base = await adminHref();
  return <><header className="adm-header"><div><h1>Nouvel article</h1><p>Renseignez au moins une langue.</p></div></header><ArticleForm error={error} backHref={`${base}/articles`} /></>;
}
