import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { adminSessions, adminUsers } from "@/db/schema";
import { getTenant } from "@/lib/tenant";
import { adminHref } from "@/lib/admin-path";

const COOKIE = "cabinet_admin";
const sha = (value: string) => createHash("sha256").update(value).digest("hex");

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [algorithm, saltHex, keyHex] = stored.split("$");
  if (algorithm !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const key = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export async function createSession(adminId: number) {
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(adminSessions).values({ tokenHash: sha(token), adminId, expiresAt });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt,
  });
}

export async function getAdmin() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, tenantId: adminUsers.tenantId, isPlatform: adminUsers.isPlatform, expiresAt: adminSessions.expiresAt })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminUsers.id, adminSessions.adminId))
    .where(eq(adminSessions.tokenHash, sha(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date()) return null;
  return { id: row.id, email: row.email, tenantId: row.tenantId, isPlatform: row.isPlatform };
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) redirect(await adminHref("login"));
  return admin;
}

/** Platform owner: can provision new lawyer tenants. Never granted by tenant admins. */
export async function requirePlatformAdmin() {
  const admin = await requireAdmin();
  if (!admin.isPlatform) redirect(await adminHref());
  return admin;
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, sha(token)));
  store.delete(COOKIE);
}
