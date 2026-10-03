import type { Metadata } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const metadata: Metadata = { title: "Administration — Votre Cabinet", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <html lang="fr" dir="ltr"><body className="adm-body">{children}</body></html>;
}
