/**
 * Versioned, deterministic readiness contract. R1 stores the contract next
 * to the queue so later scanners cannot silently reinterpret old evidence.
 */
export const AI_READINESS_RUBRIC_V1 = "ai-readiness-r1.0";

export const READINESS_PILLARS = {
  READABLE_DATA: "READABLE_DATA",
  SERVE_THE_HUMAN: "SERVE_THE_HUMAN"
} as const;

export type ReadinessPillar = (typeof READINESS_PILLARS)[keyof typeof READINESS_PILLARS];
export type ReadinessCheckStatus = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE" | "NOT_APPLICABLE";

export type ReadinessCheckDefinition = {
  key: string;
  pillar: ReadinessPillar;
  title: string;
  requiredEvidence: string;
  freshnessDays: number;
  autoFixAllowed: false;
};

/**
 * These definitions are metadata only in R1. R2 introduces the deterministic
 * fetch/parser implementations; adding a definition cannot change a live bot.
 */
export const AI_READINESS_R1_CHECKS: readonly ReadinessCheckDefinition[] = [
  {
    key: "readable_data.public_source_permitted",
    pillar: READINESS_PILLARS.READABLE_DATA,
    title: "Public source is permitted to scan",
    requiredEvidence: "Permitted public URL and crawl-policy decision",
    freshnessDays: 7,
    autoFixAllowed: false
  },
  {
    key: "readable_data.schema_syntax",
    pillar: READINESS_PILLARS.READABLE_DATA,
    title: "Hotel schema is valid and parseable",
    requiredEvidence: "Captured JSON-LD syntax result",
    freshnessDays: 30,
    autoFixAllowed: false
  },
  {
    key: "readable_data.canonical_identity",
    pillar: READINESS_PILLARS.READABLE_DATA,
    title: "Public identity matches approved facts",
    requiredEvidence: "Canonical fact comparison for name, address and phone",
    freshnessDays: 30,
    autoFixAllowed: false
  },
  {
    key: "readable_data.booking_link_health",
    pillar: READINESS_PILLARS.READABLE_DATA,
    title: "Booking link resolves safely",
    requiredEvidence: "Bounded, non-transactional HTTP result",
    freshnessDays: 7,
    autoFixAllowed: false
  },
  {
    key: "serve_human.golden_bank_current",
    pillar: READINESS_PILLARS.SERVE_THE_HUMAN,
    title: "Golden Bank is current",
    requiredEvidence: "Current approved bank and source revision",
    freshnessDays: 1,
    autoFixAllowed: false
  },
  {
    key: "serve_human.grounded_answer_evidence",
    pillar: READINESS_PILLARS.SERVE_THE_HUMAN,
    title: "Answers have approved grounding evidence",
    requiredEvidence: "Current certification and provenance evidence",
    freshnessDays: 1,
    autoFixAllowed: false
  }
] as const;

export function getReadinessCheck(key: string) {
  return AI_READINESS_R1_CHECKS.find((check) => check.key === key) ?? null;
}

export function isComparableReadinessScan(beforeRubricVersion: string, afterRubricVersion: string) {
  return Boolean(beforeRubricVersion) && beforeRubricVersion === afterRubricVersion;
}

/** Unknown evidence is deliberately not converted to a failure or score. */
export function displayReadinessStatus(status: ReadinessCheckStatus) {
  return status === "INSUFFICIENT_EVIDENCE" ? "Needs evidence" : status.replaceAll("_", " ");
}
