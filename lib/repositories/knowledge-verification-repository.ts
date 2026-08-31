import { getDb } from "@/lib/db";
import { calculateCoverage, KB_FRAMEWORK_VERSION, KB_FRESHNESS_TARGET, KB_MINIMUM_COVERAGE, validateAtomicClaim } from "@/lib/knowledge-verification";

export async function expirePublishedClaims(propertyId?: string) {
  const db = getDb();
  if (!db) return 0;
  const result = await db.knowledgeEntry.updateMany({
    where: { ...(propertyId ? { propertyId } : {}), status: "PUBLISHED", expiresAt: { lte: new Date() } },
    data: { status: "EXPIRED", pausedAt: new Date(), pauseReason: "Validity period expired; client re-confirmation is required." }
  });
  return result.count;
}

export async function createAtomicClaim(input: { propertyId: string; question: string; answer: string; category: string; claimType?: string; valueType?: string; currency?: string | null; effectiveAt?: Date | null; expiresAt?: Date | null; refreshDays?: number; createdBy: string; gapId?: string; documentId?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const validation = validateAtomicClaim(input);
  const latest = await db.knowledgeEntry.findFirst({ where: { propertyId: input.propertyId, claimKey: validation.claimKey }, orderBy: { version: "desc" } });
  const existingConflict = await db.knowledgeEntry.findFirst({ where: { propertyId: input.propertyId, claimKey: validation.claimKey, status: { in: ["PUBLISHED", "FIELD_APPROVED", "PREVIEW_PENDING", "APPROVED"] }, answer: { not: input.answer.trim() } } });
  const conflictSummary = existingConflict ? `Conflicts with active claim version ${existingConflict.version}. Resolve by explicitly superseding that version.` : null;
  return db.$transaction(async (tx) => {
    if (conflictSummary) {
      await tx.knowledgeEntry.updateMany({
        where: { propertyId: input.propertyId, claimKey: validation.claimKey, status: { in: ["PUBLISHED", "APPROVED", "FIELD_APPROVED", "PREVIEW_PENDING"] } },
        data: { status: "PAUSED", conflictStatus: "UNRESOLVED", pausedAt: new Date(), pauseReason: "Claim family suppressed because a conflicting version requires authorised review." }
      });
    }
    const entry = await tx.knowledgeEntry.create({ data: {
      propertyId: input.propertyId, documentId: input.documentId || null, question: input.question.trim(), answer: input.answer.trim(), category: input.category.trim() || "General", createdBy: input.createdBy,
      claimKey: validation.claimKey, claimType: (input.claimType || "FACT").toUpperCase(), valueType: (input.valueType || "TEXT").toUpperCase(), currency: input.currency?.trim().toUpperCase() || null,
      effectiveAt: input.effectiveAt || new Date(), expiresAt: input.expiresAt || new Date(Date.now() + (input.refreshDays || 90) * 86400000), refreshDays: input.refreshDays || 90,
      version: (latest?.version || 0) + 1, validationStatus: validation.valid ? "VALID" : "INVALID", validationErrors: validation.errors,
      conflictStatus: conflictSummary ? "UNRESOLVED" : "CLEAR", conflictSummary, status: validation.valid ? (conflictSummary ? "CONFLICT" : "VALIDATED") : "INVALID"
    } });
    if (input.gapId) await tx.knowledgeGap.updateMany({ where: { id: input.gapId, propertyId: input.propertyId }, data: { resolutionEntryId: entry.id, status: "RESOLVED" } });
    return entry;
  });
}

export async function stageDocumentAtomicClaims(input: { propertyId: string; documentId: string; createdBy: string; claims: Array<{ question: string; answer: string; category: string; claimType: string; valueType: string; currency: string | null; refreshDays: number }> }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const document = await db.knowledgeDocument.findFirst({ where: { id: input.documentId, propertyId: input.propertyId }, select: { id: true } });
  if (!document) throw new Error("Trusted source document not found in this workspace.");
  const existing = await db.knowledgeEntry.count({ where: { documentId: document.id } });
  if (existing) throw new Error("This source has already been structured. Review its existing staged claims.");
  const entries = [];
  for (const claim of input.claims.slice(0, 100)) entries.push(await createAtomicClaim({ ...claim, propertyId: input.propertyId, documentId: document.id, createdBy: input.createdBy }));
  return entries;
}

export async function fieldApproveClaim(input: { propertyId: string; entryId: string; actorEmail: string; supersedesId?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const entry = await db.knowledgeEntry.findFirst({ where: { id: input.entryId, propertyId: input.propertyId } });
  if (!entry) throw new Error("Knowledge claim not found.");
  if (entry.validationStatus !== "VALID") throw new Error(`Automated verification failed: ${entry.validationErrors.join(", ")}`);
  if (entry.conflictStatus === "UNRESOLVED" && !input.supersedesId) throw new Error("Unresolved conflicts cannot be bypassed. Select the version this claim supersedes.");
  if (input.supersedesId) {
    const prior = await db.knowledgeEntry.findFirst({ where: { id: input.supersedesId, propertyId: input.propertyId, claimKey: entry.claimKey || undefined } });
    if (!prior) throw new Error("The superseded claim must belong to the same workspace and claim key.");
  }
  return db.knowledgeEntry.update({ where: { id: entry.id }, data: { status: "FIELD_APPROVED", fieldApprovedBy: input.actorEmail, fieldApprovedAt: new Date(), lastConfirmedAt: new Date(), supersedesId: input.supersedesId || null, conflictStatus: "CLEAR", conflictSummary: null } });
}

export async function generateClaimPreview(input: { propertyId: string; entryId: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const entry = await db.knowledgeEntry.findFirst({ where: { id: input.entryId, propertyId: input.propertyId } });
  if (!entry || entry.status !== "FIELD_APPROVED") throw new Error("Field-level approval is required before preview generation.");
  const preview = await db.knowledgePreview.create({ data: { propertyId: entry.propertyId, entryId: entry.id, question: entry.question, generatedAnswer: entry.answer } });
  await db.knowledgeEntry.update({ where: { id: entry.id }, data: { status: "PREVIEW_PENDING" } });
  return preview;
}

export async function reviewClaimPreview(input: { propertyId: string; previewId: string; actorEmail: string; approve: boolean; reason?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const preview = await db.knowledgePreview.findFirst({ where: { id: input.previewId, propertyId: input.propertyId }, include: { entry: true } });
  if (!preview || preview.status !== "PENDING") throw new Error("Pending preview not found.");
  if (!input.approve) {
    return db.$transaction(async (tx) => {
      const reviewed = await tx.knowledgePreview.update({ where: { id: preview.id }, data: { status: "REJECTED", rejectedReason: input.reason?.slice(0, 1000) || "Client requested correction." } });
      await tx.knowledgeEntry.update({ where: { id: preview.entryId }, data: { status: "VALIDATED", previewApprovedBy: null, previewApprovedAt: null } });
      return reviewed;
    });
  }
  return db.$transaction(async (tx) => {
    if (preview.entry.supersedesId) await tx.knowledgeEntry.update({ where: { id: preview.entry.supersedesId }, data: { status: "SUPERSEDED", pausedAt: new Date(), pauseReason: `Superseded by claim version ${preview.entry.version}.` } });
    const reviewed = await tx.knowledgePreview.update({ where: { id: preview.id }, data: { status: "APPROVED", approvedBy: input.actorEmail, approvedAt: new Date() } });
    await tx.knowledgeEntry.update({ where: { id: preview.entryId }, data: { status: "PUBLISHED", previewApprovedBy: input.actorEmail, previewApprovedAt: new Date(), publishedAt: new Date(), pausedAt: null, pauseReason: null } });
    return reviewed;
  });
}

export async function pauseClaim(input: { propertyId: string; entryId: string; actorEmail: string; reason: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const result = await db.knowledgeEntry.updateMany({ where: { id: input.entryId, propertyId: input.propertyId }, data: { status: "PAUSED", pausedAt: new Date(), pauseReason: input.reason.slice(0, 1000) } });
  if (!result.count) throw new Error("Knowledge claim not found.");
  return { paused: true, actorEmail: input.actorEmail };
}

export async function deleteUnpublishedClaim(input: { propertyId: string; entryId: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const entry = await db.knowledgeEntry.findFirst({ where: { id: input.entryId, propertyId: input.propertyId } });
  if (!entry) throw new Error("Knowledge claim not found.");
  if (["PUBLISHED", "APPROVED"].includes(entry.status)) throw new Error("Published knowledge must be paused and superseded; it cannot be silently deleted.");
  return db.knowledgeEntry.delete({ where: { id: entry.id } });
}

export async function reconfirmClaim(input: { propertyId: string; entryId: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const entry = await db.knowledgeEntry.findFirst({ where: { id: input.entryId, propertyId: input.propertyId } });
  if (!entry || !entry.previewApprovedAt) throw new Error("Preview approval is required before re-confirmation.");
  const openFlags = await db.knowledgeAnswerFlag.count({ where: { entryId: entry.id, status: { in: ["OPEN", "ACKNOWLEDGED"] } } });
  if (openFlags || entry.conflictStatus !== "CLEAR") throw new Error("Resolve open flags and conflicts before re-confirming this claim.");
  const now = new Date();
  return db.knowledgeEntry.update({ where: { id: entry.id }, data: { status: "PUBLISHED", lastConfirmedAt: now, fieldApprovedBy: input.actorEmail, fieldApprovedAt: now, expiresAt: new Date(now.getTime() + entry.refreshDays * 86400000), pausedAt: null, pauseReason: null } });
}

export async function flagKnowledgeAnswer(input: { propertyId: string; entryId?: string | null; evidenceId?: string | null; reporterType: string; reporterId?: string | null; reason: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  if (input.reason.trim().length < 4) throw new Error("Explain what appears incorrect.");
  return db.$transaction(async (tx) => {
    const property = await tx.property.findUnique({ where: { id: input.propertyId }, select: { organizationId: true } });
    if (!property) throw new Error("Knowledge workspace not found.");
    const organizationId = property.organizationId;
    if (!organizationId) throw new Error("Knowledge workspace is not attached to an organization.");
    if (input.entryId) await tx.knowledgeEntry.updateMany({ where: { id: input.entryId, propertyId: input.propertyId, status: { in: ["PUBLISHED", "APPROVED"] } }, data: { status: "PAUSED", pausedAt: new Date(), pauseReason: "Answer flagged for review." } });
    const flag = await tx.knowledgeAnswerFlag.create({ data: { propertyId: input.propertyId, entryId: input.entryId || null, evidenceId: input.evidenceId || null, reporterType: input.reporterType, reporterId: input.reporterId || null, reason: input.reason.trim().slice(0, 2000), acknowledgeDueAt: new Date(Date.now() + 2 * 3600000), resolveDueAt: new Date(Date.now() + 24 * 3600000) } });
    await tx.supportTicket.create({ data: { organizationId, reference: `KBF-${flag.id}`, subject: `Knowledge flag ${flag.id}`, category: "KNOWLEDGE_ACCURACY", priority: "HIGH", description: `Incorrect-fact flag requires acknowledgment within two hours and resolution within 24 hours.\n\n${flag.reason}`, createdByEmail: input.reporterId || "system@aifrogi.com" } });
    await tx.onboardingActivity.create({ data: { organizationId, actorEmail: input.reporterId || "system@aifrogi.com", action: "KNOWLEDGE_FLAG_OPENED", detail: `Flag ${flag.id}; acknowledge by ${flag.acknowledgeDueAt.toISOString()}; resolve by ${flag.resolveDueAt.toISOString()}.` } });
    return flag;
  });
}

export async function processKnowledgeFlagSla(now = new Date()) {
  const db = getDb();
  if (!db) return { acknowledgmentOverdue: 0, resolutionOverdue: 0, escalated: 0 };
  const flags = await db.knowledgeAnswerFlag.findMany({
    where: { status: { in: ["OPEN", "ACKNOWLEDGED"] }, OR: [{ acknowledgeDueAt: { lte: now }, acknowledgedAt: null }, { resolveDueAt: { lte: now } }] },
    include: { property: { select: { organizationId: true } } },
    take: 250
  });
  let acknowledgmentOverdue = 0;
  let resolutionOverdue = 0;
  let escalated = 0;
  const day = now.toISOString().slice(0, 10);
  for (const flag of flags) {
    const organizationId = flag.property.organizationId;
    if (!organizationId) continue;
    const action = !flag.acknowledgedAt && flag.acknowledgeDueAt <= now ? "KNOWLEDGE_FLAG_ACK_OVERDUE" : "KNOWLEDGE_FLAG_RESOLUTION_OVERDUE";
    if (action === "KNOWLEDGE_FLAG_ACK_OVERDUE") acknowledgmentOverdue += 1;
    else resolutionOverdue += 1;
    const detailKey = `${flag.id}:${day}`;
    const alreadyRecorded = await db.onboardingActivity.findFirst({ where: { organizationId, action, detail: { contains: detailKey } }, select: { id: true } });
    if (alreadyRecorded) continue;
    await db.$transaction([
      db.supportTicket.updateMany({ where: { organizationId, reference: `KBF-${flag.id}`, status: { notIn: ["RESOLVED", "CLOSED"] } }, data: { priority: "URGENT" } }),
      db.onboardingActivity.create({ data: { organizationId, actorEmail: "system@aifrogi.com", action, detail: `${detailKey}; claim remains paused; daily escalation continues until authorised resolution.` } })
    ]);
    escalated += 1;
  }
  return { acknowledgmentOverdue, resolutionOverdue, escalated };
}

export async function reviewAnswerFlag(input: { propertyId: string; flagId: string; actorEmail: string; action: "ACKNOWLEDGE" | "RESOLVE"; resolution?: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const flag = await db.knowledgeAnswerFlag.findFirst({ where: { id: input.flagId, propertyId: input.propertyId } });
  if (!flag) throw new Error("Flag not found.");
  return db.knowledgeAnswerFlag.update({ where: { id: flag.id }, data: input.action === "ACKNOWLEDGE" ? { status: "ACKNOWLEDGED", acknowledgedAt: new Date(), acknowledgedBy: input.actorEmail } : { status: "RESOLVED", resolvedAt: new Date(), resolvedBy: input.actorEmail, resolution: input.resolution?.slice(0, 2000) || "Reviewed and resolved." } });
}

export async function getKnowledgeVerificationReadiness(propertyId: string, category: string) {
  const db = getDb();
  if (!db) return { frameworkVersion: KB_FRAMEWORK_VERSION, coverage: calculateCoverage(category, []), published: 0, fresh: 0, freshnessRate: 0, conflicts: 0, unsigned: 0, openFlags: 0, previewPending: 0, ready: false };
  await expirePublishedClaims(propertyId);
  const [claims, conflicts, unsigned, openFlags, previewPending] = await Promise.all([
    db.knowledgeEntry.findMany({ where: { propertyId, status: "PUBLISHED" }, select: { question: true, answer: true, category: true, expiresAt: true } }),
    db.knowledgeEntry.count({ where: { propertyId, conflictStatus: "UNRESOLVED", status: { notIn: ["REJECTED", "SUPERSEDED"] } } }),
    db.knowledgeEntry.count({ where: { propertyId, status: "PUBLISHED", OR: [{ fieldApprovedAt: null }, { previewApprovedAt: null }] } }),
    db.knowledgeAnswerFlag.count({ where: { propertyId, status: { in: ["OPEN", "ACKNOWLEDGED"] } } }),
    db.knowledgePreview.count({ where: { propertyId, status: "PENDING" } })
  ]);
  const fresh = claims.filter((claim) => !claim.expiresAt || claim.expiresAt > new Date()).length;
  const freshnessRate = claims.length ? Math.round((fresh / claims.length) * 100) : 0;
  const coverage = calculateCoverage(category, claims);
  return { frameworkVersion: KB_FRAMEWORK_VERSION, coverage, published: claims.length, fresh, freshnessRate, conflicts, unsigned, openFlags, previewPending, ready: coverage.percentage >= KB_MINIMUM_COVERAGE && freshnessRate >= KB_FRESHNESS_TARGET && conflicts === 0 && unsigned === 0 && openFlags === 0 && previewPending === 0 };
}

export async function getPublishedClaimContext(propertySlug: string, question: string) {
  const db = getDb();
  if (!db) return { context: "", claimIds: [] as string[], blockedState: null as null | "CONFLICT" | "FLAGGED" | "EXPIRED" | "PAUSED" };
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true } });
  if (!property) return { context: "", claimIds: [] as string[], blockedState: null as null | "CONFLICT" | "FLAGGED" | "EXPIRED" | "PAUSED" };
  await expirePublishedClaims(property.id);
  const search = question.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2);
  const claims = await db.knowledgeEntry.findMany({ where: { propertyId: property.id, status: { in: ["PUBLISHED", "APPROVED"] }, conflictStatus: { not: "UNRESOLVED" }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, take: 100 });
  const ranked = claims.map((claim) => ({ claim, score: search.filter((term) => `${claim.question} ${claim.answer} ${claim.category}`.toLowerCase().includes(term)).length })).filter((item) => item.score > 0).sort((a,b)=>b.score-a.score).slice(0,8);
  const unavailable = await db.knowledgeEntry.findMany({ where: { propertyId: property.id, OR: [{ status: { in: ["PAUSED", "EXPIRED", "CONFLICT"] } }, { conflictStatus: "UNRESOLVED" }] }, take: 100 });
  const blocked = unavailable.map((claim) => ({ claim, score: search.filter((term) => `${claim.question} ${claim.answer} ${claim.category}`.toLowerCase().includes(term)).length })).filter((item) => item.score > 0).sort((a,b)=>b.score-a.score)[0]?.claim;
  const blockedState = !blocked ? null : blocked.conflictStatus === "UNRESOLVED" || blocked.status === "CONFLICT" ? "CONFLICT" as const : blocked.status === "EXPIRED" ? "EXPIRED" as const : blocked.pauseReason?.toLowerCase().includes("flag") ? "FLAGGED" as const : "PAUSED" as const;
  return { context: ranked.map(({claim})=>`Approved atomic claim ${claim.claimKey || claim.id} v${claim.version}\nQuestion: ${claim.question}\nAnswer: ${claim.answer}\nEffective: ${claim.effectiveAt?.toISOString() || "not specified"}\nExpires: ${claim.expiresAt?.toISOString() || "not specified"}`).join("\n\n---\n\n").slice(0,9000), claimIds: ranked.map(({claim})=>claim.id), blockedState };
}
