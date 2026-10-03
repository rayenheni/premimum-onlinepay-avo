import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paymentProofs } from "@/db/schema";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Payment receipts are private: only an authenticated firm administrator may read them. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await getAdmin()) return Response.json({ ok: false }, { status: 401 });
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id < 1) return new Response(null, { status: 404 });
  const [proof] = await db.select().from(paymentProofs).where(eq(paymentProofs.id, id)).limit(1);
  if (!proof) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(proof.data), {
    headers: {
      "Content-Type": proof.mimeType,
      "Content-Length": String(proof.size),
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${proof.filename.replace(/["\\]/g, "-")}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
