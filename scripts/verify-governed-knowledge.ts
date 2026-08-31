import { File as NodeFile } from "node:buffer";
import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, repository, verificationRepository, documentService] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/repositories/knowledge-content-repository"),
    import("@/lib/repositories/knowledge-verification-repository"),
    import("@/lib/services/knowledge-document-service")
  ]);
  const {
    createKnowledgeDocument,
    createKnowledgeEntry,
    detectDocumentConflict,
    getApprovedKnowledgeContext,
    getKnowledgeGovernanceSummary,
    recordKnowledgeGap,
    reviewKnowledgeDocument,
    reviewKnowledgeEntry
  } = repository;
  const { extractKnowledgeDocument } = documentService;
  const { createAtomicClaim, fieldApproveClaim, flagKnowledgeAnswer, generateClaimPreview, getPublishedClaimContext, processKnowledgeFlagSla, reviewClaimPreview } = verificationRepository;
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const property = await db.property.findFirst({
    where: { organization: { members: { some: { email: "support@hotelradar.in" } } } },
    select: { id: true, slug: true }
  }) ?? await db.property.findFirst({ select: { id: true, slug: true } });
  if (!property) throw new Error("No workspace property is available for verification.");

  const runId = `qa-${Date.now()}`;
  const actor = "knowledge-qa@aifrogi.local";
  const createdEntryIds: string[] = [];
  const createdDocumentIds: string[] = [];
  const createdFlagIds: string[] = [];
  const createdFlagReferences: string[] = [];
  let gapId: string | null = null;

  try {
    const gapQuestion = `${runId} unanswered concierge policy question`;
    const firstGap = await recordKnowledgeGap(property.slug, gapQuestion);
    const repeatedGap = await recordKnowledgeGap(property.slug, gapQuestion);
    assert(firstGap && repeatedGap, "The unanswered question was not recorded.");
    assert(repeatedGap.occurrenceCount === 2, "Repeated questions were not aggregated.");
    gapId = repeatedGap.id;

    const question = `${runId} what is the verification trial duration?`;
    const approvedEntry = await createKnowledgeEntry({
      propertyId: property.id,
      question,
      answer: "The verification trial lasts 15 days.",
      category: "QA verification",
      createdBy: actor
    });
    createdEntryIds.push(approvedEntry.id);
    await reviewKnowledgeEntry({ propertyId: property.id, id: approvedEntry.id, action: "APPROVE", actorEmail: actor });

    const conflictingEntry = await createKnowledgeEntry({
      propertyId: property.id,
      question,
      answer: "The verification trial lasts 45 days.",
      category: "QA verification",
      createdBy: actor
    });
    createdEntryIds.push(conflictingEntry.id);
    assert(conflictingEntry.status === "CONFLICT" && conflictingEntry.conflictSummary, "A contradictory answer was not flagged.");

    const atomicQuestion = `${runId} what is the governed cancellation window?`;
    const atomicApproved = await createAtomicClaim({ propertyId: property.id, question: atomicQuestion, answer: "The governed cancellation window is 24 hours.", category: "QA verification", createdBy: actor });
    createdEntryIds.push(atomicApproved.id);
    await fieldApproveClaim({ propertyId: property.id, entryId: atomicApproved.id, actorEmail: actor });
    const preview = await generateClaimPreview({ propertyId: property.id, entryId: atomicApproved.id });
    await reviewClaimPreview({ propertyId: property.id, previewId: preview.id, actorEmail: actor, approve: true });
    const atomicConflict = await createAtomicClaim({ propertyId: property.id, question: atomicQuestion, answer: "The governed cancellation window is 72 hours.", category: "QA verification", createdBy: actor });
    createdEntryIds.push(atomicConflict.id);
    assert(atomicConflict.status === "CONFLICT", "The atomic conflicting version was not blocked.");
    const suppressedPrior = await db.knowledgeEntry.findUnique({ where: { id: atomicApproved.id } });
    assert(suppressedPrior?.status === "PAUSED" && suppressedPrior.conflictStatus === "UNRESOLVED", "The previously published claim family was not suppressed.");
    const suppressedContext = await getPublishedClaimContext(property.slug, atomicQuestion);
    assert(suppressedContext.blockedState === "CONFLICT" && !suppressedContext.context.includes("24 hours"), "Disputed knowledge remained retrievable during conflict review.");

    const flaggedQuestion = `${runId} what is the governed check-in time?`;
    const flaggableClaim = await createAtomicClaim({ propertyId: property.id, question: flaggedQuestion, answer: "The governed check-in time is 2:00 PM.", category: "QA verification", createdBy: actor });
    createdEntryIds.push(flaggableClaim.id);
    await fieldApproveClaim({ propertyId: property.id, entryId: flaggableClaim.id, actorEmail: actor });
    const flaggablePreview = await generateClaimPreview({ propertyId: property.id, entryId: flaggableClaim.id });
    await reviewClaimPreview({ propertyId: property.id, previewId: flaggablePreview.id, actorEmail: actor, approve: true });
    const flag = await flagKnowledgeAnswer({ propertyId: property.id, entryId: flaggableClaim.id, reporterType: "QA", reporterId: actor, reason: "Synthetic incorrect-fact flag for SLA verification." });
    createdFlagIds.push(flag.id);
    createdFlagReferences.push(`KBF-${flag.id}`);
    const pausedFlaggable = await db.knowledgeEntry.findUnique({ where: { id: flaggableClaim.id } });
    assert(pausedFlaggable?.status === "PAUSED", "Explicit incorrect-fact flag did not pause its cited claim.");
    const immediateTicket = await db.supportTicket.findUnique({ where: { reference: `KBF-${flag.id}` } });
    assert(immediateTicket?.priority === "HIGH", "Flag did not create an immediate high-priority operational notification.");
    await db.knowledgeAnswerFlag.update({ where: { id: flag.id }, data: { acknowledgeDueAt: new Date(Date.now() - 7200000), resolveDueAt: new Date(Date.now() - 3600000) } });
    const sla = await processKnowledgeFlagSla();
    assert(sla.escalated >= 1, "Overdue knowledge flag was not escalated.");
    const urgentTicket = await db.supportTicket.findUnique({ where: { reference: `KBF-${flag.id}` } });
    assert(urgentTicket?.priority === "URGENT", "Overdue knowledge flag did not escalate its operational ticket.");

    const file = new NodeFile(
      [`${runId} service handbook\nEscalation desk is available for verified workspace requests.`],
      `${runId}-handbook.txt`,
      { type: "text/plain" }
    );
    const extracted = await extractKnowledgeDocument(file as unknown as Parameters<typeof extractKnowledgeDocument>[0]);
    assert(extracted.extractedText.includes("Escalation desk"), "Text extraction did not preserve document content.");
    const conflictSummary = await detectDocumentConflict(property.id, extracted.extractedText);
    const document = await createKnowledgeDocument({
      propertyId: property.id,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      content: extracted.content,
      extractedText: extracted.extractedText,
      uploadedBy: actor,
      conflictSummary
    });
    createdDocumentIds.push(document.id);
    await reviewKnowledgeDocument({ propertyId: property.id, id: document.id, action: "APPROVE", actorEmail: actor, confirmConflict: true });

    const answerContext = await getApprovedKnowledgeContext(property.slug, `${runId} trial duration`);
    assert(!answerContext.includes("15 days"), "Older disputed answer remained available to retrieval.");
    assert(!answerContext.includes("45 days"), "Conflicted answer leaked into approved retrieval.");
    const documentContext = await getApprovedKnowledgeContext(property.slug, `${runId} escalation desk`);
    assert(documentContext.includes("Escalation desk"), "Approved document was not available to retrieval.");

    const summary = await getKnowledgeGovernanceSummary(property.slug);
    assert(summary.entries.some((entry) => entry.id === approvedEntry.id), "Governance summary omitted the approved answer.");
    assert(summary.documents.some((item) => item.id === document.id), "Governance summary omitted the approved document.");
    console.log(`Governed knowledge verification passed for ${property.slug}.`);
  } finally {
    if (createdFlagReferences.length) await db.supportTicket.deleteMany({ where: { reference: { in: createdFlagReferences } } });
    if (createdFlagIds.length) await db.onboardingActivity.deleteMany({ where: { OR: createdFlagIds.map((id) => ({ detail: { contains: id } })) } });
    if (createdFlagIds.length) await db.knowledgeAnswerFlag.deleteMany({ where: { id: { in: createdFlagIds } } });
    if (gapId) await db.knowledgeGap.deleteMany({ where: { id: gapId } });
    if (createdEntryIds.length) await db.knowledgeEntry.deleteMany({ where: { id: { in: createdEntryIds } } });
    if (createdDocumentIds.length) await db.knowledgeDocument.deleteMany({ where: { id: { in: createdDocumentIds } } });
    await db.knowledgeGap.deleteMany({ where: { propertyId: property.id, question: { startsWith: "qa-" } } });
    await db.knowledgeEntry.deleteMany({ where: { propertyId: property.id, createdBy: actor } });
    await db.knowledgeDocument.deleteMany({ where: { propertyId: property.id, uploadedBy: actor } });
    const [entryResidue, documentResidue, gapResidue] = await Promise.all([
      db.knowledgeEntry.count({ where: { propertyId: property.id, createdBy: actor } }),
      db.knowledgeDocument.count({ where: { propertyId: property.id, uploadedBy: actor } }),
      db.knowledgeGap.count({ where: { propertyId: property.id, question: { startsWith: "qa-" } } })
    ]);
    assert(entryResidue + documentResidue + gapResidue === 0, "Synthetic knowledge records were not fully removed.");
    console.log("Synthetic knowledge records removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
