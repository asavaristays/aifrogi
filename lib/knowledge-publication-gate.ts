import { validateAtomicClaim } from "@/lib/knowledge-verification";
import { validateGeneratedClaims } from "@/lib/sovereign-intelligence/claim-validator";
import { runSovereignCommonEvaluation, scoreSovereignEvaluation } from "@/lib/sovereign-intelligence/evaluation";

export const KNOWLEDGE_PUBLICATION_GATE_VERSION = "1.0" as const;

export function runKnowledgePublicationGate(input: { question: string; answer: string; category: string; claimType?: string; valueType?: string; currency?: string | null; effectiveAt?: Date | null; expiresAt?: Date | null; refreshDays?: number }) {
  const atomic = validateAtomicClaim(input);
  const output = validateGeneratedClaims({ answer: input.answer, approvedContext: `Question: ${input.question}\nApproved answer: ${input.answer}`, connectorVerified: false });
  const common = scoreSovereignEvaluation(runSovereignCommonEvaluation());
  const failures = [
    ...atomic.errors.map((error) => `ATOMIC_${error}`),
    ...output.violations.map((violation) => `OUTPUT_${violation}`),
    ...(common.releasePassed ? [] : ["COMMON_SOVEREIGN_SUITE_FAILED"])
  ];
  return {
    version: KNOWLEDGE_PUBLICATION_GATE_VERSION,
    passed: failures.length === 0,
    failures,
    affectedScope: ["ATOMIC_CLAIM", `CATEGORY_${input.category.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_") || "GENERAL"}`, "COMMON_SOVEREIGN_RUNTIME"],
    commonSuite: { version: common.suiteVersion, passed: common.passed, total: common.total, srr: common.srr, zeroTolerancePassed: common.zeroTolerancePassed }
  };
}
