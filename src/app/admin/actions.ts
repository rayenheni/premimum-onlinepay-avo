"use server";

import { count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  adminUsers, articles, cabinetInquiries, cmsPages, consultationRequests, contentRevisions,
  mediaAssets, siteSettings, tenants,
} from "@/db/schema";
import { getTenant } from "@/lib/tenant";
import { and } from "drizzle-orm";
import { adminHref, normalizeAdminSlug, reservedAdminSlugs } from "@/lib/admin-path";
import { manualStatuses } from "@/lib/admin-labels";
import { requireAdmin, createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { flattenEditableContent, getContentOverrides, getExtraOverrides, getValueAtPath, pageDefinitions } from "@/lib/cms";
import { siteContent, type Locale } from "@/lib/site-content";
import { extra } from "@/lib/site-content-extra";
import { classifyVideo, isSafeMediaUrl } from "@/lib/site-config";

export type AuthState = { error?: string; email?: string };
const attempts = new Map<string, { count: number; since: number }>();
const text = (formData: FormData, key: string, max = 4000) => String(formData.get(key) ?? "").trim().slice(0, max);
const idOf = (formData: FormData) => Number(formData.get("id"));
let dummyHash: string | null = null;

async function clientIp() {
  const h = await headers();
  return (h.get("x-real-ip") || h.get("x-forwarded-for") || "local").split(",")[0].trim();
}
async function tooManyAttempts() {
  const ip = await clientIp();
  const now = Date.now();
  const record = attempts.get(ip);
  if (record && now - record.since < 15 * 60 * 1000) {
    if (record.count >= 8) return true;
    record.count += 1;
  } else attempts.set(ip, { count: 1, since: now });
  return false;
}
async function upsertSetting(key: string, value: string, tenantId: number) {
  await db.insert(siteSettings).values({ key, value, tenantId }).onConflictDoUpdate({ target: [siteSettings.tenantId, siteSettings.key], set: { value } });
}
async function adminRedirect(path = "") {
  redirect(await adminHref(path));
}

export async function loginAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (await tooManyAttempts()) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  const email = text(formData, "email", 180).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  dummyHash ||= hashPassword("not-a-real-password");
  if (!admin || !verifyPassword(password, admin ? admin.passwordHash : dummyHash)) return { error: "Identifiants incorrects.", email };
  attempts.delete(await clientIp());
  await createSession(admin.id);
  await audit(admin.id, "login", email);
  redirect(await adminHref());
}

