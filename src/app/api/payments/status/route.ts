import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { verifyCheckout } from "@/lib/konnect";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reference = new URL(request.url).searchParams.get("reference") || "";
  if (!/^LAW-[A-Z0-9]{7,16}$/.test(reference)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  try {
    const [consultation] = await db.select().from(consultationRequests).where(eq(consultationRequests.reference, reference)).limit(1);
    if (!consultation) return Response.json({ ok: false }, { status: 404 });
    let status = consultation.status;
    if (consultation.gatewayReference && ["payment_pending", "payment_unavailable"].includes(status)) {
      try { status = await verifyCheckout(consultation); } catch { /* Never turn a pending payment into a success on a provider error. */ }
    }
    return Response.json({ ok: true, reference, status, amount: consultation.amount }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
