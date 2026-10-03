import { count } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Scale } from "lucide-react";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getAdmin } from "@/lib/auth";
import { adminHref } from "@/lib/admin-path";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  if (await getAdmin()) redirect("/admin");
  const [{ value }] = await db.select({ value: count() }).from(adminUsers);
  const setup = value === 0;
  return <main className="adm-login"><div className="adm-login-card">
    <span className="adm-login-icon"><Scale size={28} /></span>
    <h1>{setup ? "Première installation" : "Espace d’administration"}</h1>
    <p>{setup ? "Créez le compte administrateur du cabinet. Cette étape n’est disponible qu’une seule fois." : "Votre Cabinet — accès réservé."}</p>
    <LoginForm mode={setup ? "setup" : "login"} needsKey={Boolean(process.env.ADMIN_SETUP_KEY)} />
  </div></main>;
}
