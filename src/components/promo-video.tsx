"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, Check, ChevronLeft, ChevronRight, Clock3, FileCheck2, Languages, Pause, Play, RotateCcw, Scale, ShieldCheck, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/site-content";
import type { PublicSiteConfig } from "@/lib/site-config";

const SCENE_LENGTH = 5000;

const arabicScenes = [
  {
    kicker: "عندك مشكل قانوني؟",
    title: "ما تخليش الحيرة\nتكبّر الموضوع.",
    body: "أوّل خطوة للحلّ تبدأ بكلمة واضحة.",
    tag: "01 / البداية",
    icon: Scale,
  },
  {
    kicker: "مكتبكم القانوني في تونس",
    title: "نسمعوك. نفهموك.\nونوجّهوك.",
    body: "نفسّرولك وضعيتك ونقترحولك الحلّ الأنسب، بكل وضوح.",
    tag: "02 / الإصغاء",
    icon: ShieldCheck,
  },
  {
    kicker: "من الاستشارة للتنفيذ",
    title: "ملفّك يمشي\nخطوة بخطوة.",
    body: "نراجعو الوثائق، نحدّدو الخطة، ونبقاو معاك في كل مرحلة.",
    tag: "03 / المتابعة",
    icon: FileCheck2,
  },
  {
    kicker: "للأفراد وللمؤسسات",
    title: "حلول قانونية\nعلى قدّ احتياجك.",
    body: "عقود، شركات، عقارات، عائلة، شغل وقضايا — مرافقة قريبة من واقعك.",
    tag: "04 / الخبرة",
    icon: Check,
  },
  {
    kicker: "بالعربي ولا بالفرنسي",
    title: "تواصل واضح.\nسرّية. ثقة.",
    body: "خاطر فهمك للخطوة الجاية أهمّ من المصطلحات المعقّدة.",
    tag: "05 / الثقة",
    icon: Languages,
  },
  {
    kicker: "جاهز تاخو الخطوة الأولى؟",
    title: "أحجز استشارتك\nاليوم.",
    body: "ابعث طلبك من الموقع، وإحنا نرجعولك في أقرب وقت.",
    tag: "06 / تواصل",
    icon: Clock3,
  },
] as const;

const frenchScenes = [
  {
    kicker: "Un problème juridique ?",
    title: "Ne laissez pas le doute\ncompliquer les choses.",
    body: "La première étape commence par une réponse claire.",
    tag: "01 / DÉPART",
    icon: Scale,
  },
  {
    kicker: "Votre Cabinet à Tunis",
    title: "Nous vous écoutons.\nNous vous orientons.",
    body: "Une explication claire et une solution adaptée à votre situation.",
    tag: "02 / ÉCOUTE",
    icon: ShieldCheck,
  },
  {
    kicker: "Du conseil à l'action",
    title: "Votre dossier avance\nétape par étape.",
    body: "Documents, stratégie et suivi : vous savez toujours où vous en êtes.",
    tag: "03 / SUIVI",
    icon: FileCheck2,
  },
  {
    kicker: "Pour les particuliers et les entreprises",
    title: "Des solutions\nà votre mesure.",
    body: "Contrats, sociétés, immobilier, famille, travail et contentieux.",
    tag: "04 / EXPERTISE",
    icon: Check,
  },
  {
    kicker: "En arabe ou en français",
    title: "Clarté. Confidentialité.\nConfiance.",
    body: "Parce que comprendre la prochaine étape compte plus que le jargon.",
    tag: "05 / CONFIANCE",
    icon: Languages,
  },
  {
    kicker: "Prêt à faire le premier pas ?",
    title: "Réservez votre\nconsultation.",
    body: "Envoyez votre demande en ligne : nous vous répondrons rapidement.",
    tag: "06 / CONTACT",
    icon: Clock3,
  },
] as const;

type PromoScene = { kicker: string; title: string; body: string; tag: string; icon: LucideIcon };

function SceneContent({ scene, index, locale, active }: { scene: PromoScene; index: number; locale: Locale; active: boolean }) {
  const Icon = scene.icon;
  const lines = scene.title.split("\n");
  return <div className="promo-scene-content">
    <div className="promo-scene-copy">
      <p className="promo-kicker"><span />{scene.kicker}</p>
      <h2>{lines.map((line) => <span key={line}>{line}</span>)}</h2>
      <p className="promo-body">{scene.body}</p>
      {index === 5 && <Link href={`/${locale}/book`} tabIndex={active ? 0 : -1} className="promo-scene-cta">{locale === "ar" ? "أحجز استشارتك" : "Réserver une consultation"}<ArrowUpLeft size={17} /></Link>}
    </div>
    <div className={`promo-scene-art promo-art-${index + 1}`} aria-hidden="true">
      <div className="promo-art-orbit promo-orbit-one" />
      <div className="promo-art-orbit promo-orbit-two" />
      <div className="promo-art-ring"><Icon size={index === 0 ? 71 : 58} strokeWidth={1.1} /></div>
      {index === 0 && <div className="promo-art-balance"><span /><i /><b /></div>}
      {index === 1 && <div className="promo-art-pulse"><span /><span /><span /></div>}
      {index === 2 && <div className="promo-art-file"><span /><span /><span /></div>}
      {index === 3 && <div className="promo-art-dots"><i /><i /><i /><i /><i /><i /></div>}
      {index === 4 && <div className="promo-art-language"><b>ع</b><span>FR</span></div>}
      {index === 5 && <div className="promo-art-arrow"><ArrowUpLeft size={72} strokeWidth={1.1} /></div>}
      <span className="promo-art-label">{scene.tag}</span>
    </div>
  </div>;
}

