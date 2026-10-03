"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Scale, X } from "lucide-react";

export function Modal({ title, closeLabel, onClose, children, wide = false }: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const root = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  const titleId = useId();
  useEffect(() => { close.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => {
      const first = root.current?.querySelector<HTMLElement>("[data-autofocus]")
        || root.current?.querySelector<HTMLElement>("input:not([type=hidden]):not([tabindex='-1'])")
        || root.current?.querySelector<HTMLElement>("button");
      first?.focus();
    }, 40);

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close.current();
      if (event.key !== "Tab" || !root.current) return;
      const elements = Array.from(root.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]):not([tabindex='-1']), select:not([disabled]), textarea:not([disabled]), summary, [tabindex='0']")).filter((element) => element.offsetParent !== null);
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || !root.current.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !root.current.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, []);

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className={`modal-panel${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={root}>
      <header className="modal-header"><span className="modal-header-icon"><Scale size={22} /></span><h2 id={titleId}>{title}</h2><button type="button" className="icon-button modal-close" onClick={onClose} aria-label={closeLabel}><X size={22} /></button></header>
      <div className="modal-content">{children}</div>
    </section>
  </div>;
}
