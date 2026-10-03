import { db } from "@/db";
import { consultationRequests } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { sendEmail } from "@/lib/notifications";

type Consultation = typeof consultationRequests.$inferSelect;

function credentials() {
  const apiKey = process.env.KONNECT_API_KEY;
  const walletId = process.env.KONNECT_WALLET_ID;
  if (!apiKey || !walletId) return null;
  const base = process.env.KONNECT_ENV === "production"
    ? "https://api.konnect.network/api/v2"
    : "https://api.sandbox.konnect.network/api/v2";
  return { apiKey, walletId, base };
}

function localPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("216") ? digits.slice(3) : digits;
}

export function paymentIsConfigured() {
  return Boolean(credentials());
}

export async function createCheckout(consultation: Consultation, requestOrigin: string) {
  const config = credentials();
  if (!config) return null;

  const origin = process.env.SITE_URL || requestOrigin;
  const webhook = new URL("/api/payments/konnect", origin).toString();
  const nameParts = consultation.fullName.split(/\s+/);
  const method = consultation.paymentMethod === "edinar"
    ? "e-DINAR"
    : consultation.paymentMethod === "konnect" ? "wallet" : "bank_card";

  const response = await fetch(`${config.base}/payments/init-payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
    body: JSON.stringify({
      receiverWalletId: config.walletId,
      token: "TND",
      amount: consultation.amount * 1000,
      type: "immediate",
      description: `Consultation — Cabinet Abou Yahia Labbaoui — ${consultation.reference}`,
      acceptedPaymentMethods: [method],
      lifespan: 30,
      checkoutForm: true,
      addPaymentFeesToAmount: false,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(" "),
      phoneNumber: localPhone(consultation.phone),
      email: consultation.email,
      orderId: consultation.reference,
      webhook,
      theme: "light",
    }),
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Konnect checkout returned ${response.status}`);
  const data = await response.json() as { paymentRef?: string; payUrl?: string };
  if (!data.paymentRef || !data.payUrl) throw new Error("Invalid checkout response");
  const payUrl = new URL(data.payUrl);
  if (payUrl.protocol !== "https:" || !(/(^|\.)konnect\.network$/i).test(payUrl.hostname)) {
    throw new Error("Unexpected checkout URL");
  }

  await db.update(consultationRequests).set({
    gatewayReference: data.paymentRef,
    paymentUrl: payUrl.toString(),
    status: "payment_pending",
  }).where(eq(consultationRequests.id, consultation.id));

  return { payUrl: payUrl.toString(), paymentRef: data.paymentRef };
}

export async function verifyCheckout(consultation: Consultation) {
  if (!["payment_pending", "payment_unavailable"].includes(consultation.status)) return consultation.status;
  const config = credentials();
  if (!config || !consultation.gatewayReference) return consultation.status;

  const response = await fetch(`${config.base}/payments/${encodeURIComponent(consultation.gatewayReference)}`, {
    headers: { "x-api-key": config.apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`Konnect verification returned ${response.status}`);

  const data = await response.json() as {
    payment?: {
      status?: string;
      token?: string;
      orderId?: string;
      reachedAmount?: number;
      receiverWallet?: { id?: string; _id?: string } | string;
    };
  };
  const payment = data.payment;
  const receivedBy = typeof payment?.receiverWallet === "string"
    ? payment.receiverWallet
    : payment?.receiverWallet?.id || payment?.receiverWallet?._id;

  if (payment?.status === "completed"
    && payment.token === "TND"
    && payment.orderId === consultation.reference
    && receivedBy === config.walletId
    && typeof payment.reachedAmount === "number"
    && payment.reachedAmount >= consultation.amount * 1000) {
    const updated = await db.update(consultationRequests).set({ status: "paid" }).where(and(eq(consultationRequests.id, consultation.id), ne(consultationRequests.status, "paid"))).returning({ id: consultationRequests.id });
    if (updated.length === 0) return "paid";
    await sendEmail({
      to: consultation.email,
      subject: consultation.locale === "ar" ? `تم تأكيد الدفع ${consultation.reference}` : `Paiement confirmé — ${consultation.reference}`,
      text: consultation.locale === "ar"
        ? `مرحباً ${consultation.fullName}،\n\nتم التحقق من دفع ${consultation.amount} د.ت للطلب ${consultation.reference}. سيتولى المكتب تأكيد موعد الاستشارة.\n\nمكتب أبو يحيى اللباوي`
        : `Bonjour ${consultation.fullName},\n\nLe paiement de ${consultation.amount} TND pour la demande ${consultation.reference} a été vérifié. Le cabinet vous confirmera le rendez-vous séparément.\n\nCabinet Abou Yahia Labbaoui`,
    });
    return "paid";
  }
  return consultation.status;
}
