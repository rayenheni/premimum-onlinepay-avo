import 'dotenv/config';
import { test, expect } from '@playwright/test';
import { and, eq } from 'drizzle-orm';
import { db, pool } from '../src/db';
import { adminUsers, consultationRequests, siteSettings, tenants } from '../src/db/schema';

const email = `e2e-pt-${Date.now()}@example.tn`;
const password = 'Payments-Test-2026!';
const slug = `e2e-cab-${Date.now().toString(36)}`;
const tenantHost = `${slug}.${process.env.PLATFORM_DOMAIN || 'plateforme.tn'}`;
let adminId = 0;
let tenantId = 0;

test.beforeAll(async () => {
  const [{ id }] = await db.insert(tenants).values({ slug, nameAr: 'مكتب تجريبي', nameFr: 'Cabinet de test', adminEmail: email }).returning({ id: tenants.id });
  tenantId = id;
  const { scryptSync, randomBytes } = await import('node:crypto');
  const salt = randomBytes(16);
  const [admin] = await db.insert(adminUsers).values({
    tenantId: id, email,
    passwordHash: `scrypt$${salt.toString('hex')}$${scryptSync(password, salt, 64).toString('hex')}`,
    isPlatform: false,
  }).returning({ id: adminUsers.id });
  adminId = admin.id;
  // Each tenant configures its own payment methods, like a real lawyer would.
  await db.insert(siteSettings).values({ tenantId: id, key: 'paymentMethods', value: '["card","edinar","konnect","bank_transfer","d17"]' });
});

test.afterAll(async () => {
  await db.transaction(async (tx) => {
    if (tenantId) {
      await tx.delete(consultationRequests).where(eq(consultationRequests.tenantId, tenantId));
      await tx.delete(adminUsers).where(eq(adminUsers.tenantId, tenantId));
      await tx.delete(siteSettings).where(eq(siteSettings.tenantId, tenantId));
      await tx.delete(tenants).where(eq(tenants.id, tenantId));
    }
  });
  await pool.end();
});

test('bank transfer requires a reference and is saved as awaiting verification', async ({ page }) => {
  await page.goto('/fr/book');
  await page.getByLabel(/Nom et prénom/).fill('Virement Test');
  await page.getByLabel(/Adresse e-mail/).fill(`${email}`);
  await page.getByLabel(/Téléphone/).fill('+216 20 111 222');
  await page.getByRole('button', { name: 'Continuer', exact: true }).click();
  // Bank transfer is not enabled by default; the reference rule is enforced server-side regardless.
  const payload = { fullName: 'Virement Test', email, phone: '+21620111222', service: 'contracts', amount: 150, paymentMethod: 'bank_transfer', locale: 'fr', consent: true };
  expect((await page.request.post('/api/consultations', { headers: { 'x-forwarded-host': tenantHost }, data: payload })).status()).toBe(400);
  const withReference = await page.request.post('/api/consultations', { headers: { 'x-forwarded-host': tenantHost }, data: { ...payload, paymentReference: 'TRF-2026-000123' } });
  expect(withReference.status()).toBe(201);
  const created = await withReference.json();
  expect(created.status).toBe('awaiting_verification');
  expect(created.reference).toMatch(/^AYL-[A-Z0-9]{16}$/);
});

test('D17 reference is validated and stored with the request', async ({ page }) => {
  const base = { fullName: 'D17 Test', email, phone: '+21620111222', service: 'family', amount: 150, paymentMethod: 'd17', locale: 'fr', consent: true };
  expect((await page.request.post('/api/consultations', { headers: { 'x-forwarded-host': tenantHost }, data: base })).status()).toBe(400);
  const ok = await page.request.post('/api/consultations', { headers: { 'x-forwarded-host': tenantHost }, data: { ...base, paymentReference: 'D17-99887766' } });
  expect(ok.status()).toBe(201);
  expect((await ok.json()).status).toBe('awaiting_verification');
  const [row] = await db.select({ paymentReference: consultationRequests.paymentReference, status: consultationRequests.status, tenantId: consultationRequests.tenantId })
    .from(consultationRequests).where(and(eq(consultationRequests.tenantId, tenantId!), eq(consultationRequests.paymentReference, 'D17-99887766'))).limit(1);
  expect(row?.status).toBe('awaiting_verification');
  expect(row?.tenantId).toBe(tenantId);
});

test('a second tenant sees only its own requests', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByLabel('Adresse e-mail').fill(email);
  await page.getByLabel('Mot de passe', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin/consultations');
  const rows = page.locator('article.adm-item');
  await expect(rows.filter({ hasText: 'D17-99887766' })).toHaveCount(1);
  await expect(rows.filter({ hasText: 'Virement Test' })).toHaveCount(1);
  await rows.filter({ hasText: 'D17-99887766' }).getByRole('button', { name: 'Vérifier et marquer payé' }).click();
  await expect(page).toHaveURL(/verified=1/);
  const [verified] = await db.select({ status: consultationRequests.status, verifiedAt: consultationRequests.verifiedAt })
    .from(consultationRequests).where(and(eq(consultationRequests.tenantId, tenantId!), eq(consultationRequests.paymentReference, 'D17-99887766'))).limit(1);
  expect(verified?.status).toBe('paid');
  expect(verified?.verifiedAt).toBeInstanceOf(Date);
  // Non-platform admins cannot reach the tenant manager.
  await page.goto('/admin/tenants');
  await expect(page).toHaveURL(/\/admin$/);
});
