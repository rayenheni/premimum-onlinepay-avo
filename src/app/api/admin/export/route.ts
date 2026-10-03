import { desc } from "drizzle-orm";
import { db } from "@/db";
import { articles, cabinetInquiries, cmsPages, consultationRequests, mediaAssets, siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
const csv = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  await requireAdmin();
  const type = new URL(request.url).searchParams.get("type") || "backup";
  if (type === "consultations") {
    const rows = await db.select().from(consultationRequests).orderBy(desc(consultationRequests.createdAt));
    const keys = Object.keys(rows[0] || { reference: "", fullName: "", email: "", phone: "", service: "", amount: 0, status: "", createdAt: "" });
    const body = [keys.map(csv).join(","), ...rows.map((row) => keys.map((key) => csv(row[key as keyof typeof row])).join(","))].join("\n");
    return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=consultations.csv" } });
  }
  if (type === "messages") {
    const rows = await db.select().from(cabinetInquiries).orderBy(desc(cabinetInquiries.createdAt));
    const keys = Object.keys(rows[0] || { reference: "", kind: "", fullName: "", email: "", message: "", status: "", createdAt: "" });
    const body = [keys.map(csv).join(","), ...rows.map((row) => keys.map((key) => csv(row[key as keyof typeof row])).join(","))].join("\n");
    return new Response(body, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=messages.csv" } });
  }
  const [settings, pages, articleRows, media] = await Promise.all([
    db.select().from(siteSettings), db.select().from(cmsPages), db.select().from(articles),
    db.select({ id: mediaAssets.id, filename: mediaAssets.filename, mimeType: mediaAssets.mimeType, altAr: mediaAssets.altAr, altFr: mediaAssets.altFr, captionAr: mediaAssets.captionAr, captionFr: mediaAssets.captionFr, showInGallery: mediaAssets.showInGallery, createdAt: mediaAssets.createdAt }).from(mediaAssets),
  ]);
  return Response.json({ exportedAt: new Date().toISOString(), settings, pages, articles: articleRows, media }, { headers: { "Content-Disposition": "attachment; filename=cabinet-cms-backup.json" } });
}
