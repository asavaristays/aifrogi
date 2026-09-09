import { getDb } from "@/lib/db";
import { normalizeClaimKey } from "@/lib/knowledge-verification";
import { createAtomicClaim, editAndApproveKnowledgeClaim, fieldApproveClaim, generateClaimPreview, retireKnowledgeClaim, reviewClaimPreview } from "@/lib/repositories/knowledge-verification-repository";

type ImprovementSource = "FEEDBACK" | "GAP";

async function publishNewAnswer(input: { propertyId: string; question: string; answer: string; category: string; actorEmail: string; gapId?: string }) {
  const entry = await createAtomicClaim({ propertyId: input.propertyId, question: input.question, answer: input.answer, category: input.category, createdBy: input.actorEmail, gapId: input.gapId });
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const prior = entry.claimKey ? await db.knowledgeEntry.findFirst({ where: { propertyId: input.propertyId, claimKey: entry.claimKey, id: { not: entry.id }, status: { in: ["PUBLISHED", "PAUSED"] }, publishedAt: { not: null } }, orderBy: { version: "desc" } }) : null;
  await fieldApproveClaim({ propertyId: input.propertyId, entryId: entry.id, actorEmail: input.actorEmail, supersedesId: prior?.id });
  const preview = await generateClaimPreview({ propertyId: input.propertyId, entryId: entry.id });
  await reviewClaimPreview({ propertyId: input.propertyId, previewId: preview.id, actorEmail: input.actorEmail, approve: true });
  return entry.id;
}

export async function saveImprovementAnswer(input: { propertyId: string; sourceType: ImprovementSource; sourceId: string; question: string; answer: string; category: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  let existingEntryId: string | null = null;
  if (input.sourceType === "GAP") {
    const gap = await db.knowledgeGap.findFirst({ where: { id: input.sourceId, propertyId: input.propertyId }, select: { id: true, resolutionEntryId: true } });
    if (!gap) throw new Error("Missing-information item not found.");
    existingEntryId = gap.resolutionEntryId;
  } else {
    const feedback = await db.sovereignAnswerFeedback.findFirst({ where: { id: input.sourceId, propertyId: input.propertyId, helpful: false }, select: { evidence: { select: { replayCase: { select: { expectedClaimIds: true } } } } } });
    if (!feedback) throw new Error("Customer-feedback item not found.");
    existingEntryId = feedback.evidence.replayCase?.expectedClaimIds[0] || null;
  }
  if (existingEntryId && !await db.knowledgeEntry.findFirst({ where: { id: existingEntryId, propertyId: input.propertyId }, select: { id: true } })) existingEntryId = null;
  if (!existingEntryId) {
    const claimKey = normalizeClaimKey(input.category, input.question);
    existingEntryId = (await db.knowledgeEntry.findFirst({ where: { propertyId: input.propertyId, claimKey, status: "PUBLISHED" }, select: { id: true } }))?.id || null;
  }
  const entryId = existingEntryId
    ? (await editAndApproveKnowledgeClaim({ ...input, entryId: existingEntryId })).entryId
    : await publishNewAnswer({ ...input, gapId: input.sourceType === "GAP" ? input.sourceId : undefined });

  if (input.sourceType === "GAP") {
    await db.knowledgeGap.updateMany({ where: { id: input.sourceId, propertyId: input.propertyId }, data: { resolutionEntryId: entryId, status: "RESOLVED" } });
  } else {
    const feedback = await db.sovereignAnswerFeedback.findFirst({ where: { id: input.sourceId, propertyId: input.propertyId }, select: { evidenceId: true } });
    if (feedback) await db.sovereignReplayCase.updateMany({ where: { sourceEvidenceId: feedback.evidenceId, propertyId: input.propertyId }, data: { expectedClaimIds: [entryId], status: "RESOLVED_BY_CLIENT", reviewedAt: new Date() } });
  }
  return { entryId, answer: input.answer.trim(), category: input.category.trim() || "General" };
}

export async function removeImprovementItem(input: { propertyId: string; sourceType: ImprovementSource; sourceId: string; entryId?: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  if (input.entryId) await retireKnowledgeClaim({ propertyId: input.propertyId, entryId: input.entryId, actorEmail: input.actorEmail });
  if (input.sourceType === "GAP") {
    const result = await db.knowledgeGap.updateMany({ where: { id: input.sourceId, propertyId: input.propertyId }, data: { status: "DISMISSED" } });
    if (!result.count) throw new Error("Missing-information item not found.");
  } else {
    const feedback = await db.sovereignAnswerFeedback.findFirst({ where: { id: input.sourceId, propertyId: input.propertyId }, select: { evidenceId: true } });
    if (!feedback) throw new Error("Customer-feedback item not found.");
    await db.sovereignReplayCase.updateMany({ where: { sourceEvidenceId: feedback.evidenceId, propertyId: input.propertyId }, data: { status: "DISMISSED", reviewedAt: new Date() } });
  }
  return { removed: true };
}
