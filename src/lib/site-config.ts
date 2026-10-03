import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { getCmsPages, type CmsPageState, type PageKey } from "@/lib/cms";
import { getTenant } from "@/lib/tenant";
import { and, eq } from "drizzle-orm";
import { emailIsConfigured } from "@/lib/notifications";

export type VideoKind = "file" | "embed" | "none";

export type PublicSiteConfig = {
  paymentEnabled: boolean;
  emailEnabled: boolean;
  contactEmail: string;
  notificationEmail: string;
  contactPhone: string;
  whatsapp: string;
  address: string;
  facebookUrl: string;
  linkedinUrl: string;
  logoUrl: string;
  heroImage: string;
  aboutImage: string;
  pageHeroImage: string;
  bannerImage: string;
  journeyImage: string;
  introVideoUrl: string;
  introVideoKind: VideoKind;
  seoIndexing: boolean;
  officeStart: string;
  officeEnd: string;
  slotMinutes: number;
  pages: Record<PageKey, CmsPageState>;
  payments: PaymentSettings;
};

export type PaymentMethod = "card" | "edinar" | "konnect" | "bank_transfer" | "d17";
export const allPaymentMethods: PaymentMethod[] = ["card", "edinar", "konnect", "bank_transfer", "d17"];
export type PaymentSettings = {
  methods: PaymentMethod[];
  bank: { name: string; rib: string; beneficiary: string; instructionsAr: string; instructionsFr: string };
  d17: { phone: string; merchantCode: string; instructionsAr: string; instructionsFr: string };
};
const emptyPayments = (): PaymentSettings => ({
  methods: ["card", "edinar", "konnect"],
  bank: { name: "", rib: "", beneficiary: "", instructionsAr: "", instructionsFr: "" },
  d17: { phone: "", merchantCode: "", instructionsAr: "", instructionsFr: "" },
});
/** Only whitelisted payment methods are ever accepted, whatever the stored value says. */
export function parsePayments(settings: Record<string, string>): PaymentSettings {
  const result = emptyPayments();
  try {
    const stored = JSON.parse(settings.paymentMethods || "[]");
    if (Array.isArray(stored)) result.methods = allPaymentMethods.filter((method) => stored.includes(method));
  } catch { /* keep defaults */ }
  for (const field of ["name", "rib", "beneficiary", "instructionsAr", "instructionsFr"] as const) {
    const value = (settings[`bank.${field}`] || "").trim();
    if (field === "rib") result.bank.rib = /^[0-9 ]{10,40}$/.test(value) ? value : "";
    else result.bank[field] = value.slice(0, 600);
  }
  for (const field of ["phone", "merchantCode", "instructionsAr", "instructionsFr"] as const) {
    const value = (settings[`d17.${field}`] || "").trim();
    if (field === "phone") result.d17.phone = /^\+?[0-9 ]{8,20}$/.test(value) ? value : "";
    else result.d17[field] = value.slice(0, 600);
  }
  return result;
}

export const DEFAULT_VIDEO = "/videos/intro.mp4";
export const defaultImages = {
  heroImage: "/images/office-tunisia.jpg",
  aboutImage: "/images/office-tunisia.jpg",
  pageHeroImage: "/images/office-tunisia.jpg",
  bannerImage: "/images/office-tunisia.jpg",
  journeyImage: "/images/justice.png",
};

export function classifyVideo(url: string): VideoKind {
  if (url.startsWith("/videos/") && /\.(mp4|webm)$/i.test(url)) return "file";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "none";
    if (/\.(mp4|webm)$/i.test(parsed.pathname)) return "file";
    if (["www.youtube-nocookie.com", "www.youtube.com", "player.vimeo.com"].includes(parsed.hostname)) return "embed";
  } catch {
    // Invalid values are treated as no video.
  }
  return "none";
}

export function isSafeMediaUrl(value: string) {
  if (!value) return true;
  if (/^\/(images|media)\/[\w./-]+$/.test(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function getSettingsMap(): Promise<Record<string, string>> {
  try {
    const tenant = await getTenant();
    const rows = await db.select().from(siteSettings).where(eq(siteSettings.tenantId, tenant?.id ?? 1));
    return Object.fromEntries(rows.map((row) => [row.key, row.value]));
  } catch {
    return {};
  }
}

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const [settings, pages] = await Promise.all([getSettingsMap(), getCmsPages()]);
  const video = settings.introVideoUrl === undefined ? DEFAULT_VIDEO : settings.introVideoUrl;
  const slotMinutes = Number(settings.slotMinutes);
  return {
    paymentEnabled: Boolean(process.env.KONNECT_API_KEY && process.env.KONNECT_WALLET_ID),
    emailEnabled: emailIsConfigured(),
    contactEmail: settings.contactEmail || process.env.CABINET_EMAIL || "",
    notificationEmail: settings.notificationEmail || process.env.ADMIN_NOTIFICATION_EMAIL || settings.contactEmail || process.env.CABINET_EMAIL || "",
    contactPhone: settings.contactPhone || process.env.CABINET_PHONE || "",
    whatsapp: (settings.whatsapp || process.env.CABINET_WHATSAPP || "").replace(/[^0-9]/g, ""),
    address: settings.address || "",
    facebookUrl: /^https:\/\//.test(settings.facebookUrl || "") ? settings.facebookUrl : "",
    linkedinUrl: /^https:\/\//.test(settings.linkedinUrl || "") ? settings.linkedinUrl : "",
    logoUrl: isSafeMediaUrl(settings.logoUrl || "") ? settings.logoUrl || "" : "",
    heroImage: isSafeMediaUrl(settings.heroImage || "") ? settings.heroImage || defaultImages.heroImage : defaultImages.heroImage,
    aboutImage: isSafeMediaUrl(settings.aboutImage || "") ? settings.aboutImage || defaultImages.aboutImage : defaultImages.aboutImage,
    pageHeroImage: isSafeMediaUrl(settings.pageHeroImage || "") ? settings.pageHeroImage || defaultImages.pageHeroImage : defaultImages.pageHeroImage,
    bannerImage: isSafeMediaUrl(settings.bannerImage || "") ? settings.bannerImage || defaultImages.bannerImage : defaultImages.bannerImage,
    journeyImage: isSafeMediaUrl(settings.journeyImage || "") ? settings.journeyImage || defaultImages.journeyImage : defaultImages.journeyImage,
    introVideoUrl: video,
    introVideoKind: video ? classifyVideo(video) : "none",
    seoIndexing: settings.seoIndexing === "true",
    officeStart: /^\d{2}:\d{2}$/.test(settings.officeStart || "") ? settings.officeStart : "09:00",
    officeEnd: /^\d{2}:\d{2}$/.test(settings.officeEnd || "") ? settings.officeEnd : "17:00",
    slotMinutes: [15, 30, 45, 60].includes(slotMinutes) ? slotMinutes : 30,
    pages,
    payments: parsePayments(settings),
  };
}
