import { createHash } from "node:crypto";
import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";

export const SOVEREIGN_EVALUATION_VERSION = "1.1" as const;
export const DEFAULT_MAX_CLARIFY_CYCLES = 2;

export type CollectedFact = {
  value: string;
  source: "CUSTOMER_EXPLICIT" | "CONSENTED_FORM";
  capturedAt: string;
};

export type SovereignResolutionState = {
  version: "1.1";
  activeIntentKey: string;
  intent: SovereignDecision["intent"];
  resolvedQuestion: string;
  clarifyCount: number;
  maxClarifyCycles: number;
  customerRepeatCount: number;
  assistantDuplicateCount: number;
  lastCustomerFingerprint: string;
  lastAnswerFingerprint: string;
  collectedFacts: Record<string, CollectedFact>;
  missingFields: string[];
  status: "ACTIVE" | "RESOLVED" | "ESCALATED" | "REFUSED";
  circuitBreakerTriggered: boolean;
  circuitBreakerReason: string | null;
  updatedAt: string;
};

function normalize(value: string) {
  return value.toLowerCase().replace(/https?:\/\/\S+/g, " url ").replace(/[^a-z0-9₹$%\s]/g, " ").replace(/\s+/g, " ").trim();
}

function fingerprint(value: string) {
  return createHash("sha256").update(normalize(value)).digest("hex").slice(0, 24);
}

function intentKey(decision: SovereignDecision) {
  return fingerprint(`${decision.intent}:${decision.resolvedQuestion}`);
}

function safeState(value: unknown): SovereignResolutionState | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Partial<SovereignResolutionState>;
  if (candidate.version !== "1.1" || typeof candidate.activeIntentKey !== "string") return null;
  return candidate as SovereignResolutionState;
}

function explicitFacts(question: string, consentedFacts: Record<string, string> = {}) {
  const capturedAt = new Date().toISOString();
  const facts: Record<string, CollectedFact> = {};
  const date = question.match(/\b(today|tomorrow|tonight|this (?:morning|afternoon|evening)|next (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/i)?.[0];
  if (date) facts.date = { value: date, source: "CUSTOMER_EXPLICIT", capturedAt };
  const topic = question.match(/\b(training|course|bootcamp|workshop|appointment|booking|reservation|room|website|automation|software|hotel|clinic|restaurant|property|product|order)\b/i)?.[0];
  if (topic) facts.topic = { value: topic, source: "CUSTOMER_EXPLICIT", capturedAt };
  for (const [key, value] of Object.entries(consentedFacts)) {
    if (value.trim()) facts[key] = { value: value.trim().slice(0, 120), source: "CONSENTED_FORM", capturedAt };
  }
  return facts;
}

function circuitBreakerAnswer(reason: string) {
  if (reason === "CUSTOMER_REPEAT") return "I can see that this request is still unresolved, so I will not repeat the same answer or question. I’m preserving the details already provided and requesting Webtechnosys team assistance for the next step.";
  if (reason === "DUPLICATE_RESPONSE") return "I do not have enough new approved information to improve that answer, so I will not repeat it. I’m preserving the current context and requesting Webtechnosys team assistance.";
  return "I have reached the safe clarification limit without enough verified information to resolve this confidently. I’m preserving what you already provided and requesting Webtechnosys team assistance.";
}

export function governResolutionOutcome(input: {
  question: string;
  answer: string;
  decision: SovereignDecision;
  previousState?: unknown;
  maxClarifyCycles?: number;
  consentedFacts?: Record<string, string>;
}) {
  const previous = safeState(input.previousState);
  const currentIntentKey = intentKey(input.decision);
  const continuesIntent = Boolean(previous && (input.decision.contextUsed || previous.activeIntentKey === currentIntentKey) && previous.status === "ACTIVE");
  const customerFingerprint = fingerprint(input.question);
  const answerFingerprint = fingerprint(input.answer);
  const repeatedCustomer = Boolean(continuesIntent && previous?.lastCustomerFingerprint === customerFingerprint);
  const unresolved = ["CLARIFY", "FALLBACK"].includes(input.decision.disposition);
  const repeatedAnswer = Boolean(unresolved && continuesIntent && previous?.lastAnswerFingerprint === answerFingerprint);
  const clarifyCount = unresolved ? (continuesIntent ? previous!.clarifyCount : 0) + 1 : 0;
  const maxClarifyCycles = Math.max(0, input.maxClarifyCycles ?? previous?.maxClarifyCycles ?? DEFAULT_MAX_CLARIFY_CYCLES);
  const breakerReason = repeatedCustomer ? "CUSTOMER_REPEAT" : repeatedAnswer ? "DUPLICATE_RESPONSE" : clarifyCount >= maxClarifyCycles && unresolved ? "CLARIFY_LIMIT" : null;
  const circuitBreakerTriggered = Boolean(breakerReason);
  const decision: SovereignDecision = circuitBreakerTriggered
    ? { ...input.decision, disposition: "ESCALATE", reason: `Bounded Resolution circuit breaker: ${breakerReason}.` }
    : input.decision;
  const answer = circuitBreakerTriggered ? circuitBreakerAnswer(breakerReason!) : input.answer;
  const status: SovereignResolutionState["status"] = circuitBreakerTriggered || decision.disposition === "ESCALATE"
    ? "ESCALATED"
    : decision.disposition === "REFUSE" ? "REFUSED" : unresolved ? "ACTIVE" : "RESOLVED";
  const state: SovereignResolutionState = {
    version: "1.1",
    activeIntentKey: currentIntentKey,
    intent: decision.intent,
    resolvedQuestion: decision.resolvedQuestion,
    clarifyCount,
    maxClarifyCycles,
    customerRepeatCount: continuesIntent ? (previous?.customerRepeatCount || 0) + (repeatedCustomer ? 1 : 0) : 0,
    assistantDuplicateCount: continuesIntent ? (previous?.assistantDuplicateCount || 0) + (repeatedAnswer ? 1 : 0) : 0,
    lastCustomerFingerprint: customerFingerprint,
    lastAnswerFingerprint: fingerprint(answer),
    collectedFacts: { ...(continuesIntent ? previous?.collectedFacts : {}), ...explicitFacts(input.question, input.consentedFacts) },
    missingFields: unresolved ? previous?.missingFields || [] : [],
    status,
    circuitBreakerTriggered,
    circuitBreakerReason: breakerReason,
    updatedAt: new Date().toISOString()
  };
  return { answer, decision, state };
}
