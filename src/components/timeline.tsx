"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CirclePlay, FileSearch, PenTool, PhoneCall, Presentation, RefreshCw, ShieldCheck, type LucideIcon } from "lucide-react";

const stepIcons: LucideIcon[] = [PhoneCall, FileSearch, Presentation, PenTool, CirclePlay, RefreshCw, ShieldCheck];

export function Timeline({ steps, stepLabel, note }: { steps: readonly { title: string; description: string }[]; stepLabel: string; note: string }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActive(Number((visible[0].target as HTMLElement).dataset.step));
    }, { rootMargin: "-120px 0px -25% 0px", threshold: [0.3, 0.65, 1] });
    refs.current.forEach((element) => { if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);

  return <div className="journey-list">
    <ol className="journey-timeline">{steps.map((step, index) => {
      const Icon = stepIcons[index] || ShieldCheck;
      return <li key={step.title} className={active === index ? "step-active" : ""} data-step={index} ref={(element) => { refs.current[index] = element; }}>
        <button type="button" className="step-marker" onClick={() => setActive(index)} aria-label={`${stepLabel} ${index + 1}: ${step.title}`} aria-pressed={active === index}><Icon size={21} strokeWidth={1.7} /></button>
        <button type="button" className="step-card" onClick={() => setActive(index)} aria-pressed={active === index}><span className="step-count">{stepLabel} - {String(index + 1).padStart(2, "0")}</span><h3>{step.title}</h3><p>{step.description}</p><span className="step-progress" /></button>
      </li>;
    })}</ol>
    <p className="journey-assurance"><BadgeCheck size={21} />{note}</p>
  </div>;
}
