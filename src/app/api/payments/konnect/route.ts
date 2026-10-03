import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { verifyCheckout } from "@/lib/konnect";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentRef = url.searchParams.get("payment_ref") || "";
  if (!/^[a-zA-Z0-9_-]{8,80}$/.test(paymentRef)) {
    return Response.json({ ok: false, message: "Invalid payment reference" }, { status: 400 });
  }
  try {
    const [consultation] = await db.select().from(consultationRequests).where(eq(consultationRequests.gatewayReference, paymentRef)).limit(1);
    if (!consultation) return Response.json({ ok: false }, { status: 404 });
    const status = await verifyCheckout(consultation);
    if (request.headers.get("accept")?.includes("text/html")) {
      const base = process.env.SITE_URL || new URL(request.url).origin;
      const destination = new URL(`/${consultation.locale === "fr" ? "fr" : "ar"}/book`, base);
      destination.searchParams.set("reference", consultation.reference);
      return NextResponse.redirect(destination, 303);
    }
    return Response.json({ ok: true, status });
  } catch (error) {
    console.error("Payment verification failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ ok: false, message: "Unable to verify payment" }, { status: 502 });
  }
}