export function PromoVideo({ locale, config }: { locale: Locale; config: PublicSiteConfig }) {
  const [playing, setPlaying] = useState(true);
  const [sceneIndex, setSceneIndex] = useState(0);
  const scenes = useMemo(() => locale === "ar" ? arabicScenes : frenchScenes, [locale]);
  const seconds = Math.round((SCENE_LENGTH / 1000) * scenes.length);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setSceneIndex((current) => (current + 1) % scenes.length), SCENE_LENGTH);
    return () => window.clearInterval(timer);
  }, [playing, scenes.length]);

  const goToScene = (next: number) => setSceneIndex((next + scenes.length) % scenes.length);
  const progress = `${((sceneIndex + 1) / scenes.length) * 100}%`;
  const ar = locale === "ar";

  return <section className="promo-page" dir={ar ? "rtl" : "ltr"} aria-labelledby="promo-title">
    <div className="promo-page-glow promo-glow-one" />
    <div className="promo-page-glow promo-glow-two" />
    <div className="container promo-container">
      <div className="promo-heading">
        <div>
          <p className="promo-eyebrow"><span />{ar ? "فيديو ترويجي · باللهجة التونسية" : "Vidéo promotionnelle · version française"}</p>
          <h1 id="promo-title">{ar ? "مكتبكم القانوني،\nأقرب ليك." : "Votre Cabinet,\nà vos côtés."}</h1>
          <p className="promo-intro">{ar ? "موشن غرافيك قصير يعرّف بخدمات المكتب ويقرّب الرسالة للناس بطريقة عصرية وواضحة." : "Un motion graphic court pour présenter le cabinet avec un message clair et actuel."}</p>
        </div>
        <div className="promo-meta"><span>00:{String(seconds).padStart(2, "0")}</span><small>{ar ? "نسخة جاهزة للتصوير" : "Format prêt à tourner"}</small></div>
      </div>

      <section className={`promo-player${playing ? " is-playing" : " is-paused"}`} aria-label={ar ? "الفيديو الترويجي" : "Vidéo promotionnelle"}>
        <Image src={config.heroImage} alt="" fill sizes="(max-width: 900px) 100vw, 1180px" className="promo-backdrop" unoptimized priority />
        <div className="promo-backdrop-shade" />
        <div className="promo-grid" aria-hidden="true" />
        <div className="promo-noise" aria-hidden="true" />
        <div className="promo-topline"><span>VOTRE CABINET</span><span>{ar ? "تونس · 2026" : "TUNIS · 2026"}</span></div>
        {scenes.map((scene, index) => <article key={scene.tag} className={`promo-scene${sceneIndex === index ? " is-active" : ""}`} aria-hidden={sceneIndex !== index}><SceneContent scene={scene} index={index} locale={locale} active={sceneIndex === index} /></article>)}
        <div className="promo-bottomline"><span>{ar ? "محاماة واستشارات قانونية" : "Avocat · conseil juridique"}</span><span>{String(sceneIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span></div>
        <div className="promo-progress" aria-hidden="true"><span style={{ width: progress }} /></div>
      </section>

      <div className="promo-controls" aria-label={ar ? "أدوات الفيديو" : "Commandes de la vidéo"}>
        <div className="promo-control-group">
          <button type="button" className="promo-control-button promo-play-button" onClick={() => setPlaying((current) => !current)} aria-label={playing ? (ar ? "إيقاف العرض" : "Pause") : (ar ? "تشغيل العرض" : "Lecture")}>
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button type="button" className="promo-control-button" onClick={() => goToScene(sceneIndex - 1)} aria-label={ar ? "المشهد السابق" : "Scène précédente"}><ChevronRight size={20} /></button>
          <button type="button" className="promo-control-button" onClick={() => goToScene(sceneIndex + 1)} aria-label={ar ? "المشهد التالي" : "Scène suivante"}><ChevronLeft size={20} /></button>
          <button type="button" className="promo-control-button" onClick={() => { setSceneIndex(0); setPlaying(true); }} aria-label={ar ? "إعادة العرض" : "Recommencer"}><RotateCcw size={17} /></button>
        </div>
        <div className="promo-dots" role="tablist" aria-label={ar ? "مشاهد الفيديو" : "Scènes de la vidéo"}>{scenes.map((scene, index) => <button key={scene.tag} type="button" role="tab" aria-selected={sceneIndex === index} className={sceneIndex === index ? "is-active" : ""} onClick={() => { setSceneIndex(index); setPlaying(false); }} aria-label={`${ar ? "المشهد" : "Scène"} ${index + 1}`} />)}</div>
        <Link className="promo-site-link" href={`/${locale}`}><span>{ar ? "رجوع للموقع" : "Retour au site"}</span><ArrowUpLeft size={17} /></Link>
      </div>

      <section className="promo-script">
        <div className="promo-script-heading"><span className="promo-script-icon"><Languages size={21} /></span><div><p>{ar ? "النص المقترح للتعليق الصوتي" : "Texte proposé pour la voix off"}</p><h2>{ar ? "رسالة قصيرة، تحكي على المكتب بطريقتك." : "Un message court, à l'image du cabinet."}</h2></div></div>
        <div className="promo-script-lines">{scenes.map((scene, index) => <div key={scene.tag} className={sceneIndex === index ? "is-current" : ""}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{scene.kicker}</strong>{scene.body}</p></div>)}</div>
      </section>

      <div className="promo-credit"><span>{ar ? "الفكرة والتنفيذ الرقمي" : "Concept et direction digitale"}</span><strong>Waqeel Studio</strong><span className="promo-credit-dot" /> <span>{ar ? "موشن غرافيك للموقع" : "Motion graphic pour le site"}</span></div>
    </div>
  </section>;
}
