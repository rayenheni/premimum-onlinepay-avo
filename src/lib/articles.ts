import { count, desc, eq } from "drizzle-orm";
import { databaseConfigured, db } from "@/db";
import { articles, siteSettings } from "@/db/schema";
import { siteContent, type Locale } from "@/lib/site-content";

export type ArticleView = {
  id: number;
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  paragraphs: string[];
  image: string;
  createdAt: Date;
};

const seedSlugs = ["premiere-consultation", "contrat-clair", "base-juridique-entreprise"];

async function ensureSeed() {
  const [flag] = await db.select().from(siteSettings).where(eq(siteSettings.key, "articlesSeeded")).limit(1);
  if (flag) return;
  const [{ value }] = await db.select({ value: count() }).from(articles);
  if (value === 0) {
    await db.insert(articles).values(seedSlugs.map((slug, index) => {
      const ar = siteContent.ar.blog.articles[index];
      const fr = siteContent.fr.blog.articles[index];
      return {
        slug,
        image: ar.image,
        published: true,
        categoryAr: ar.category,
        categoryFr: fr.category,
        titleAr: ar.title,
        titleFr: fr.title,
        excerptAr: ar.excerpt,
        excerptFr: fr.excerpt,
        bodyAr: ar.paragraphs.join("\n\n"),
        bodyFr: fr.paragraphs.join("\n\n"),
      };
    })).onConflictDoNothing();
  }
  await db.insert(siteSettings).values({ key: "articlesSeeded", value: "1" }).onConflictDoNothing();
}

function toView(row: typeof articles.$inferSelect, locale: Locale): ArticleView {
  const pick = (ar: string | null, fr: string | null) => (locale === "ar" ? ar || fr : fr || ar) || "";
  return {
    id: row.id,
    slug: row.slug,
    image: row.image,
    createdAt: row.createdAt,
    category: pick(row.categoryAr, row.categoryFr),
    title: pick(row.titleAr, row.titleFr),
    excerpt: pick(row.excerptAr, row.excerptFr),
    paragraphs: pick(row.bodyAr, row.bodyFr).split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
  };
}

export async function listArticles(locale: Locale, limit?: number): Promise<ArticleView[]> {
  if (!databaseConfigured) return [];
  try {
    await ensureSeed();
    const query = db.select().from(articles).where(eq(articles.published, true)).orderBy(desc(articles.createdAt));
    const rows = limit ? await query.limit(limit) : await query;
    return rows.map((row) => toView(row, locale));
  } catch (error) {
    console.error("Unable to load articles", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

export async function getArticleBySlug(locale: Locale, slug: string): Promise<ArticleView | null> {
  if (!databaseConfigured || !/^[a-z0-9-]{1,120}$/.test(slug)) return null;
  await ensureSeed();
  const [row] = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return row && row.published ? toView(row, locale) : null;
}
