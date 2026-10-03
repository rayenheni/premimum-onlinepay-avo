"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, LoaderCircle, LockKeyhole, Send } from "lucide-react";
import { type Locale } from "@/lib/site-content";
import type { SiteContent } from "@/lib/cms";

export function InquiryForm({ locale, content, kind = "contact" }: { locale: Locale; content: SiteContent; kind?: "contact" | "career" }) {
  const t = content;
  const career = kind === "career";
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", subject: "", message: "", website: "" });
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/inquiries", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, kind, locale, consent }),
      });
      const result = await response.json() as { ok: boolean; reference?: string; message?: string };
      if (!response.ok || !result.ok || !result.reference) throw new Error(result.message || t.booking.error);
      setReference(result.reference);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t.booking.error);
    } finally { setLoading(false); }
  }

  async function copyReference() {
    try { await navigator.clipboard.writeText(reference); setCopied(true); } catch { setCopied(false); }
  }

  if (reference) return <div className="success-screen" role="status">
    <span className="success-seal"><CheckCircle2 size={36} /></span>
    <h3>{t.contactForm.success}</h3><p>{t.contactForm.successText}</p>
    <div className="request-reference"><span>{t.booking.reference}</span><strong dir="ltr">{reference}</strong><button type="button" className="icon-button" onClick={copyReference} aria-label={copied ? t.booking.copied : t.booking.copy}>{copied ? <Check size={18} /> : <Copy size={18} />}</button></div>
    <button className="pill pill-brown" type="button" onClick={() => { setReference(""); setCopied(false); setForm({ fullName: "", email: "", phone: "", subject: "", message: "", website: "" }); setConsent(false); }}>{t.contactForm.newMessage}<span className="pill-arrow"><Arrow size={16} /></span></button>
  </div>;

  return <form className="cabinet-form" onSubmit={submit}>
    <p className="form-introduction">{career ? t.contactForm.careerDescription : t.contactForm.description}</p>
    <div className="form-grid">
      <label><span>{t.booking.name} <i>*</i></span><input required minLength={2} maxLength={140} autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder={t.booking.namePlaceholder} /></label>
      <label><span>{t.booking.email} <i>*</i></span><input required type="email" maxLength={180} dir="ltr" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="vous@exemple.tn" /></label>
      <label><span>{t.booking.phone} <small>({t.contactForm.optional})</small></span><input type="tel" maxLength={40} dir="ltr" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder={t.booking.phonePlaceholder} /></label>
      <label><span>{career ? t.contactForm.careerSubject : t.contactForm.subject}</span><input maxLength={160} value={form.subject} onChange={(event) => update("subject", event.target.value)} placeholder={career ? t.contactForm.careerPlaceholder : t.contactForm.subjectPlaceholder} /></label>
      <label className="field-wide"><span>{t.contactForm.message} <i>*</i></span><textarea required minLength={5} maxLength={4000} rows={5} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder={career ? t.contactForm.careerMessage : t.booking.messagePlaceholder} /></label>
      <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
    </div>
    <label className="consent-line"><input required type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.booking.consent}</span></label>
    <details className="privacy-details"><summary>{t.booking.privacy}</summary><p>{t.privacy.paragraphs[0]}</p></details>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="pill pill-brown form-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Send size={17} />}{loading ? t.booking.sending : career ? t.contactForm.careerSubmit : t.contactForm.submit}</button>
    <p className="form-security"><LockKeyhole size={14} />{t.about.values[1]} · {t.about.values[3]}</p>
  </form>;
}
