"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export function Faq({ items }: { items: readonly { question: string; answer: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="faq-list">{items.map((item, index) => <div className={`faq-item${open === index ? " faq-open" : ""}`} key={item.question}>
    <h3><button type="button" onClick={() => setOpen((current) => current === index ? null : index)} aria-expanded={open === index} aria-controls={`faq-answer-${index}`}>{item.question}{open === index ? <Minus size={19} /> : <Plus size={19} />}</button></h3>
    <div id={`faq-answer-${index}`} hidden={open !== index}><p>{item.answer}</p></div>
  </div>)}</div>;
}
