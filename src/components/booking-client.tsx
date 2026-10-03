"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";
import { ConsultationForm } from "@/components/consultation-form";
import { Pill } from "@/components/ui";
import { type Locale } from "@/lib/site-content";
import type { SiteContent } from "@/lib/cms";
import type { PublicSiteConfig } from "@/lib/site-config";

export function BookingClient({ locale, config, content, initialService, reference }: { locale: Locale; config: PublicSiteConfig; content: SiteContent; initialService: string; reference?: string }) {
  const t = content;
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!reference) return;
    const controller = new AbortController();
    fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { ok?: boolean; status?: string }) => { if (data.ok && data.status) setStatus(data.status); else setFailed(true); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [reference]);

  if (reference) {
    const paid = status === "paid";
    return <div className="success-screen" role="status">
      <span className="success-seal">{paid ? <CheckCircle2 size={36} /> : <Clock3 size={36} />}</span>
      <h3>{status === null && !failed ? "…" : paid ? t.booking.paid : t.booking.pending}</h3>
      <p>{paid ? t.booking.paidText : t.booking.pendingText}</p>
      <div className="request-reference"><span>{t.booking.reference}</span><strong dir="ltr">{reference}</strong></div>
      <Pill href={`/${locale}`}>{t.booking.finish}</Pill>
    </div>;
  }
  return <ConsultationForm locale={locale} config={config} content={content} initialService={initialService} onClose={() => router.push(`/${locale}`)} />;
}
