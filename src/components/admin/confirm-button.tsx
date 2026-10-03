"use client";

import type { ReactNode } from "react";

export function ConfirmButton({ message, children, className = "adm-button adm-danger" }: { message: string; children: ReactNode; className?: string }) {
  return <button type="submit" className={className} onClick={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{children}</button>;
}
