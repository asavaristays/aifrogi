import type { SovereignDisposition } from "@/lib/sovereign-intelligence/decision";

export type ObservedBehavior = "ANSWER" | "CLARIFY" | "REFUSE" | "ESCALATE" | "FALLBACK" | "ACT";

export function evaluateDecisionBehaviourConsistency(input: { disposition: SovereignDisposition; answer: string; resolutionState: string; circuitBreaker: boolean; actionPerformed?: boolean; failureLayer?: string }) {
  const text = input.answer.toLowerCase();
  let observed: ObservedBehavior;
  if (input.actionPerformed) observed = "ACT";
  else if (input.circuitBreaker || input.resolutionState === "ESCALATED") observed = "ESCALATE";
  else if (input.resolutionState === "REFUSED" || /i.m focused on .* so i don.t provide|outside (my|the) business scope/.test(text)) observed = "REFUSE";
  else if (input.failureLayer && input.failureLayer !== "NONE" && /withheld|could not validate|temporarily unavailable|do not have enough approved/.test(text)) observed = "FALLBACK";
  else if (input.resolutionState === "ACTIVE" && /please provide|which|what|when|before i use/.test(text)) observed = "CLARIFY";
  else observed = "ANSWER";
  const compatible: Record<ObservedBehavior, SovereignDisposition[]> = { ANSWER: ["ANSWER"], CLARIFY: ["CLARIFY"], REFUSE: ["REFUSE"], ESCALATE: ["ESCALATE"], FALLBACK: ["FALLBACK"], ACT: ["ANSWER"] };
  const consistent = compatible[observed].includes(input.disposition);
  return { observedBehavior: observed, decisionConsistent: consistent, consistencyReason: consistent ? `Observed ${observed} is compatible with declared ${input.disposition}.` : `Observed ${observed} conflicts with declared ${input.disposition}.` };
}
