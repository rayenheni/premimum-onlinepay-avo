import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { db } from "@/db";
import { getTenant } from "@/lib/tenant";
import { cabinetInquiries } from "@/db/schema";
import { sendEmail } from "@/lib/notifications";
import { rateLimited } from "@/lib/request-guard";
import { getPublicSiteConfig } from "@/lib/site-config";

export const dynamic = "force-dynamic";
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (rateLimited(request, "inquiry")) return Response.json({ ok: false, message: "Trop de demandes. Merci de réessayer plus tard. / طلبات كثيرة، يرجى المحاولة لاحقاً." }, { status: 429 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ ok: false, message: "JSON required" }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 15000) return Response.json({ ok: false, message: "Request too large" }, { status: 413 });
  const tenant = await getTenant();
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ ok: false, message: "Invalid request" }, { status: 400 });

  const locale = body.locale === "fr" ? "fr" : "ar";
  const fullName = clean(body.fullName, 140);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 40);
  const subject = clean(body.subject, 160);
  const message = clean(body.message, 4000);
  const kind = body.kind === "career" ? "career" : "contact";
  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 5 || body.consent !== true || body.website) {
    return Response.json({ ok: false, message: locale === "ar" ? "يرجى استكمال الاسم والبريد والرسالة والموافقة على سياسة الخصوصية." : "Merci de compléter votre nom, votre e-mail, votre message et votre consentement." }, { status: 400 });
  }

  try {
    const reference = `MSG-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    await db.insert(cabinetInquiries).values({ tenantId: tenant?.id ?? 1, reference, kind, fullName, email, phone: phone || null, subject: subject || null, message, locale });
    const config = await getPublicSiteConfig();
    after(async () => {
      if (config.notificationEmail) await sendEmail({
        to: config.notificationEmail,
        replyTo: email,
        subject: `${kind === "career" ? "Nouvelle candidature" : "Nouveau message"} ${reference}`,
        text: `${fullName}\n${email}\n${phone}\nObjet: ${subject}\nRéférence: ${reference}\n\n${message}`,
      });
      await sendEmail({
        to: email,
        subject: locale === "ar" ? `تم استلام رسالتكم ${reference}` : `Votre message a été reçu — ${reference}`,
        text: locale === "ar"
          ? `مرحباً ${fullName}،\n\nتم تسجيل رسالتكم تحت المرجع ${reference}. سيعود إليكم المكتب في أقرب وقت.\n\nمكتب أبو يحيى اللباوي`
          : `Bonjour ${fullName},\n\nVotre message est enregistré sous la référence ${reference}. Le cabinet vous répondra dans les meilleurs délais.\n\nCabinet Abou Yahia Labbaoui`,
      });
    });
    return Response.json({ ok: true, reference }, { status: 201 });
  } catch (error) {
    console.error("Inquiry persistence failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ ok: false, message: locale === "ar" ? "تعذّر تسجيل الرسالة. يرجى المحاولة من جديد." : "Impossible d’enregistrer votre message. Merci de réessayer." }, { status: 500 });
  }
}
