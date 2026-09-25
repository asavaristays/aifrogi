import { getDb } from "@/lib/db";

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

export async function getMemberDepartment(memberId?: string | null) {
  const db = getDb();
  if (!db || !memberId) return null;
  const rows = await db.$queryRaw<Array<{ department: string | null }>>`
    SELECT "department" FROM "OrganizationMember" WHERE id=${memberId} LIMIT 1
  `;
  return normalizeInStayDepartment(rows[0]?.department);
}
