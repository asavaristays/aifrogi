import { getDb } from "@/lib/db";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

export const IN_STAY_DEPARTMENTS = [
  "Front Desk",
  "Housekeeping",
  "Food & Beverage",
  "Maintenance",
  "Safari & Experiences"
] as const;

export type InStayDepartment = (typeof IN_STAY_DEPARTMENTS)[number];

export function normalizeInStayDepartment(value: unknown): InStayDepartment | null {
  const department = String(value || "").trim();
  return IN_STAY_DEPARTMENTS.includes(department as InStayDepartment) ? department as InStayDepartment : null;
}

export async function getMemberDepartment(memberId?: string | null, organizationId?: string | null) {
  if (!memberId || !organizationId) return null;
  return withTenantDatabaseContext({ kind: "tenant", organizationId, actor: "in-stay-member-scope" }, async () => {
    const db = getDb();
    if (!db) return null;
    const rows = await db.$queryRaw<Array<{ department: string | null }>>`
      SELECT "department" FROM "OrganizationMember" WHERE id=${memberId} AND "organizationId"=${organizationId} LIMIT 1
    `;
    return normalizeInStayDepartment(rows[0]?.department);
  });
}
