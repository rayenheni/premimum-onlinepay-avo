"use server";

import { randomBytes, scryptSync } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, tenants } from "@/db/schema";
import { adminHref } from "@/lib/admin-path";
import { requirePlatformAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";

const text = (formData: FormData, key: string, max: number) => String(formData.get(key) ?? "").trim().slice(0, max);

/** Creates a new lawyer website (tenant) with its own administrator account. */
export async function createTenant(formData: FormData) {
  const platform = await requirePlatformAdmin();
  const nameAr = text(formData, "nameAr", 200);
  const nameFr = text(formData, "nameFr", 200);
  const email = text(formData, "email", 180).toLowerCase();
  const domain = text(formData, "domain", 190).toLowerCase();
  const slug = text(formData, "slug", 60).toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
  if (nameAr.length < 2 || nameFr.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !/^[a-z][a-z0-9-]{2,59}$/.test(slug)) {
    redirect(`${await adminHref("tenants")}?error=invalid`);
  }
  if (domain && !/^[a-z0-9][a-z0-9.-]{1,60}\.[a-z]{2,}$/.test(domain)) redirect(`${await adminHref("tenants")}?error=domain`);

  const [emailTaken] = await db.select({ id: adminUsers.id }).from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  if (emailTaken) redirect(`${await adminHref("tenants")}?error=email`);

  // One-time password is shown once to the platform owner, never stored in plain text.
  const temporaryPassword = randomBytes(9).toString("base64url");
  const salt = randomBytes(16);
  const passwordHash = `scrypt$${salt.toString("hex")}$${scryptSync(temporaryPassword, salt, 64).toString("hex")}`;

  const tenant = await db.transaction(async (tx) => {
    const [created] = await tx.insert(tenants).values({ slug, nameAr, nameFr, domain: domain || null, adminEmail: email }).returning({ id: tenants.id });
    await tx.insert(adminUsers).values({ tenantId: created.id, email, passwordHash, isPlatform: false });
    return created;
  });
  await audit(platform.id, "tenant.create", slug, email);
  revalidatePath("/admin", "layout");
  redirect(`${await adminHref("tenants")}?created=${tenant.id}&password=${encodeURIComponent(temporaryPassword)}`);
}

export async function setTenantStatus(formData: FormData) {
  const platform = await requirePlatformAdmin();
  const id = Number(formData.get("id"));
  const status = text(formData, "status", 20) === "suspended" ? "suspended" : "active";
  if (!Number.isInteger(id)) return;
  await db.update(tenants).set({ status }).where(eq(tenants.id, id));
  await audit(platform.id, "tenant.status", String(id), status);
  revalidatePath("/admin", "layout");
  redirect(await adminHref("tenants"));
}
