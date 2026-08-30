import { getDb } from "@/lib/db";
import type { KnowledgeSourceEvidence } from "@/lib/services/website-knowledge-service";
import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";
import { SOVEREIGN_EVALUATION_VERSION } from "@/lib/sovereign-intelligence/resolution";
import type { ReliabilityEvidence } from "@/lib/reliability/runtime";

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
  reliability?: ReliabilityEvidence;
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
    knowledgeClaimIds: input.knowledgeClaimIds || [],
    failureLayer: input.reliability?.failureLayer || "NONE", failureCode: input.reliability?.failureCode || null,
    latencyMs: Math.max(0, Math.round(input.reliability?.latencyMs || 0)), attemptCount: Math.max(0, Math.round(input.reliability?.attemptCount || 0)),
    escalationTier: input.reliability?.escalationTier || "TIER_0_SELF_RESOLVE", degradedMode: Boolean(input.reliability?.degradedMode)
  } });
}

export async function getSovereignIntelligenceReport() {
  const db = getDb();
  if (!db) return { total: 0, grounded: 0, fallback: 0, escalated: 0, offTopic: 0, contextual: 0, circuitBreakers: 0, unresolved: 0, feedbackTotal: 0, helpfulFeedback: 0, helpfulRate: null as number | null, tier0: 0, tier1: 0, tier2: 0, tier3: 0, degraded: 0, failures: 0, averageLatencyMs: 0, automatedResolutionRate: null as number | null, supportCallsPerThousand: null as number | null, recent: [] };
  const [total, grounded, fallback, escalated, offTopic, contextual, circuitBreakers, unresolved, feedbackTotal, helpfulFeedback, tier0, tier1, tier2, tier3, degraded, failures, latency, recent] = await Promise.all([
    db.sovereignAnswerEvidence.count(),
    db.sovereignAnswerEvidence.count({ where: { grounded: true } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "FALLBACK" } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "ESCALATE" } }),
    db.sovereignAnswerEvidence.count({ where: { intent: "OFF_TOPIC" } }),
    db.sovereignAnswerEvidence.count({ where: { contextUsed: true } }),
    db.sovereignAnswerEvidence.count({ where: { circuitBreaker: true } }),
    db.sovereignAnswerEvidence.count({ where: { resolutionState: "ACTIVE" } }),
    db.sovereignAnswerFeedback.count(),
    db.sovereignAnswerFeedback.count({ where: { helpful: true } }),
    db.sovereignAnswerEvidence.count({ where: { escalationTier: "TIER_0_SELF_RESOLVE" } }),
    db.sovereignAnswerEvidence.count({ where: { escalationTier: "TIER_1_BUSINESS_ASYNC" } }),
    db.sovereignAnswerEvidence.count({ where: { escalationTier: "TIER_2_AIFROGI_ASYNC" } }),
    db.sovereignAnswerEvidence.count({ where: { escalationTier: "TIER_3_LIVE_CALL" } }),
    db.sovereignAnswerEvidence.count({ where: { degradedMode: true } }),
    db.sovereignAnswerEvidence.count({ where: { failureLayer: { not: "NONE" } } }),
    db.sovereignAnswerEvidence.aggregate({ _avg: { latencyMs: true } }),
    db.sovereignAnswerEvidence.findMany({ include: { property: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
  ]);
  const helpfulRate = feedbackTotal ? Number(((helpfulFeedback / feedbackTotal) * 100).toFixed(1)) : null;
  const automatedResolutionRate = total ? Number(((tier0 / total) * 100).toFixed(1)) : null;
  const supportCallsPerThousand = total ? Number(((tier3 / total) * 1000).toFixed(2)) : null;
  return { total, grounded, fallback, escalated, offTopic, contextual, circuitBreakers, unresolved, feedbackTotal, helpfulFeedback, helpfulRate, tier0, tier1, tier2, tier3, degraded, failures, averageLatencyMs: Math.round(latency._avg.latencyMs || 0), automatedResolutionRate, supportCallsPerThousand, recent };
}
