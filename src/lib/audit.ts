import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";

/** Records an administrative action without blocking the main request. */
export async function audit(adminId: number | null, action: string, target?: string, details?: string) {
  await db.insert(adminAuditLogs).values({
    adminId,
    action: action.slice(0, 80),
    target: target?.slice(0, 180) || null,
    details: details?.slice(0, 4000) || null,
  });
}
