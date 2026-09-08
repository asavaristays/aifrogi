import { getDb } from "@/lib/db";
import type { Lead } from "@/types";

export type LeadGrade = "A" | "B" | "C";

export function isCapturedLead(lead: Pick<Lead, "websiteSession">) {
  return Boolean(
    lead.websiteSession?.consentedAt &&
    lead.websiteSession.contactName?.trim() &&
    lead.websiteSession.contactValue?.trim()
  );
}

export function gradeCapturedLead(lead: Pick<Lead, "score">): LeadGrade {
  if (lead.score >= 80) return "A";
  if (lead.score >= 60) return "B";
  return "C";
}

export function leadGradeLabel(grade: LeadGrade) {
  return grade === "A" ? "Hot" : grade === "B" ? "Warm" : "Nurture";
}

export type AdminLeadAwareness = {
  organizationId: string;
  organizationName: string;
  total: number;
  gradeA: number;
  gradeB: number;
  gradeC: number;
  unattended: number;
};

export async function getAdminLeadAwareness(): Promise<AdminLeadAwareness[]> {
  const db = getDb();
  if (!db) return [];

  const records = await db.lead.findMany({
    where: {
      websiteSession: {
        is: {
          consentedAt: { not: null },
          contactName: { not: null },
          contactValue: { not: null }
        }
      },
      property: { organizationId: { not: null } }
    },
    select: {
      score: true,
      stage: true,
      property: {
        select: {
          organization: { select: { id: true, name: true } }
        }
      }
    }
  });

  const awareness = new Map<string, AdminLeadAwareness>();
  for (const record of records) {
    const organization = record.property.organization;
    if (!organization) continue;
    const item = awareness.get(organization.id) || {
      organizationId: organization.id,
      organizationName: organization.name,
      total: 0,
      gradeA: 0,
      gradeB: 0,
      gradeC: 0,
      unattended: 0
    };
    const grade = gradeCapturedLead(record);
    item.total += 1;
    item[`grade${grade}`] += 1;
    if (record.stage === "NEW") item.unattended += 1;
    awareness.set(organization.id, item);
  }

  return [...awareness.values()].sort((a, b) => b.unattended - a.unattended || b.total - a.total || a.organizationName.localeCompare(b.organizationName));
}
