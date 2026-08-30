import { getDb } from "@/lib/db";
import type { KnowledgeSourceEvidence } from "@/lib/services/website-knowledge-service";
import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";
import { SOVEREIGN_EVALUATION_VERSION } from "@/lib/sovereign-intelligence/resolution";

export async function recordSovereignAnswerEvidence(input: {
  propertyId: string;
  leadId?: string | null;
  sessionIdHash: string;
  question: string;
  answer: string;
  decision: SovereignDecision;
  grounded: boolean;
  model: string;
  sources: KnowledgeSourceEvidence[];
  knowledgeAsOf?: string | null;
  confidence?: number;
  safetyClassification?: string;
  permittedOperation?: string;
  resolutionState?: string;
  clarifyCount?: number;
  circuitBreaker?: boolean;
  circuitBreakerReason?: string | null;
  knowledgeClaimIds?: string[];
}) {
  const db = getDb();
  if (!db) return null;
  const knowledgeAsOf = input.knowledgeAsOf ? new Date(input.knowledgeAsOf) : null;
  return db.sovereignAnswerEvidence.create({ data: {
    propertyId: input.propertyId, leadId: input.leadId || null, sessionIdHash: input.sessionIdHash,
    constitutionVersion: input.decision.constitutionVersion, blueprintVersion: input.decision.blueprintVersion,
    intent: input.decision.intent, disposition: input.decision.disposition, contextUsed: input.decision.contextUsed,
    confidence: Math.max(0, Math.min(1, input.confidence || 0)), safetyClassification: input.safetyClassification || "STANDARD",
    permittedOperation: input.permittedOperation || input.decision.disposition, resolutionState: input.resolutionState || "RESOLVED",
    clarifyCount: Math.max(0, input.clarifyCount || 0), circuitBreaker: Boolean(input.circuitBreaker), circuitBreakerReason: input.circuitBreakerReason || null,
    evaluationVersion: SOVEREIGN_EVALUATION_VERSION,
    decisionReason: input.decision.reason, question: input.question.slice(0, 1200), resolvedQuestion: input.decision.resolvedQuestion.slice(0, 1200),
    answer: input.answer.slice(0, 5000), grounded: input.grounded, model: input.model.slice(0, 120), sources: input.sources,
    knowledgeAsOf: knowledgeAsOf && !Number.isNaN(knowledgeAsOf.getTime()) ? knowledgeAsOf : null,
    knowledgeClaimIds: input.knowledgeClaimIds || []
  } });
}

export async function getSovereignIntelligenceReport() {
  const db = getDb();
  if (!db) return { total: 0, grounded: 0, fallback: 0, escalated: 0, offTopic: 0, contextual: 0, circuitBreakers: 0, unresolved: 0, recent: [] };
  const [total, grounded, fallback, escalated, offTopic, contextual, circuitBreakers, unresolved, recent] = await Promise.all([
    db.sovereignAnswerEvidence.count(),
    db.sovereignAnswerEvidence.count({ where: { grounded: true } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "FALLBACK" } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "ESCALATE" } }),
    db.sovereignAnswerEvidence.count({ where: { intent: "OFF_TOPIC" } }),
    db.sovereignAnswerEvidence.count({ where: { contextUsed: true } }),
    db.sovereignAnswerEvidence.count({ where: { circuitBreaker: true } }),
    db.sovereignAnswerEvidence.count({ where: { resolutionState: "ACTIVE" } }),
    db.sovereignAnswerEvidence.findMany({ include: { property: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
  ]);
  return { total, grounded, fallback, escalated, offTopic, contextual, circuitBreakers, unresolved, recent };
}
