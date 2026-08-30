import { getDb } from "@/lib/db";

export async function getBotPersonaForPropertySlug(propertySlug: string) {
  const db = getDb();
  if (!db) return null;
  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    select: { organization: { select: { botProfile: { select: { category: true, personaPackVersion: true, personaName: true, businessObjective: true, tone: true, languages: true, prohibitedClaims: true, escalationTriggers: true, humanHandoffEnabled: true, actionApprovalNeeded: true, kbGateVersion: true } }, botConnectors: { where: { lifecycle: { not: "RETIRED" } }, select: { connectorKey: true, name: true, required: true, enabled: true, lifecycle: true, readOperations: true, writeOperations: true, unavailableBehavior: true } } } } }
  });
  const profile = property?.organization?.botProfile;
  return profile ? { ...profile, connectors: property?.organization?.botConnectors || [] } : null;
}
