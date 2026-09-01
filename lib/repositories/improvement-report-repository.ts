import { getDb } from "@/lib/db";

export async function getClientImprovementReport(propertyId: string) {
  const db = getDb();
  if (!db) return { negativeFeedback: [], flags: [], gaps: [], pendingReplayCases: 0, helpful: 0, feedbackTotal: 0 };
  const [negativeFeedback, flags, gaps, pendingReplayCases, helpful, feedbackTotal] = await Promise.all([
    db.sovereignAnswerFeedback.findMany({ where: { propertyId, helpful: false }, include: { evidence: { select: { question: true, answer: true, failureClassification: true, createdAt: true, replayCase: { select: { status: true } } } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.knowledgeAnswerFlag.findMany({ where: { propertyId, status: { not: "RESOLVED" } }, include: { entry: { select: { question: true, answer: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.knowledgeGap.findMany({ where: { propertyId, status: "OPEN" }, orderBy: [{ occurrenceCount: "desc" }, { lastAskedAt: "desc" }], take: 30 }),
    db.sovereignReplayCase.count({ where: { propertyId, status: "PENDING_REVIEW" } }),
    db.sovereignAnswerFeedback.count({ where: { propertyId, helpful: true } }),
    db.sovereignAnswerFeedback.count({ where: { propertyId } })
  ]);
  return { negativeFeedback, flags, gaps, pendingReplayCases, helpful, feedbackTotal };
}

export async function getAllBotImprovementReport() {
  const db = getDb();
  if (!db) return [];
  const properties = await db.property.findMany({
    where: { organizationId: { not: null } },
    select: { id: true, name: true, slug: true, organization: { select: { name: true } }, _count: { select: { sovereignEvidence: true, answerFeedback: true, sovereignReplayCases: true, knowledgeFlags: true, knowledgeGaps: true } } },
    orderBy: { name: "asc" }
  });
  return Promise.all(properties.map(async (property) => {
    const [helpful, negative, pendingReplay, openFlags, openGaps, safe] = await Promise.all([
      db.sovereignAnswerFeedback.count({ where: { propertyId: property.id, helpful: true } }),
      db.sovereignAnswerFeedback.count({ where: { propertyId: property.id, helpful: false } }),
      db.sovereignReplayCase.count({ where: { propertyId: property.id, status: "PENDING_REVIEW" } }),
      db.knowledgeAnswerFlag.count({ where: { propertyId: property.id, status: { not: "RESOLVED" } } }),
      db.knowledgeGap.count({ where: { propertyId: property.id, status: "OPEN" } }),
      db.sovereignAnswerEvidence.count({ where: { propertyId: property.id, safeResolution: true } })
    ]);
    const decisions = property._count.sovereignEvidence;
    const feedbackTotal = helpful + negative;
    return { ...property, decisions, helpful, negative, helpfulRate: feedbackTotal ? Math.round((helpful / feedbackTotal) * 100) : null, safeResolutionRate: decisions ? Math.round((safe / decisions) * 100) : null, pendingReplay, openFlags, openGaps };
  }));
}
