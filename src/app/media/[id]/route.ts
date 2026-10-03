import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { getTenant } from "@/lib/tenant";
import { mediaAssets } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 404 });
  const tenant = await getTenant();
  const [asset] = await db.select().from(mediaAssets).where(and(eq(mediaAssets.tenantId, tenant?.id ?? 1), eq(mediaAssets.id, id))).limit(1);
  if (!asset) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.mimeType,
      "Content-Length": String(asset.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="${asset.filename.replace(/["\\]/g, "-")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
