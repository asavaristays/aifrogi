import { getDb } from "@/lib/db";

export async function getBotPersonaForPropertySlug(propertySlug: string) {
  const db = getDb();
  if (!db) return null;
  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    select: { organization: { select: { botProfile: { select: { category: true, personaName: true, businessObjective: true, tone: true, languages: true, prohibitedClaims: true, escalationTriggers: true, humanHandoffEnabled: true, actionApprovalNeeded: true, kbGateVersion: true } } } } }
  });
  return property?.organization?.botProfile || null;
}
