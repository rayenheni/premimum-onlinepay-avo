import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { getSiteContent } from "@/lib/cms";
import { createCheckout, paymentIsConfigured } from "@/lib/konnect";
import { sendEmail } from "@/lib/notifications";
import { rateLimited } from "@/lib/request-guard";
import { getPublicSiteConfig, allPaymentMethods, type PaymentMethod } from "@/lib/site-config";
import { proofRequiredMethods } from "@/lib/admin-labels";

export const dynamic = "force-dynamic";

const services = new Set(["general", "corporate", "individual", "commercial", "family", "property", "employment", "criminal", "contracts"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";

function availableTimes(start: string, end: string, step: number) {
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const result = new Set<string>();
  for (let minute = startHour * 60 + startMinute; minute < endHour * 60 + endMinute; minute += step) {
    result.add(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
  }
  return result;
}

export async function POST(request: Request) {
  if (rateLimited(request, "booking")) return Response.json({ ok: false, message: "Trop de demandes. Merci de réessayer plus tard. / طلبات كثيرة، يرجى المحاولة لاحقاً." }, { status: 429 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ ok: false, message: "JSON required" }, { status: 415 });
  if (Number(request.headers.get("content-length") || 0) > 15000) return Response.json({ ok: false, message: "Request too large" }, { status: 413 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ ok: false, message: "Invalid request" }, { status: 400 });

  const locale = body.locale === "fr" ? "fr" : "ar";
  const [content, config] = await Promise.all([getSiteContent(locale), getPublicSiteConfig()]);
  const amounts = new Set(content.booking.formats.map((format) => Number(format.value)).filter((amount) => Number.isInteger(amount) && amount > 0));
  // Only methods enabled in this installation are accepted, and the amount must match an approved tariff.
  const methods = new Set<PaymentMethod>(config.payments.methods);

  const fullName = clean(body.fullName, 140);
  const email = clean(body.email, 180).toLowerCase();
  const phone = clean(body.phone, 40);
  const service = clean(body.service, 120);
  const preferredDate = clean(body.preferredDate, 40);
  const preferredTime = clean(body.preferredTime, 10);
  const message = clean(body.message, 4000);
  const paymentMethod = clean(body.paymentMethod, 40);
  const proofReference = clean(body.paymentReference, 120);
  const proofRequired = proofRequiredMethods.has(paymentMethod as PaymentMethod);
  const amount = Number(body.amount);
  const digits = phone.replace(/\D/g, "");
  const invalid = locale === "ar" ? "يرجى التحقق من الحقول المطلوبة والموافقة على سياسة الخصوصية." : "Merci de vérifier les champs obligatoires et d’accepter la politique de confidentialité.";

  if (fullName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || digits.length < 8 || digits.length > 15
    || !services.has(service) || !methods.has(paymentMethod as PaymentMethod) || !amounts.has(amount) || body.consent !== true || body.website
    || (proofRequired && (proofReference.length < 4 || !/^[A-Za-z0-9 .\/-]{4,120}$/.test(proofReference)))) {
    return Response.json({ ok: false, message: invalid }, { status: 400 });
  }
  if (preferredDate && (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(preferredDate)) || preferredDate < new Date().toISOString().slice(0, 10))) {
    return Response.json({ ok: false, message: locale === "ar" ? "اختاروا تاريخاً صالحاً في المستقبل." : "Choisissez une date valide à venir." }, { status: 400 });
  }
  if (preferredTime && (!preferredDate || !availableTimes(config.officeStart, config.officeEnd, config.slotMinutes).has(preferredTime))) {
    return Response.json({ ok: false, message: locale === "ar" ? "الوقت المختار غير متاح." : "L’heure choisie n’est pas disponible." }, { status: 400 });
  }

  try {
    const reference = `LAW-${randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;
    const status = proofRequired ? "awaiting_verification" : paymentIsConfigured() ? "payment_pending" : "awaiting_confirmation";
    const [created] = await db.insert(consultationRequests).values({
      reference, fullName, email, phone, service, preferredDate: preferredDate || null, preferredTime: preferredTime || null,
      message: message || null, locale, paymentMethod, amount,
      paymentReference: proofRequired ? proofReference : null,
      proofSubmittedAt: proofRequired ? new Date() : null,
      status,
    }).returning();

    after(async () => {
      const schedule = [preferredDate, preferredTime].filter(Boolean).join(" ") || "Non précisé";
      if (config.notificationEmail) await sendEmail({
        to: config.notificationEmail,
        replyTo: email,
        subject: `Nouvelle consultation ${reference}`,
        text: `Nouvelle demande de ${fullName}\nRéférence: ${reference}\nE-mail: ${email}\nTéléphone: ${phone}\nService: ${service}\nDate/heure souhaitée: ${schedule}\nMontant: ${amount} TND\n\n${message}`,
      });
      await sendEmail({
        to: email,
        subject: locale === "ar" ? `تم استلام طلبكم ${reference}` : `Votre demande a été reçue — ${reference}`,
        text: locale === "ar"
          ? `مرحباً ${fullName}،\n\nتم تسجيل طلب استشارتكم تحت المرجع ${reference}. سيؤكد المكتب الموعد بعد مراجعة الطلب.\n\nمكتبكم القانوني`
          : `Bonjour ${fullName},\n\nVotre demande de consultation est enregistrée sous la référence ${reference}. Le cabinet confirmera le rendez-vous après examen.\n\nVotre Cabinet`,
      });
    });

    if (!proofRequired && paymentIsConfigured()) {
      try {
        const checkout = await createCheckout(created);
        if (checkout) return Response.json({ ok: true, reference, status: "payment_pending", payUrl: checkout.payUrl }, { status: 201 });
      } catch (error) {
        console.error("Konnect initialization failed", error instanceof Error ? error.message : "Unknown error");
        await db.update(consultationRequests).set({ status: "payment_unavailable" }).where(eq(consultationRequests.id, created.id));
        return Response.json({ ok: true, reference, status: "payment_unavailable" }, { status: 201 });
      }
    }
    return Response.json({ ok: true, reference, status }, { status: 201 });
  } catch (error) {
    console.error("Consultation persistence failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ ok: false, message: locale === "ar" ? "تعذّر تسجيل الطلب. يرجى المحاولة مرة أخرى." : "Impossible d’enregistrer la demande. Merci de réessayer." }, { status: 500 });
  }
}
