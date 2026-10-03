import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLogs, adminUsers } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/admin-labels";

export default async function AuditPage() {
  const admin = await requireAdmin();
  const rows = await db.select({ id: adminAuditLogs.id, action: adminAuditLogs.action, target: adminAuditLogs.target, details: adminAuditLogs.details, createdAt: adminAuditLogs.createdAt, email: adminUsers.email }).from(adminAuditLogs).leftJoin(adminUsers, eq(adminUsers.id, adminAuditLogs.adminId)).orderBy(desc(adminAuditLogs.createdAt)).limit(300);
  return <><header className="adm-header"><div><h1>Journal de sécurité</h1><p>Historique des connexions et modifications administratives.</p></div></header><div className="adm-card adm-table-wrap"><table className="adm-table"><thead><tr><th>Date</th><th>Administrateur</th><th>Action</th><th>Cible</th><th>Détails</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.createdAt)}</td><td>{row.email || "Compte supprimé"}</td><td><code>{row.action}</code></td><td>{row.target || "—"}</td><td>{row.details || "—"}</td></tr>)}</tbody></table>{rows.length === 0 && <p className="adm-empty">Aucune activité enregistrée.</p>}</div></>;
}
