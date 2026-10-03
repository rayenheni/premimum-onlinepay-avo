import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { normalizeAdminSlug, reservedAdminSlugs } from "@/lib/admin-path";

async function configuredAdminSlug() {
  try {
    const [row] = await db.select().from(siteSettings).where(eq(siteSettings.key, "adminPath")).limit(1);
    const fromDb = row ? normalizeAdminSlug(row.value) : "";
    const fromEnv = normalizeAdminSlug(process.env.ADMIN_PATH || "");
    const candidate = fromDb || fromEnv || "admin";
    return reservedAdminSlugs.has(candidate) && candidate !== "admin" ? "admin" : candidate;
  } catch {
    return normalizeAdminSlug(process.env.ADMIN_PATH || "") || "admin";
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const first = pathname.split("/").filter(Boolean)[0] || "";
  const knownPublic = new Set(["", "ar", "fr", "api", "media", "_next", "images", "videos", "fonts", "favicon.ico", "robots.txt", "sitemap.xml"]);
  if (knownPublic.has(first)) return NextResponse.next();

  const adminSlug = await configuredAdminSlug();
  if (first === adminSlug) {
    if (adminSlug === "admin") return NextResponse.next();
    const suffix = pathname.slice(adminSlug.length + 1);
    const target = request.nextUrl.clone();
    target.pathname = `/admin${suffix}`;
    const headers = new Headers(request.headers);
    headers.set("x-admin-public-path", `/${adminSlug}`);
    return NextResponse.rewrite(target, { request: { headers } });
  }

  if (first === "admin" && adminSlug !== "admin") {
    return NextResponse.redirect(new URL("/ar", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
