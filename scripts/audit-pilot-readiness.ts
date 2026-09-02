import { getDb } from "@/lib/db";
import { calculateCoverage } from "@/lib/knowledge-verification";

const target = (process.argv[2] || "webtechnosys").trim().toLowerCase();

function knowledgeCategory(category: string) {
  if (category === "PINGBOOK") return "APPOINTMENTS";
  if (category === "STAY") return "HOSPITALITY";
  if (category === "FLOWCART") return "COMMERCE";
  return category;
}

async function main() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const organization = await db.organization.findFirst({
    where: {
      OR: [
        { slug: { contains: target, mode: "insensitive" } },
        { name: { contains: target, mode: "insensitive" } },
        { ownerEmail: { contains: target, mode: "insensitive" } }
      ]
    },
    include: {
      botProfile: true,
      botConnectors: true,
      subscription: { include: { plan: true } },
      properties: { select: { id: true, name: true, slug: true } },
      _count: { select: { members: true, supportTickets: true, activities: true } }
    }
  });
  if (!organization) throw new Error(`No organization matched "${target}".`);

  const now = new Date();
  const propertyReports = await Promise.all(organization.properties.map(async (property) => {
    const [claims, conflicts, unsigned, openFlags, pendingPreviews, openGaps, evidence, inconsistentEvidence, safeEvidence, feedback, negativeFeedback, pendingReplays] = await Promise.all([
      db.knowledgeEntry.findMany({ where: { propertyId: property.id, status: "PUBLISHED" }, select: { question: true, answer: true, category: true, expiresAt: true } }),
      db.knowledgeEntry.count({ where: { propertyId: property.id, conflictStatus: "UNRESOLVED", status: { notIn: ["REJECTED", "SUPERSEDED"] } } }),
      db.knowledgeEntry.count({ where: { propertyId: property.id, status: "PUBLISHED", OR: [{ fieldApprovedAt: null }, { previewApprovedAt: null }] } }),
      db.knowledgeAnswerFlag.count({ where: { propertyId: property.id, status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
      db.knowledgePreview.count({ where: { propertyId: property.id, status: "PENDING" } }),
      db.knowledgeGap.count({ where: { propertyId: property.id, status: { notIn: ["RESOLVED", "DISMISSED"] } } }),
      db.sovereignAnswerEvidence.count({ where: { propertyId: property.id } }),
      db.sovereignAnswerEvidence.count({ where: { propertyId: property.id, decisionConsistent: false } }),
      db.sovereignAnswerEvidence.count({ where: { propertyId: property.id, safeResolution: true } }),
      db.sovereignAnswerFeedback.count({ where: { propertyId: property.id } }),
      db.sovereignAnswerFeedback.count({ where: { propertyId: property.id, helpful: false } }),
      db.sovereignReplayCase.count({ where: { propertyId: property.id, status: "PENDING_REVIEW" } })
    ]);
    const fresh = claims.filter((claim) => !claim.expiresAt || claim.expiresAt > now).length;
    const freshnessRate = claims.length ? Math.round((fresh / claims.length) * 100) : 0;
    const coverage = calculateCoverage(knowledgeCategory(String(organization.botProfile?.category || "CUSTOM")), claims);
    return {
      name: property.name,
      slug: property.slug,
      knowledge: { published: claims.length, coverage: coverage.percentage, missingTopics: coverage.missing, freshnessRate, conflicts, unsigned, pendingPreviews, openFlags, openGaps },
      evidence: { total: evidence, safeResolutionRate: evidence ? Math.round((safeEvidence / evidence) * 1000) / 10 : null, inconsistentDecisions: inconsistentEvidence, feedback, negativeFeedback, pendingReplays }
    };
  }));

  const profile = organization.botProfile;
  const requiredConnectors = organization.botConnectors.filter((connector) => connector.required && connector.lifecycle !== "RETIRED");
  const report = {
    auditedAt: now.toISOString(),
    organization: { name: organization.name, slug: organization.slug, status: organization.status, members: organization._count.members },
    bot: profile ? { category: profile.category, persona: profile.personaName, status: profile.status, channels: profile.channels, configured: Boolean(profile.personaName && profile.businessObjective), installationDetected: Boolean(profile.installationDetectedAt), live: Boolean(profile.liveAt) } : null,
    subscription: organization.subscription ? { plan: organization.subscription.plan.code, status: organization.subscription.status, trialEndsAt: organization.subscription.trialEndsAt, graceEndsAt: organization.subscription.graceEndsAt } : null,
    connectors: { required: requiredConnectors.length, ready: requiredConnectors.filter((connector) => connector.enabled && ["LIVE", "MONITORED"].includes(connector.lifecycle)).length, details: requiredConnectors.map((connector) => ({ name: connector.name, enabled: connector.enabled, lifecycle: connector.lifecycle })) },
    operations: { supportTickets: organization._count.supportTickets, activities: organization._count.activities },
    properties: propertyReports
  };
  console.log(JSON.stringify(report, null, 2));
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
