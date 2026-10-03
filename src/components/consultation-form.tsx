"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Banknote, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, CreditCard, Info, Landmark, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Smartphone, Wallet } from "lucide-react";
import { type Locale } from "@/lib/site-content";
import type { SiteContent } from "@/lib/cms";
import type { PublicSiteConfig } from "@/lib/site-config";

export function ConsultationForm({ locale, config, content, initialService = "general", onClose }: { locale: Locale; config: PublicSiteConfig; content: SiteContent; initialService?: string; onClose: () => void }) {
  const t = content;
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(Number(t.booking.formats[0]?.value) || 90);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [today, setToday] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", service: initialService, preferredDate: "", preferredTime: "", message: "", website: "" });
  const [paymentReference, setPaymentReference] = useState("");
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const bank = config.payments.bank;
  const d17 = config.payments.d17;
  const needsProof = paymentMethod === "bank_transfer" || paymentMethod === "d17";
  const paymentOptions = [
    ...(config.payments.methods.includes("card") ? [{ id: "card", label: t.booking.card, note: t.booking.cardNote, Icon: CreditCard }] : []),
    ...(config.payments.methods.includes("edinar") ? [{ id: "edinar", label: t.booking.edinar, note: t.booking.edinarNote, Icon: Mail }] : []),
    ...(config.payments.methods.includes("konnect") ? [{ id: "konnect", label: t.booking.wallet, note: t.booking.walletNote, Icon: Wallet }] : []),
    ...(config.payments.methods.includes("bank_transfer") ? [{ id: "bank_transfer", label: t.booking.bankTransfer, note: t.booking.bankTransferNote, Icon: Landmark }] : []),
    ...(config.payments.methods.includes("d17") ? [{ id: "d17", label: t.booking.d17, note: t.booking.d17Note, Icon: Smartphone }] : []),
  ];
  const Back = locale === "ar" ? ChevronRight : ChevronLeft;
  const timeSlots = (() => {
    const [startHour, startMinute] = config.officeStart.split(":").map(Number);
    const [endHour, endMinute] = config.officeEnd.split(":").map(Number);
    const slots: string[] = [];
    for (let minute = startHour * 60 + startMinute; minute < endHour * 60 + endMinute; minute += config.slotMinutes) {
      slots.push(`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`);
    }
    return slots;
  })();
  useEffect(() => { setToday(new Date().toISOString().slice(0, 10)); }, []);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0) { setStep(1); setError(""); return; }
    if (loading) return;
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/consultations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, paymentReference, amount, paymentMethod, locale, consent }),
      });
      const result = await response.json() as { ok: boolean; reference?: string; status?: string; payUrl?: string; message?: string };
      if (!response.ok || !result.ok || !result.reference) throw new Error(result.message || t.booking.error);
      if (result.payUrl) {
        window.location.assign(result.payUrl);
        return;
      }
      setStatus(result.status || "awaiting_confirmation");
      setReference(result.reference);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t.booking.error);
    } finally { setLoading(false); }
  }

  async function copyReference() {
    try { await navigator.clipboard.writeText(reference); setCopied(true); } catch { setCopied(false); }
  }

  if (reference) return <div className="success-screen" role="status">
    <span className="success-seal"><CheckCircle2 size={36} /></span><h3>{t.booking.success}</h3><p>{status === "payment_unavailable" ? t.booking.unavailable : t.booking.successText}</p>
    <div className="request-reference"><span>{t.booking.reference}</span><strong dir="ltr">{reference}</strong><button type="button" className="icon-button" onClick={copyReference} aria-label={copied ? t.booking.copied : t.booking.copy}>{copied ? <Check size={18} /> : <Copy size={18} />}</button></div>
    <button type="button" className="pill pill-brown" onClick={onClose}>{t.booking.finish}<span className="pill-arrow"><Arrow size={16} /></span></button>
  </div>;

  return <div className="consultation-flow">
    <p className="form-introduction">{t.booking.description}</p>
    <div className="booking-progress">{t.booking.steps.map((label, index) => <div key={label} className={step >= index ? "is-current" : ""}><span>{step > index ? <Check size={14} /> : `0${index + 1}`}</span><b>{label}</b></div>)}</div>
    <form className="cabinet-form" onSubmit={submit}>
      {step === 0 ? <>
        <p className="required-note">{t.booking.required}</p>
        <div className="form-grid">
          <label><span>{t.booking.name} <i>*</i></span><input required minLength={2} maxLength={140} autoComplete="name" value={form.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder={t.booking.namePlaceholder} /></label>
          <label><span>{t.booking.email} <i>*</i></span><input required type="email" maxLength={180} dir="ltr" autoComplete="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="vous@exemple.tn" /></label>
          <label><span>{t.booking.phone} <i>*</i></span><input required type="tel" maxLength={40} minLength={8} pattern="[+0-9 ().-]{8,40}" dir="ltr" autoComplete="tel" value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder={t.booking.phonePlaceholder} /></label>
          <label><span>{t.booking.service} <i>*</i></span><select required value={form.service} onChange={(event) => update("service", event.target.value)}><option value="">{t.booking.selectService}</option><option value="general">{t.booking.general}</option><option value="corporate">{t.booking.corporate}</option><option value="individual">{t.booking.individual}</option>{t.practice.areas.map((area) => <option key={area.id} value={area.id}>{area.title}</option>)}</select></label>
          <label><span>{t.booking.date}</span><input type="date" min={today} value={form.preferredDate} onChange={(event) => { update("preferredDate", event.target.value); if (!event.target.value) update("preferredTime", ""); }} /></label>
          <label><span>{t.booking.time}</span><select value={form.preferredTime} onChange={(event) => update("preferredTime", event.target.value)} disabled={!form.preferredDate}><option value="">{t.booking.selectTime}</option>{timeSlots.map((time) => <option key={time} value={time}>{time}</option>)}</select></label>
          <label className="field-wide"><span>{t.booking.message}</span><textarea maxLength={4000} rows={3} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder={t.booking.messagePlaceholder} /></label>
          <label className="form-honeypot" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)} /></label>
        </div>
        <button type="submit" className="pill pill-brown form-submit">{t.booking.continue}<span className="pill-arrow"><Arrow size={17} /></span></button>
      </> : <>
        <fieldset className="booking-fieldset"><legend>{t.booking.format}</legend><div className="consultation-formats">{t.booking.formats.map((format) => <label key={format.value} className={`format-option${amount === format.value ? " selected" : ""}`}><input type="radio" name="format" checked={amount === format.value} onChange={() => setAmount(format.value)} value={format.value} /><span className="radio-mark" /><span><b>{format.title}</b><small>{format.duration}</small></span><strong>{format.value}<small>{t.booking.currency}</small></strong></label>)}</div></fieldset>
        <fieldset className="booking-fieldset"><legend>{t.booking.method}</legend><div className="checkout-methods">{paymentOptions.map((method) => <label className={`checkout-method${paymentMethod === method.id ? " selected" : ""}`} key={method.id}><input type="radio" name="paymentMethod" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} /><method.Icon size={23} /><b>{method.label}</b><small>{method.note}</small>{paymentMethod === method.id && <Check className="payment-check" size={14} />}</label>)}</div></fieldset>
        {!config.paymentEnabled && <p className="payment-notice"><Info size={19} /><span>{t.booking.inactive}</span></p>}
        <div className="checkout-total"><span>{t.booking.total}</span><strong>{amount} <small>{t.booking.currency}</small></strong></div>
        <p className="fee-note">{t.booking.feeNote}</p>
        {needsProof && <div className="payment-proof-block">
          {paymentMethod === "bank_transfer" ? <div className="payment-instructions"><h4><Landmark size={19} />{t.booking.bankTransfer}</h4><dl><div><dt>{t.booking.bankName}</dt><dd dir="ltr">{bank.name || "—"}</dd></div><div><dt>{t.booking.bankBeneficiary}</dt><dd>{bank.beneficiary || "—"}</dd></div><div><dt>{t.booking.bankRib}</dt><dd dir="ltr" className="payment-rib">{bank.rib || "—"}</dd></div></dl>{bank.instructionsFr && <p>{locale === "ar" ? bank.instructionsAr || bank.instructionsFr : bank.instructionsFr}</p>}</div>
            : <div className="payment-instructions"><h4><Smartphone size={19} />{t.booking.d17}</h4><dl><div><dt>{t.booking.d17Phone}</dt><dd dir="ltr">{d17.phone || "—"}</dd></div><div><dt>{t.booking.d17MerchantCode}</dt><dd dir="ltr">{d17.merchantCode || "—"}</dd></div></dl>{d17.instructionsFr && <p>{locale === "ar" ? d17.instructionsAr || d17.instructionsFr : d17.instructionsFr}</p>}</div>}
          <label className="field-wide"><span>{t.booking.paymentReference} <i>*</i></span><input required minLength={4} maxLength={120} dir="ltr" value={paymentReference} onChange={(event) => setPaymentReference(event.target.value)} placeholder={paymentMethod === "d17" ? t.booking.d17ReferencePlaceholder : t.booking.bankReferencePlaceholder} /><small>{t.booking.paymentReferenceHint}</small></label>
          <p className="payment-proof-note"><Info size={17} />{t.booking.proofNote}</p>
        </div>}
        <label className="consent-line"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{t.booking.consent}</span></label>
        <details className="privacy-details"><summary>{t.booking.privacy}</summary><p>{t.privacy.paragraphs[0]}</p></details>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-button-row"><button type="button" className="back-button" onClick={() => setStep(0)} disabled={loading}><Back size={17} />{t.booking.previous}</button><button type="submit" className="pill pill-brown" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : config.paymentEnabled ? <LockKeyhole size={16} /> : <Check size={16} />}{loading ? t.booking.sending : config.paymentEnabled ? t.booking.pay : t.booking.send}</button></div>
        <p className="form-security"><ShieldCheck size={15} />{config.paymentEnabled ? t.booking.secure : t.about.values[1]}</p>
      </>}
    </form>
  </div>;
}
