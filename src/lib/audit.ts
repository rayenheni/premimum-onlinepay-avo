import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminAuditLogs, adminUsers } from "@/db/schema";
import { getTenant } from "@/lib/tenant";

/** Records an admin action inside the acting tenant. Never blocks the main request. */
export async function audit(adminId: number | null, action: string, target?: string, details?: string) {
  let tenantId = 1;
  if (adminId) {
    const [admin] = await db.select({ tenantId: adminUsers.tenantId }).from(adminUsers).where(eq(adminUsers.id, adminId)).limit(1);
    if (admin) tenantId = admin.tenantId;
  } else {
    const tenant = await getTenant();
    if (tenant) tenantId = tenant.id;
  }
  await db.insert(adminAuditLogs).values({
    tenantId, adminId,
    action: action.slice(0, 80),
    target: target?.slice(0, 180) || null,
    details: details?.slice(0, 4000) || null,
  });
}
