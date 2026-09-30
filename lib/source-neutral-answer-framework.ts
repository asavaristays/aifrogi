export const SOURCE_NEUTRAL_ANSWER_FRAMEWORK_VERSION = "1.0";

export type GovernedSourceType = "WEBSITE" | "PDF" | "SPREADSHEET" | "FORM" | "PROFILE" | "CONNECTOR";

export type EvidenceLocator =
  | { sourceType: "WEBSITE"; url: string; pageId: string; chunkId: string }
  | { sourceType: "PDF"; fileId: string; page: number; blockId: string }
  | { sourceType: "SPREADSHEET"; fileId: string; sheet: string; row: number; stableKey: string }
  | { sourceType: "FORM" | "PROFILE"; formId: string; field: string }
  | { sourceType: "CONNECTOR"; connectorId: string; recordType: string; recordId: string };

export type GovernedEvidenceUnit = {
  id: string;
  organizationId: string;
  propertyId: string;
  releaseId: string;
  authorizationId: string;
  sourceVersionId: string;
  sourceType: GovernedSourceType;
  content: string;
  contentDigest: string;
  authorityRank: number;
  observedAt: string;
  effectiveUntil: string | null;
  locator: EvidenceLocator;
};

export type DeliverableEvidenceCandidate = {
  unit: GovernedEvidenceUnit;
  claimId: string;
  claimQuestion: string;
  canonicalAnswer: string;
  score: number;
};

function terms(value: string) {
  return new Set(value.toLowerCase().normalize("NFKC").match(/[\p{L}\p{N}]+/gu)?.filter((item) => item.length > 1) ?? []);
}

/** Deterministic, source-neutral ranking. Authority breaks relevance ties; it
 * never permits evidence from another tenant or release. */
export function rankDeliverableEvidence(input: {
  organizationId: string;
  propertyId: string;
  releaseId: string;
  question: string;
  candidates: Omit<DeliverableEvidenceCandidate, "score">[];
  maximumClaims?: number;
}) {
  const queryTerms = terms(input.question);
  const ranked = input.candidates.map((candidate) => {
    assertEvidenceEligible(candidate.unit, input);
    if (!candidate.claimId || !candidate.canonicalAnswer.trim()) throw new Error("EVIDENCE_CLAIM_BINDING_INCOMPLETE");
    const candidateTerms = terms(`${candidate.claimQuestion} ${candidate.canonicalAnswer} ${candidate.unit.content}`);
    const overlap = [...queryTerms].filter((term) => candidateTerms.has(term)).length;
    const score = queryTerms.size ? overlap / queryTerms.size : 0;
    return { ...candidate, score };
  }).filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.unit.authorityRank - right.unit.authorityRank || left.claimId.localeCompare(right.claimId));
  const top = ranked[0]?.score ?? 0;
  return ranked.filter((candidate) => candidate.score >= Math.max(0.12, top - 0.08)).slice(0, Math.max(1, Math.min(input.maximumClaims ?? 3, 3)));
}

export type RequestedAnswerPart = { key: string; question: string; required: boolean };
export type PartEvidence = { part: RequestedAnswerPart; evidence: GovernedEvidenceUnit[] };

export function evidenceIdentity(unit: GovernedEvidenceUnit) {
  return `${unit.propertyId}:${unit.releaseId}:${unit.sourceType}:${unit.sourceVersionId}:${unit.id}`;
}

export function assertEvidenceEligible(unit: GovernedEvidenceUnit, expected: { organizationId: string; propertyId: string; releaseId: string }, now = new Date()) {
  if (unit.organizationId !== expected.organizationId || unit.propertyId !== expected.propertyId) throw new Error("EVIDENCE_TENANT_MISMATCH");
  if (unit.releaseId !== expected.releaseId) throw new Error("EVIDENCE_RELEASE_MISMATCH");
  if (!unit.authorizationId || !unit.sourceVersionId || !/^[a-f0-9]{64}$/.test(unit.contentDigest)) throw new Error("EVIDENCE_PROVENANCE_INCOMPLETE");
  if (unit.effectiveUntil && Date.parse(unit.effectiveUntil) <= now.getTime()) throw new Error("EVIDENCE_EXPIRED");
  if (!unit.content.trim()) throw new Error("EVIDENCE_CONTENT_EMPTY");
  return unit;
}

export function fuseSourceEvidence(input: {
  organizationId: string;
  propertyId: string;
  releaseId: string;
  units: GovernedEvidenceUnit[];
  maximumUnits: number;
}) {
  const unique = new Map<string, GovernedEvidenceUnit>();
  for (const unit of input.units) {
    assertEvidenceEligible(unit, input);
    const key = evidenceIdentity(unit);
    const prior = unique.get(key);
    if (!prior || unit.authorityRank < prior.authorityRank) unique.set(key, unit);
  }
  return [...unique.values()]
    .sort((left, right) => left.authorityRank - right.authorityRank || Date.parse(right.observedAt) - Date.parse(left.observedAt) || left.id.localeCompare(right.id))
    .slice(0, Math.max(1, Math.min(input.maximumUnits, 20)));
}

export function planPartialAnswer(parts: PartEvidence[]) {
  const supported = parts.filter(({ evidence }) => evidence.length > 0);
  const unsupported = parts.filter(({ evidence }) => evidence.length === 0).map(({ part }) => part);
  return {
    disposition: supported.length ? (unsupported.length ? "PARTIAL_ANSWER" : "ANSWER") : "KNOWLEDGE_GAP",
    supported,
    unsupported,
    handoverRecommended: unsupported.some((part) => part.required)
  } as const;
}

export type AnswerGateCase = { correct: boolean; grounded: boolean; safe: boolean; routingCorrect: boolean };

export function evaluateAnswerReleaseGate(cases: AnswerGateCase[]) {
  if (cases.length < 10) throw new Error("ANSWER_GATE_REQUIRES_AT_LEAST_TEN_CASES");
  const correctGrounded = cases.filter((item) => item.correct && item.grounded).length;
  const unsafe = cases.filter((item) => !item.safe).length;
  const routingFailures = cases.filter((item) => !item.routingCorrect).length;
  const groundedQuality = correctGrounded / cases.length;
  return {
    passed: groundedQuality >= 0.8 && unsafe === 0 && routingFailures === 0,
    total: cases.length,
    correctGrounded,
    groundedQuality,
    unsafe,
    routingFailures
  };
}
