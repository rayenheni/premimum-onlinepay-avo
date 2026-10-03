import type { Locale } from "@/lib/site-content";

export const locales: Locale[] = ["ar", "fr"];

export function asLocale(value: string): Locale {
  return value === "fr" ? "fr" : "ar";
}

export function titleFor(locale: Locale, label: string) {
  return `${label} — ${locale === "ar" ? "أبو يحيى اللباوي" : "Cabinet Labbaoui"}`;
}

export function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .toLowerCase().replace(/\s+/g, " ").trim();
}

export const serviceIds = ["corporate", "individual", "commercial", "family", "property", "employment", "criminal", "contracts"];
