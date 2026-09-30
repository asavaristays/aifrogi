import { canonicalFactsRequired } from "./canonical-serving-gate";
import type { MaterialClaimDecision } from "./sovereign-intelligence/claim-validator";
import { resolveSourceAuthority, type AuthorityCandidate } from "./source-authority-resolution";

export type CanonicalChannel = "WEBSITE" | "WHATSAPP" | "EMAIL" | "INSTAGRAM" | "API" | "VOICE";

export function assertCanonicalFactualEnvelope(input: {
  channel: CanonicalChannel;
  factual: boolean;
  answer: string;
  claimIds?: string[];
  crawlGenerationId?: string;
  chunkIds?: string[];
  materialClaimDecisions?: MaterialClaimDecision[];
  sourceAuthority?: { candidates: AuthorityCandidate[]; behavior: "FAIL_CLOSED" | "AUTHORITY_ORDER" | "DISCLOSE_AND_HANDOVER" };
}, env: NodeJS.ProcessEnv = process.env) {
  if (!canonicalFactsRequired(env) || !input.factual) return { required: false as const };
  if (!input.answer.trim()) throw new Error("CANONICAL_CHANNEL_ANSWER_EMPTY");
  const claimEvidence = Boolean(input.claimIds?.length);
  const crawlEvidence = Boolean(input.crawlGenerationId && input.chunkIds?.length);
  if (claimEvidence === crawlEvidence) throw new Error("CANONICAL_CHANNEL_EVIDENCE_AMBIGUOUS");
  if (crawlEvidence && (!input.materialClaimDecisions?.length || input.materialClaimDecisions.some(decision => !decision.supported || !input.answer.includes(decision.claim)))) {
    throw new Error("CANONICAL_CHANNEL_CLAIM_COVERAGE_INVALID");
  }
  if (input.sourceAuthority && input.sourceAuthority.candidates.length > 1) {
    const authority = resolveSourceAuthority(input.sourceAuthority.candidates, input.sourceAuthority.behavior);
    if (authority.disposition !== "ANSWER" || !authority.selected) throw new Error("CANONICAL_SOURCE_CONFLICT_UNRESOLVED");
  }
  return { required: true as const, evidenceKind: claimEvidence ? "SEALED_CLAIMS" as const : "ACTIVE_CRAWL" as const };
}
