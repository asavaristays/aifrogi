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
  lastCustomerText: string;
  lastAnswerText: string;
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

export const CUSTOMER_SEMANTIC_REPEAT_THRESHOLD = 0.72;
export const ASSISTANT_SEMANTIC_REPEAT_THRESHOLD = 0.82;

function semanticTerms(value: string) {
  const stop = new Set(["a", "an", "and", "are", "can", "could", "do", "for", "i", "is", "it", "me", "my", "of", "please", "the", "to", "what", "would", "you", "your"]);
  return new Set(normalize(value).split(" ").filter((term) => term.length > 1 && !stop.has(term)));
}

export function semanticSimilarity(left: string, right: string) {
  const a = semanticTerms(left);
  const b = semanticTerms(right);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((term) => b.has(term)).length;
  return intersection / Math.max(a.size, b.size);
}

function requestedKnownSlot(answer: string, facts: Record<string, CollectedFact>) {
  const normalizedAnswer = normalize(answer);
  const requested = [
    ["name", /\b(?:your|customer) name\b|\bwhat name\b/],
    ["contact", /\b(?:mobile|phone|contact|email)(?: number| address)?\b/],
    ["date", /\b(?:which|what|preferred) (?:date|day)\b|\bwhen would\b/],
    ["topic", /\b(?:which|what) (?:service|course|room|appointment|product)\b/]
  ] as const;
  return requested.find(([slot, pattern]) => facts[slot] && pattern.test(normalizedAnswer))?.[0] || null;
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
  if (reason === "REDUNDANT_SLOT_REQUEST") return "I have retained the information already provided and will not ask for it again. I need the business team to continue from the saved details because I do not have enough verified information for the next step.";
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
  const semanticallyContinues = Boolean(previous && semanticSimilarity(previous.resolvedQuestion, input.decision.resolvedQuestion) >= CUSTOMER_SEMANTIC_REPEAT_THRESHOLD);
  const continuesIntent = Boolean(previous && (input.decision.contextUsed || previous.activeIntentKey === currentIntentKey || semanticallyContinues) && previous.status === "ACTIVE");
  const customerFingerprint = fingerprint(input.question);
  const answerFingerprint = fingerprint(input.answer);
  const repeatedCustomer = Boolean(continuesIntent && (previous?.lastCustomerFingerprint === customerFingerprint || semanticSimilarity(previous?.lastCustomerText || "", input.question) >= CUSTOMER_SEMANTIC_REPEAT_THRESHOLD));
  const unresolved = ["CLARIFY", "FALLBACK"].includes(input.decision.disposition);
  const repeatedAnswer = Boolean(unresolved && continuesIntent && (previous?.lastAnswerFingerprint === answerFingerprint || semanticSimilarity(previous?.lastAnswerText || "", input.answer) >= ASSISTANT_SEMANTIC_REPEAT_THRESHOLD));
  const collectedFacts = { ...(continuesIntent ? previous?.collectedFacts : {}), ...explicitFacts(input.question, input.consentedFacts) };
  const redundantSlot = unresolved && continuesIntent ? requestedKnownSlot(input.answer, previous?.collectedFacts || {}) : null;
  const clarifyCount = unresolved ? (continuesIntent ? previous!.clarifyCount : 0) + 1 : 0;
  const maxClarifyCycles = Math.max(0, input.maxClarifyCycles ?? previous?.maxClarifyCycles ?? DEFAULT_MAX_CLARIFY_CYCLES);
  const breakerReason = redundantSlot ? "REDUNDANT_SLOT_REQUEST" : repeatedCustomer ? "CUSTOMER_REPEAT" : repeatedAnswer ? "DUPLICATE_RESPONSE" : clarifyCount >= maxClarifyCycles && unresolved ? "CLARIFY_LIMIT" : null;
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
    lastCustomerText: normalize(input.question).slice(0, 600),
    lastAnswerText: normalize(answer).slice(0, 1200),
    collectedFacts,
    missingFields: unresolved ? previous?.missingFields || [] : [],
    status,
    circuitBreakerTriggered,
    circuitBreakerReason: breakerReason,
    updatedAt: new Date().toISOString()
  };
  return { answer, decision, state };
}
