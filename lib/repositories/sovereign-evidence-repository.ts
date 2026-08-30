import { getDb } from "@/lib/db";
import type { KnowledgeSourceEvidence } from "@/lib/services/website-knowledge-service";
import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";

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
}) {
  const db = getDb();
  if (!db) return null;
  const knowledgeAsOf = input.knowledgeAsOf ? new Date(input.knowledgeAsOf) : null;
  return db.sovereignAnswerEvidence.create({ data: {
    propertyId: input.propertyId, leadId: input.leadId || null, sessionIdHash: input.sessionIdHash,
    constitutionVersion: input.decision.constitutionVersion, blueprintVersion: input.decision.blueprintVersion,
    intent: input.decision.intent, disposition: input.decision.disposition, contextUsed: input.decision.contextUsed,
    decisionReason: input.decision.reason, question: input.question.slice(0, 1200), resolvedQuestion: input.decision.resolvedQuestion.slice(0, 1200),
    answer: input.answer.slice(0, 5000), grounded: input.grounded, model: input.model.slice(0, 120), sources: input.sources,
    knowledgeAsOf: knowledgeAsOf && !Number.isNaN(knowledgeAsOf.getTime()) ? knowledgeAsOf : null
  } });
}

export async function getSovereignIntelligenceReport() {
  const db = getDb();
  if (!db) return { total: 0, grounded: 0, fallback: 0, escalated: 0, offTopic: 0, contextual: 0, recent: [] };
  const [total, grounded, fallback, escalated, offTopic, contextual, recent] = await Promise.all([
    db.sovereignAnswerEvidence.count(),
    db.sovereignAnswerEvidence.count({ where: { grounded: true } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "FALLBACK" } }),
    db.sovereignAnswerEvidence.count({ where: { disposition: "ESCALATE" } }),
    db.sovereignAnswerEvidence.count({ where: { intent: "OFF_TOPIC" } }),
    db.sovereignAnswerEvidence.count({ where: { contextUsed: true } }),
    db.sovereignAnswerEvidence.findMany({ include: { property: { select: { name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 30 })
  ]);
  return { total, grounded, fallback, escalated, offTopic, contextual, recent };
}
