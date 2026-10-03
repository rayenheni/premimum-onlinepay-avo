"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { Modal } from "@/components/modal";
import { type Locale } from "@/lib/site-content";
import type { SiteContent } from "@/lib/cms";
import type { PublicSiteConfig } from "@/lib/site-config";

export function HeroVideo({ locale, config, content }: { locale: Locale; config: PublicSiteConfig; content: SiteContent }) {
  const t = content;
  const [open, setOpen] = useState(false);
  if (config.introVideoKind === "none") return null;
  return <>
    <button type="button" className="hero-preview" onClick={() => setOpen(true)} aria-label={t.hero.play}>
      <span className="preview-media"><Image src="/images/video-poster.jpg" alt="" fill sizes="(max-width: 768px) 170px, 340px" unoptimized /><span className="preview-play"><Play size={22} fill="currentColor" /></span></span>
      <span className="preview-copy">{t.hero.preview}</span>
    </button>
    {open && <Modal title={t.introduction.title} closeLabel={t.nav.close} onClose={() => setOpen(false)} wide>
      <div className="intro-video">
        {config.introVideoKind === "embed"
          ? <iframe src={config.introVideoUrl} title={t.introduction.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          : <video src={config.introVideoUrl} poster="/images/video-poster.jpg" controls autoPlay playsInline preload="metadata" aria-label={t.introduction.label} />}
      </div>
    </Modal>}
  </>;
}
