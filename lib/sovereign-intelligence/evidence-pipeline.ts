import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";

export const INTELLIGENCE_EVIDENCE_VERSION = "1.0";

export type RetrievalCandidate = {
  claimId: string;
  claimKey: string | null;
  score: number;
  selected: boolean;
  status: string;
};

const aliases: Record<string, string[]> = {
  appointment: ["booking", "book", "slot", "schedule"],
  booking: ["appointment", "book", "reservation", "reserve"],
  contact: ["phone", "email", "address", "location", "call"],
  cost: ["price", "pricing", "fee", "fees", "charges"],
  course: ["training", "class", "programme", "program"],
  hotel: ["room", "stay", "property", "accommodation"],
  location: ["address", "where", "map", "directions"],
  price: ["cost", "pricing", "fee", "fees", "charges"],
  training: ["course", "class", "programme", "program"],
};

const stopWords = new Set(["and", "are", "available", "can", "for", "from", "has", "have", "how", "into", "online", "our", "the", "this", "use", "what", "when", "where", "with", "your"]);

export function retrievalTerms(value: string) {
  const base = value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !stopWords.has(term));
  const expanded = new Set(base);
  for (const term of base) for (const alias of aliases[term] || []) expanded.add(alias);
  return [...expanded];
}

export function scoreRetrievalCandidate(question: string, claim: { question: string; answer: string; category?: string | null }) {
  const query = retrievalTerms(question);
  if (!query.length) return 0;
  const questionTerms = new Set(retrievalTerms(claim.question));
  const bodyTerms = new Set(retrievalTerms(`${claim.answer} ${claim.category || ""}`));
  const weighted = query.reduce((score, term) => score + (questionTerms.has(term) ? 2 : bodyTerms.has(term) ? 1 : 0), 0);
  return Number(Math.min(1, weighted / Math.max(2, query.length * 1.5)).toFixed(4));
}

export function inferUsedClaimIds(answer: string, candidates: Array<RetrievalCandidate & { answer?: string }>) {
  const answerTerms = new Set(retrievalTerms(answer));
  return candidates.filter((candidate) => {
    if (!candidate.selected || !candidate.answer) return false;
    const claimTerms = retrievalTerms(candidate.answer);
    const overlap = claimTerms.filter((term) => answerTerms.has(term)).length;
    return overlap >= 2 && overlap / Math.max(1, Math.min(claimTerms.length, answerTerms.size)) >= 0.12;
  }).map((candidate) => candidate.claimId);
}

export type FailureClassification = "NONE" | "RETRIEVAL_MISS" | "GROUNDED_WRONG" | "UNGROUNDED_GENERATION" | "CONNECTOR_FAILURE" | "CONVERSATION_STATE" | "INFRASTRUCTURE_FAILURE" | "SAFE_ESCALATION";

export function classifyEvidenceFailure(input: {
  decision: Pick<SovereignDecision, "disposition" | "intent">;
  grounded: boolean;
  failureLayer?: string | null;
  nearMissClaimIds?: string[];
  circuitBreaker?: boolean;
  decisionConsistent?: boolean;
}): FailureClassification {
  if (input.failureLayer === "CONNECTOR") return "CONNECTOR_FAILURE";
  if (input.failureLayer === "INFRASTRUCTURE" || input.failureLayer === "MODEL") return input.grounded ? "GROUNDED_WRONG" : "INFRASTRUCTURE_FAILURE";
  if (input.circuitBreaker || input.failureLayer === "CONVERSATION_STATE") return "CONVERSATION_STATE";
  if (!input.grounded && input.nearMissClaimIds?.length) return "RETRIEVAL_MISS";
  if (input.decision.disposition === "ANSWER" && !input.grounded && !["GREETING", "IDENTITY", "OFF_TOPIC", "CONTACT_INFO"].includes(input.decision.intent)) return "UNGROUNDED_GENERATION";
  if (["ESCALATE", "REFUSE", "CLARIFY", "FALLBACK"].includes(input.decision.disposition)) return "SAFE_ESCALATION";
  if (input.decisionConsistent === false) return "CONVERSATION_STATE";
  return "NONE";
}

export function isSafeResolution(input: { classification: FailureClassification; decisionConsistent: boolean; disposition: string; grounded: boolean; intent: string }) {
  if (!input.decisionConsistent) return false;
  if (["RETRIEVAL_MISS", "GROUNDED_WRONG", "UNGROUNDED_GENERATION", "CONNECTOR_FAILURE", "CONVERSATION_STATE", "INFRASTRUCTURE_FAILURE"].includes(input.classification)) return false;
  if (input.disposition === "ANSWER") return input.grounded || ["GREETING", "IDENTITY", "OFF_TOPIC", "CONTACT_INFO"].includes(input.intent);
  return ["CLARIFY", "ESCALATE", "REFUSE", "FALLBACK"].includes(input.disposition);
}

export function anonymizeReplayText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[EMAIL]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g, "[PHONE]")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/\b(?:otp|password|pin)\s*[:=-]?\s*\S+/gi, "[REDACTED]")
    .trim()
    .slice(0, 1200);
}
