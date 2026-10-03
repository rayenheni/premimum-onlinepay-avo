import "dotenv/config";
import { test, expect } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { consultationRequests, paymentProofs, siteSettings } from "../src/db/schema";

const email = `e2e-payment-${Date.now()}@example.tn`;
const pngReceipt = { name: "receipt.png", mimeType: "image/png", buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) };

async function setting(key: string, value: string) {
  await db.insert(siteSettings).values({ key, value }).onConflictDoUpdate({ target: siteSettings.key, set: { value } });
}

test.beforeAll(async () => {
  await Promise.all([
    setting("paymentMethods", '["bank_transfer","d17"]'),
    setting("bank.rib", "00 000 0000000000000 00"),
    setting("d17.phone", "+216 20 111 222"),
  ]);
});

test.afterAll(async () => {
  await db.delete(consultationRequests).where(eq(consultationRequests.email, email));
  await pool.end();
});

test("bank transfer requires a transaction reference and awaits manual verification", async ({ request }) => {
  const payload = {
    fullName: "Virement Test",
    email,
    phone: "+21620111222",
    service: "contracts",
    amount: 150,
    paymentMethod: "bank_transfer",
    locale: "fr",
    consent: true,
  };
  expect((await request.post("/api/consultations", { data: { ...payload, paymentReference: "TRF-2026-000123" } })).status()).toBe(400);
  const response = await request.post("/api/consultations", { multipart: { ...payload, paymentReference: "TRF-2026-000123", paymentProof: pngReceipt } });
  expect(response.status()).toBe(201);
  const created = await response.json();
  expect(created.status).toBe("awaiting_verification");
  expect(created.reference).toMatch(/^LAW-[A-Z0-9]{16}$/);
  const [proof] = await db.select({ filename: paymentProofs.filename, mimeType: paymentProofs.mimeType, size: paymentProofs.size })
    .from(paymentProofs)
    .innerJoin(consultationRequests, eq(paymentProofs.consultationId, consultationRequests.id))
    .where(eq(consultationRequests.reference, created.reference));
  expect(proof).toMatchObject({ filename: "receipt.png", mimeType: "image/png", size: 8 });
});

test("D17 references are validated and stored", async ({ request }) => {
  const payload = {
    fullName: "D17 Test",
    email,
    phone: "+21620111222",
    service: "family",
    amount: 150,
    paymentMethod: "d17",
    locale: "fr",
    consent: true,
  };
  expect((await request.post("/api/consultations", { data: payload })).status()).toBe(400);
  const response = await request.post("/api/consultations", { multipart: { ...payload, paymentReference: "D17-99887766", paymentProof: pngReceipt } });
  expect(response.status()).toBe(201);
  expect((await response.json()).status).toBe("awaiting_verification");
  const [row] = await db.select({ paymentReference: consultationRequests.paymentReference, status: consultationRequests.status })
    .from(consultationRequests)
    .where(eq(consultationRequests.paymentReference, "D17-99887766"))
    .limit(1);
  expect(row?.status).toBe("awaiting_verification");
  expect(row?.paymentReference).toBe("D17-99887766");
});
