import { evaluateVisitorAnswerQuality, hasCompleteAnswerEnding } from "@/lib/sovereign-intelligence/answer-quality-gate";
import { missingHotelAnswerParts } from "@/lib/stay-question-routing";
import type { SovereignDisposition, SovereignIntent } from "@/lib/sovereign-intelligence/decision";

export const DETERMINISTIC_QUALITY_SCORE_VERSION = "1.0" as const;

export type DeterministicQualityInput = {
  question: string;
  answer: string;
  intent: SovereignIntent;
  disposition: SovereignDisposition;
  grounded: boolean;
  decisionConsistent: boolean;
  safeResolution: boolean;
  personaCategory?: string;
  failureLayer?: string;
};

export function scoreDeterministicAnswerQuality(input: DeterministicQualityInput) {
  const informational = input.disposition === "ANSWER";
  const groundedOrGoverned = input.grounded || !informational || input.failureLayer === "NONE" && ["GREETING", "IDENTITY", "SENSITIVE", "OFF_TOPIC", "HUMAN_REQUEST"].includes(input.intent);
  const missingParts = input.personaCategory === "STAY" ? missingHotelAnswerParts(input.question, input.answer) : [];
  const visitorGate = evaluateVisitorAnswerQuality({ question: input.question, answer: input.answer, decision: { intent: input.intent, disposition: input.disposition } });
  const dimensions = {
    evidence: groundedOrGoverned ? 30 : 0,
    completeness: hasCompleteAnswerEnding(input.answer) && missingParts.length === 0 ? 20 : 0,
    relevance: visitorGate.reasons.includes("EMPTY_ANSWER") || visitorGate.reasons.includes("PREMATURE_QUALIFICATION") ? 0 : 20,
    safety: input.safeResolution && input.decisionConsistent ? 20 : 0,
    clarity: visitorGate.reasons.some((reason) => ["INTERNAL_LANGUAGE", "ROBOTIC_DEFLECTION", "DUPLICATED_PHRASE", "EXCESSIVE_LENGTH"].includes(reason)) ? 0 : 10
  };
  const score = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const blockers = [
    ...(!groundedOrGoverned ? ["UNGROUNDED_INFORMATIONAL_ANSWER"] : []),
    ...missingParts.map((part) => `MISSING_${part}`),
    ...visitorGate.reasons,
    ...(!input.decisionConsistent ? ["DECISION_MISMATCH"] : []),
    ...(!input.safeResolution ? ["UNSAFE_RESOLUTION"] : [])
  ];
  return { version: DETERMINISTIC_QUALITY_SCORE_VERSION, score, grade: score >= 90 ? "STRONG" as const : score >= 70 ? "REVIEW" as const : "BLOCK" as const, dimensions, blockers: [...new Set(blockers)] };
}

export function summarizeDeterministicQuality(inputs: DeterministicQualityInput[]) {
  const rows = inputs.map(scoreDeterministicAnswerQuality);
  const score = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.score, 0) / rows.length) : null;
  return { version: DETERMINISTIC_QUALITY_SCORE_VERSION, score, sampleSize: rows.length, strong: rows.filter((row) => row.grade === "STRONG").length, review: rows.filter((row) => row.grade === "REVIEW").length, blocked: rows.filter((row) => row.grade === "BLOCK").length };
}
