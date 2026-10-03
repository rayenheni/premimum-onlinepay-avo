"use client";

import { useActionState } from "react";
import { loginAction, setupAction, type AuthState } from "@/app/admin/actions";

export function LoginForm({ mode, needsKey }: { mode: "login" | "setup"; needsKey: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "setup" ? setupAction : loginAction, {});
  return <form action={action} className="adm-form">
    <label><span>Adresse e-mail</span><input name="email" type="email" required autoComplete="username" defaultValue={state.email ?? ""} autoFocus /></label>
    <label><span>Mot de passe{mode === "setup" ? " (10 caractères minimum)" : ""}</span><input name="password" type="password" required minLength={mode === "setup" ? 10 : 1} autoComplete={mode === "setup" ? "new-password" : "current-password"} /></label>
    {mode === "setup" && <label><span>Confirmer le mot de passe</span><input name="confirm" type="password" required minLength={10} autoComplete="new-password" /></label>}
    {mode === "setup" && needsKey && <label><span>Code d’installation</span><input name="setupKey" type="password" required autoComplete="off" /></label>}
    {state.error && <p className="adm-error" role="alert">{state.error}</p>}
    <button type="submit" className="adm-button adm-primary" disabled={pending}>{pending ? "Veuillez patienter…" : mode === "setup" ? "Créer le compte administrateur" : "Se connecter"}</button>
  </form>;
}