export async function setupAction(_previous: AuthState, formData: FormData): Promise<AuthState> {
  if (await tooManyAttempts()) return { error: "Trop de tentatives. Réessayez dans quelques minutes." };
  const [{ value }] = await db.select({ value: count() }).from(adminUsers);
  if (value > 0) return { error: "Un compte administrateur existe déjà." };
  const email = text(formData, "email", 180).toLowerCase();
  const requiredKey = process.env.ADMIN_SETUP_KEY;
  if (requiredKey && text(formData, "setupKey", 200) !== requiredKey) return { error: "Code d’installation invalide.", email };
  const password = String(formData.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Adresse e-mail invalide.", email };
  if (password.length < 10) return { error: "Le mot de passe doit contenir au moins 10 caractères.", email };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "Les mots de passe ne correspondent pas.", email };
  const passwordHash = hashPassword(password);
  const tenant = await getTenant();
  const created = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(724519)`);
    const [{ value: existing }] = await tx.select({ value: count() }).from(adminUsers);
    if (existing > 0) return null;
    const [row] = await tx.insert(adminUsers).values({ email, passwordHash, tenantId: tenant?.id ?? 1, isPlatform: true }).returning({ id: adminUsers.id });
    return row;
  });
  if (!created) return { error: "Un compte administrateur existe déjà.", email };
  await createSession(created.id);
  await audit(created.id, "admin.setup", email);
  redirect(await adminHref());
}

export async function logoutAction() {
  const admin = await requireAdmin();
  await audit(admin.id, "logout", admin.email);
  await destroySession();
  redirect(await adminHref("login"));
}

export async function updateConsultationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  const status = text(formData, "status", 30);
  if (!Number.isInteger(id) || !manualStatuses.includes(status)) return;
  await db.update(consultationRequests).set({ status }).where(and(eq(consultationRequests.tenantId, admin.tenantId), eq(consultationRequests.id, id)));
  await audit(admin.id, "consultation.status", String(id), status);
  revalidatePath("/admin", "layout");
}
export async function deleteConsultation(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  if (!Number.isInteger(id)) return;
  await db.delete(consultationRequests).where(and(eq(consultationRequests.tenantId, admin.tenantId), eq(consultationRequests.id, id)));
  await audit(admin.id, "consultation.delete", String(id));
  revalidatePath("/admin", "layout");
}
export async function updateInquiryStatus(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  const status = text(formData, "status", 20) === "handled" ? "handled" : "new";
  if (!Number.isInteger(id)) return;
  await db.update(cabinetInquiries).set({ status }).where(and(eq(cabinetInquiries.tenantId, admin.tenantId), eq(cabinetInquiries.id, id)));
  await audit(admin.id, "inquiry.status", String(id), status);
  revalidatePath("/admin", "layout");
}
export async function deleteInquiry(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  if (!Number.isInteger(id)) return;
  await db.delete(cabinetInquiries).where(and(eq(cabinetInquiries.tenantId, admin.tenantId), eq(cabinetInquiries.id, id)));
  await audit(admin.id, "inquiry.delete", String(id));
  revalidatePath("/admin", "layout");
}

function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
export async function saveArticle(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  const titleAr = text(formData, "titleAr", 220);
  const titleFr = text(formData, "titleFr", 220);
  const bodyAr = text(formData, "bodyAr", 20000);
  const bodyFr = text(formData, "bodyFr", 20000);
  const back = Number.isInteger(id) && id > 0 ? `articles/${id}` : "articles/new";
  if (!titleAr && !titleFr) redirect(`${await adminHref(back)}?error=title`);
  if (!bodyAr && !bodyFr) redirect(`${await adminHref(back)}?error=body`);
  let image = text(formData, "image", 300) || "/images/article-family.jpg";
  if (!isSafeMediaUrl(image)) image = "/images/article-family.jpg";
  const slug = slugify(text(formData, "slug", 120)) || slugify(titleFr) || `article-${Date.now().toString(36)}`;
  const values = {
    slug, image, titleAr: titleAr || null, titleFr: titleFr || null,
    categoryAr: text(formData, "categoryAr", 120) || null, categoryFr: text(formData, "categoryFr", 120) || null,
    excerptAr: text(formData, "excerptAr", 600) || null, excerptFr: text(formData, "excerptFr", 600) || null,
    bodyAr: bodyAr || null, bodyFr: bodyFr || null, published: formData.get("published") === "on", updatedAt: new Date(),
  };
  try {
    if (Number.isInteger(id) && id > 0) await db.update(articles).set(values).where(and(eq(articles.tenantId, admin.tenantId), eq(articles.id, id)));
    else await db.insert(articles).values({ ...values, tenantId: admin.tenantId });
  } catch {
    redirect(`${await adminHref(back)}?error=slug`);
  }
  await audit(admin.id, Number.isInteger(id) && id > 0 ? "article.update" : "article.create", slug);
  revalidatePath("/", "layout");
  redirect(`${await adminHref("articles")}?saved=1`);
}
export async function deleteArticle(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  if (!Number.isInteger(id)) return;
  await db.delete(articles).where(and(eq(articles.tenantId, admin.tenantId), eq(articles.id, id)));
  await audit(admin.id, "article.delete", String(id));
  revalidatePath("/", "layout");
}

export async function saveContent(formData: FormData) {
  const admin = await requireAdmin();
  const mainPaths = flattenEditableContent(siteContent.ar).map((item) => item.path);
  const extraPaths = flattenEditableContent(extra.ar).map((item) => item.path);
  for (const locale of ["ar", "fr"] as Locale[]) {
    const [currentContent, currentExtra] = await Promise.all([getContentOverrides(locale), getExtraOverrides(locale)]);
    await db.insert(contentRevisions).values({ tenantId: admin.tenantId, locale, data: JSON.stringify({ content: currentContent, extra: currentExtra }), adminId: admin.id });
    const buildOverrides = (defaults: unknown, paths: string[], namespace: string) => {
      const overrides: Record<string, string | number> = {};
      for (const path of paths) {
        const baseline = getValueAtPath(defaults, path);
        if (baseline === undefined) continue;
        const raw = text(formData, `${locale}:${namespace}:${path}`, typeof baseline === "string" ? 12000 : 100);
        const value = typeof baseline === "number" ? Number(raw) : raw;
        if ((typeof baseline === "number" && Number.isFinite(value) && value !== baseline) || (typeof baseline === "string" && value !== baseline)) overrides[path] = value;
      }
      return overrides;
    };
    await upsertSetting(`contentOverrides:${locale}`, JSON.stringify(buildOverrides(siteContent[locale], mainPaths, "content")), admin.tenantId);
    await upsertSetting(`extraOverrides:${locale}`, JSON.stringify(buildOverrides(extra[locale], extraPaths, "extra")), admin.tenantId);
  }
  await audit(admin.id, "content.update", "ar+fr", `${mainPaths.length + extraPaths.length} fields`);
  revalidatePath("/", "layout");
  redirect(`${await adminHref("content")}?saved=1`);
}
export async function restoreContentRevision(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  const [revision] = await db.select().from(contentRevisions).where(and(eq(contentRevisions.tenantId, admin.tenantId), eq(contentRevisions.id, id))).limit(1);
  if (!revision || !["ar", "fr"].includes(revision.locale)) return;
  const locale = revision.locale as Locale;
  const [currentContent, currentExtra] = await Promise.all([getContentOverrides(locale), getExtraOverrides(locale)]);
  await db.insert(contentRevisions).values({ tenantId: admin.tenantId, locale, data: JSON.stringify({ content: currentContent, extra: currentExtra }), adminId: admin.id });
  let saved: { content?: Record<string, unknown>; extra?: Record<string, unknown> } = {};
  try {
    const parsed = JSON.parse(revision.data) as Record<string, unknown>;
    saved = ("content" in parsed || "extra" in parsed) ? parsed : { content: parsed };
  } catch { /* invalid revisions are restored as defaults */ }
  await upsertSetting(`contentOverrides:${locale}`, JSON.stringify(saved.content || {}), admin.tenantId);
  await upsertSetting(`extraOverrides:${locale}`, JSON.stringify(saved.extra || {}), admin.tenantId);
  await audit(admin.id, "content.restore", String(id), locale);
  revalidatePath("/", "layout");
  redirect(`${await adminHref("content")}?restored=1`);
}
export async function resetContent(formData: FormData) {
  const admin = await requireAdmin();
  const locale = text(formData, "locale", 5) === "fr" ? "fr" : "ar";
  const [currentContent, currentExtra] = await Promise.all([getContentOverrides(locale), getExtraOverrides(locale)]);
  await db.insert(contentRevisions).values({ tenantId: admin.tenantId, locale, data: JSON.stringify({ content: currentContent, extra: currentExtra }), adminId: admin.id });
  await upsertSetting(`contentOverrides:${locale}`, "{}", admin.tenantId);
  await upsertSetting(`extraOverrides:${locale}`, "{}", admin.tenantId);
  await audit(admin.id, "content.reset", locale);
  revalidatePath("/", "layout");
  redirect(`${await adminHref("content")}?reset=1`);
}

export async function savePages(formData: FormData) {
  const admin = await requireAdmin();
  for (const definition of pageDefinitions) {
    const key = definition.key;
    const values = {
      key,
      enabled: key === "home" ? true : formData.get(`enabled:${key}`) === "on",
      showInNav: formData.get(`nav:${key}`) === "on",
      metaTitleAr: text(formData, `metaTitleAr:${key}`, 220) || null,
      metaTitleFr: text(formData, `metaTitleFr:${key}`, 220) || null,
      metaDescriptionAr: text(formData, `metaDescriptionAr:${key}`, 600) || null,
      metaDescriptionFr: text(formData, `metaDescriptionFr:${key}`, 600) || null,
      updatedAt: new Date(),
    };
    await db.insert(cmsPages).values({ ...values, tenantId: admin.tenantId }).onConflictDoUpdate({ target: [cmsPages.tenantId, cmsPages.key], set: values });
  }
  await audit(admin.id, "pages.update", "all");
  revalidatePath("/", "layout");
  redirect(`${await adminHref("pages")}?saved=1`);
}

export async function uploadMedia(formData: FormData) {
  const admin = await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    redirect(`${await adminHref("media")}?error=file`);
  }
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 180) || "image";
  const [asset] = await db.insert(mediaAssets).values({
    tenantId: admin.tenantId,
    filename,
    mimeType: file.type,
    size: file.size,
    data: Buffer.from(await file.arrayBuffer()),
    altAr: text(formData, "altAr", 240) || null,
    altFr: text(formData, "altFr", 240) || null,
    captionAr: text(formData, "captionAr", 300) || null,
    captionFr: text(formData, "captionFr", 300) || null,
    showInGallery: formData.get("showInGallery") === "on",
  }).returning({ id: mediaAssets.id });
  await audit(admin.id, "media.upload", String(asset.id), filename);
  revalidatePath("/", "layout");
  redirect(`${await adminHref("media")}?uploaded=1`);
}
export async function updateMedia(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  if (!Number.isInteger(id)) return;
  await db.update(mediaAssets).set({
    altAr: text(formData, "altAr", 240) || null,
    altFr: text(formData, "altFr", 240) || null,
    captionAr: text(formData, "captionAr", 300) || null,
    captionFr: text(formData, "captionFr", 300) || null,
    showInGallery: formData.get("showInGallery") === "on",
  }).where(and(eq(mediaAssets.tenantId, admin.tenantId), eq(mediaAssets.id, id)));
  await audit(admin.id, "media.update", String(id));
  revalidatePath("/", "layout");
}
export async function deleteMedia(formData: FormData) {
  const admin = await requireAdmin();
  const id = idOf(formData);
  if (!Number.isInteger(id)) return;
  const url = `/media/${id}`;
  const [usedByArticle] = await db.select({ id: articles.id }).from(articles).where(and(eq(articles.tenantId, admin.tenantId), eq(articles.image, url))).limit(1);
  if (usedByArticle) redirect(`${await adminHref("media")}?error=used`);
  await db.update(siteSettings).set({ value: "" }).where(eq(siteSettings.value, url));
  await db.delete(mediaAssets).where(and(eq(mediaAssets.tenantId, admin.tenantId), eq(mediaAssets.id, id)));
  await audit(admin.id, "media.delete", String(id));
  revalidatePath("/", "layout");
}

export async function saveAppearance(formData: FormData) {
  const admin = await requireAdmin();
  const keys = ["logoUrl", "heroImage", "aboutImage", "pageHeroImage", "bannerImage", "journeyImage"];
  for (const key of keys) {
    const value = text(formData, key, 400);
    if (!isSafeMediaUrl(value)) redirect(`${await adminHref("appearance")}?error=media`);
    await upsertSetting(key, value, admin.tenantId);
  }
  const video = text(formData, "introVideoUrl", 400);
  if (video && classifyVideo(video) === "none") redirect(`${await adminHref("appearance")}?error=video`);
  await upsertSetting("introVideoUrl", video, admin.tenantId);
  await audit(admin.id, "appearance.update", "branding");
  revalidatePath("/", "layout");
  redirect(`${await adminHref("appearance")}?saved=1`);
}

export async function saveSettings(formData: FormData) {
  const admin = await requireAdmin();
  const email = text(formData, "contactEmail", 180);
  const notificationEmail = text(formData, "notificationEmail", 180);
  const phone = text(formData, "contactPhone", 40);
  if ((email && !/^\S+@\S+\.\S+$/.test(email)) || (notificationEmail && !/^\S+@\S+\.\S+$/.test(notificationEmail))) redirect(`${await adminHref("settings")}?error=email`);
  if (phone && !/^[+0-9 ().-]{6,40}$/.test(phone)) redirect(`${await adminHref("settings")}?error=phone`);
  const urlFields = ["facebookUrl", "linkedinUrl"];
  for (const key of urlFields) {
    const value = text(formData, key, 300);
    if (value && !/^https:\/\//.test(value)) redirect(`${await adminHref("settings")}?error=url`);
  }
  const start = text(formData, "officeStart", 5);
  const end = text(formData, "officeEnd", 5);
  const slots = Number(text(formData, "slotMinutes", 2));
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || start >= end || ![15, 30, 45, 60].includes(slots)) redirect(`${await adminHref("settings")}?error=hours`);
  const entries: [string, string][] = [
    ["contactEmail", email], ["notificationEmail", notificationEmail], ["contactPhone", phone],
    ["whatsapp", text(formData, "whatsapp", 40).replace(/[^0-9]/g, "")], ["address", text(formData, "address", 200)],
    ["facebookUrl", text(formData, "facebookUrl", 300)], ["linkedinUrl", text(formData, "linkedinUrl", 300)],
    ["seoIndexing", formData.get("seoIndexing") === "on" ? "true" : "false"], ["officeStart", start], ["officeEnd", end], ["slotMinutes", String(slots)],
  ];
  for (const [key, value] of entries) await upsertSetting(key, value, admin.tenantId);
  await audit(admin.id, "settings.update", "general");
  revalidatePath("/", "layout");
  redirect(`${await adminHref("settings")}?saved=1`);
}

export async function changeAdminPath(formData: FormData) {
  const admin = await requireAdmin();
  const slug = normalizeAdminSlug(text(formData, "adminPath", 60));
  if (slug.length < 8 || (reservedAdminSlugs.has(slug) && slug !== "admin")) redirect(`${await adminHref("settings")}?error=adminpath`);
  await upsertSetting("adminPath", slug, admin.tenantId);
  await audit(admin.id, "admin.path", slug);
  redirect(`/${slug}/settings?changed=path`);
}

export async function changePassword(formData: FormData) {
  const admin = await requireAdmin();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const [row] = await db.select().from(adminUsers).where(eq(adminUsers.id, admin.id)).limit(1);
  if (!row || !verifyPassword(current, row.passwordHash)) redirect(`${await adminHref("settings")}?error=current`);
  if (next.length < 10 || next !== String(formData.get("confirm") ?? "")) redirect(`${await adminHref("settings")}?error=newpassword`);
  await db.update(adminUsers).set({ passwordHash: hashPassword(next) }).where(eq(adminUsers.id, admin.id));
  await audit(admin.id, "admin.password", admin.email);
  redirect(`${await adminHref("settings")}?saved=password`);
}
