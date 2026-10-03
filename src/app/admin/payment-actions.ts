"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { consultationRequests, paymentProofs, siteSettings } from "@/db/schema";
import { adminHref } from "@/lib/admin-path";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { allPaymentMethods } from "@/lib/site-config";
import { proofRequiredMethods } from "@/lib/admin-labels";

const text = (form: FormData, key: string, max: number) => String(form.get(key) ?? "").trim().slice(0, max);

/** Enables payment methods and stores bank + D17 collection details for this installation. */
export async function savePaymentSettings(formData: FormData) {
  const admin = await requireAdmin();
  const methods = allPaymentMethods.filter((method) => formData.get(`method:${method}`) === "on");
  if (methods.length === 0) redirect(`${await adminHref("payments")}?error=methods`);
  const rib = text(formData, "bank.rib", 40);
  if (rib && !/^[0-9 ]{10,40}$/.test(rib)) redirect(`${await adminHref("payments")}?error=rib`);
  const d17Phone = text(formData, "d17.phone", 20);
  if (d17Phone && !/^\+?[0-9 ]{8,20}$/.test(d17Phone)) redirect(`${await adminHref("payments")}?error=phone`);
  if (methods.includes("bank_transfer") && !rib) redirect(`${await adminHref("payments")}?error=rib`);
  if (methods.includes("d17") && !d17Phone) redirect(`${await adminHref("payments")}?error=phone`);

  const entries: [string, string][] = [
    ["paymentMethods", JSON.stringify(methods)],
    ["bank.name", text(formData, "bank.name", 120)],
    ["bank.rib", rib],
    ["bank.beneficiary", text(formData, "bank.beneficiary", 160)],
    ["bank.instructionsAr", text(formData, "bank.instructionsAr", 600)],
    ["bank.instructionsFr", text(formData, "bank.instructionsFr", 600)],
    ["d17.phone", d17Phone],
    ["d17.merchantCode", text(formData, "d17.merchantCode", 60)],
    ["d17.instructionsAr", text(formData, "d17.instructionsAr", 600)],
    ["d17.instructionsFr", text(formData, "d17.instructionsFr", 600)],
  ];
  for (const [key, value] of entries) {
    await db.insert(siteSettings).values({ key, value })
      .onConflictDoUpdate({ target: siteSettings.key, set: { value } });
  }
  await audit(admin.id, "payments.update", methods.join(","));
  revalidatePath("/", "layout");
  redirect(`${await adminHref("payments")}?saved=1`);
}

/** Marks a bank transfer / D17 request as verified. Requires an explicit client reference. */
export async function verifyConsultationPayment(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const [row] = await db.select({
    id: consultationRequests.id,
    paymentMethod: consultationRequests.paymentMethod,
    paymentReference: consultationRequests.paymentReference,
    status: consultationRequests.status,
  }).from(consultationRequests)
    .where(eq(consultationRequests.id, id))
    .limit(1);
  if (!row || row.status === "paid") return;
  if (!proofRequiredMethods.has(row.paymentMethod) || row.status !== "awaiting_verification") return;
  if (!row.paymentReference) redirect(`${await adminHref("consultations")}?error=reference`);
  const [proof] = await db.select({ id: paymentProofs.id }).from(paymentProofs).where(eq(paymentProofs.consultationId, id)).limit(1);
  if (!proof) redirect(`${await adminHref("consultations")}?error=proof`);
  await db.update(consultationRequests)
    .set({ status: "paid", verifiedAt: new Date() })
    .where(eq(consultationRequests.id, id));
  await audit(admin.id, "consultation.proof.accept", String(id), row.paymentReference);
  revalidatePath("/admin", "layout");
  redirect(`${await adminHref("consultations")}?verified=1`);
}
