/**
 * TypeSafe is advisory only. This module never executes a connector action,
 * creates a quote/booking, or handles a payment. Deterministic AiFrogi policy
 * and provider verification remain the authority for every material action.
 */

export const TYPESAFE_ACTION_INTENTS = [
  "INFORMATION",
  "AVAILABILITY_ENQUIRY",
  "BOOKING_ENQUIRY",
  "PAYMENT_OR_TRANSACTION",
  "HUMAN_HANDOVER",
  "SENSITIVE_OR_UNSAFE",
  "UNKNOWN"
] as const;

export type TypesafeActionIntent = typeof TYPESAFE_ACTION_INTENTS[number];
export type TypesafeActionGate = {
  enabled: boolean;
  intent: TypesafeActionIntent;
  confidence: number;
  mayOfferNextStep: boolean;
  mustRequireHuman: boolean;
  reason: string;
  usage?: { inputTokens: number; outputTokens: number };
};

const MIN_CONFIDENCE = 0.82;
const API_URL = "https://api.typesafe.ai/v1/systemone";

function boundedText(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2_000) : "";
}

function boundedConfidence(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0;
}

function validAnswer(answer: Record<string, unknown> | undefined) {
  if (!answer || answer.type !== "choice" || !TYPESAFE_ACTION_INTENTS.includes(answer.choice as TypesafeActionIntent)) return false;
  if (typeof answer.confidence !== "number" || !Number.isFinite(answer.confidence) || answer.confidence < 0 || answer.confidence > 1) return false;
  const probabilities = answer.probabilities;
  if (!probabilities || typeof probabilities !== "object" || Array.isArray(probabilities)) return false;
  const entries = Object.entries(probabilities);
  if (entries.length !== TYPESAFE_ACTION_INTENTS.length || !TYPESAFE_ACTION_INTENTS.every(key => Object.hasOwn(probabilities, key))) return false;
  if (entries.some(([, value]) => typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1)) return false;
  const values = entries.map(([, value]) => value as number);
  return Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) < 0.01
    && (probabilities as Record<string, number>)[answer.choice as string] >= Math.max(...values);
}

function choice(value: unknown): TypesafeActionIntent {
  return typeof value === "string" && (TYPESAFE_ACTION_INTENTS as readonly string[]).includes(value)
    ? value as TypesafeActionIntent
    : "UNKNOWN";
}

function policy(intent: TypesafeActionIntent, confidence: number, enabled: boolean, usage?: TypesafeActionGate["usage"]): TypesafeActionGate {
  const certain = confidence >= MIN_CONFIDENCE;
  const highRisk = intent === "PAYMENT_OR_TRANSACTION" || intent === "SENSITIVE_OR_UNSAFE" || intent === "HUMAN_HANDOVER";
  if (!enabled) return { enabled: false, intent: "UNKNOWN", confidence: 0, mayOfferNextStep: false, mustRequireHuman: false, reason: "TypeSafe action gate is not configured." };
  if (!certain || intent === "UNKNOWN") return { enabled: true, intent, confidence, mayOfferNextStep: false, mustRequireHuman: true, reason: "Intent is unresolved; clarification or human review is required.", usage };
  if (highRisk) return { enabled: true, intent, confidence, mayOfferNextStep: false, mustRequireHuman: true, reason: "This intent is never eligible for autonomous execution.", usage };
  return { enabled: true, intent, confidence, mayOfferNextStep: intent === "AVAILABILITY_ENQUIRY" || intent === "BOOKING_ENQUIRY", mustRequireHuman: false, reason: "Intent is classified with sufficient confidence; deterministic field validation is still required.", usage };
}

export function typeSafeActionGateDisabled() {
  return policy("UNKNOWN", 0, false);
}

export async function assessTypesafeActionIntent(input: {
  question: unknown;
  businessName: unknown;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  enabled?: boolean;
}): Promise<TypesafeActionGate> {
  const apiKey = input.apiKey?.trim();
  const question = boundedText(input.question);
  const businessName = boundedText(input.businessName) || "this business";
  if (input.enabled !== true || !apiKey || !question) return typeSafeActionGateDisabled();

  const request = {
    state: { customerMessage: question, businessName },
    model: "jev-latest",
    questions: {
      action_intent: {
        type: "choice",
        instructions: "Classify `customerMessage` for `businessName` into one safe intent. This is routing only; do not infer missing dates, identity, payment authority, or booking confirmation.",
        criteria: {
          INFORMATION: "Public business, property, service, policy, contact, or amenity information. Requests for the hotel's reservation desk phone, booking contact number, email or address are public contact enquiries, including misspellings. They do not ask for a guest record unless the message explicitly identifies private guest information.",
          AVAILABILITY_ENQUIRY: "Asks whether a stay/service is available; dates or other required fields may still be missing.",
          BOOKING_ENQUIRY: "Wants to start or continue a booking/enquiry; this never authorizes a booking write.",
          PAYMENT_OR_TRANSACTION: "Asks to pay, confirm payment, refund, cancel, modify, or otherwise transact.",
          HUMAN_HANDOVER: "Explicit request for a person, manager, callback, complaint, or exception review.",
          SENSITIVE_OR_UNSAFE: "Requests private guest/customer data, credentials, OTPs, card data, another guest record, or unsafe action. A request for the business's public reservation/booking phone number or address belongs to INFORMATION.",
          UNKNOWN: "Does not clearly fit a permitted category."
        }
      }
    }
  };
  try {
    const response = await (input.fetchImpl || fetch)(API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(2_500),
      redirect: "error"
    });
    if (!response.ok) return typeSafeActionGateDisabled();
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    const answers = body?.answers as Record<string, unknown> | undefined;
    const answer = answers?.action_intent as Record<string, unknown> | undefined;
    if (!validAnswer(answer)) return typeSafeActionGateDisabled();
    const usage = body?.usage as Record<string, unknown> | undefined;
    return policy(choice(answer?.choice), boundedConfidence(answer?.confidence), true, usage ? { inputTokens: Math.max(0, Number(usage.input_tokens) || 0), outputTokens: Math.max(0, Number(usage.output_tokens) || 0) } : undefined);
  } catch {
    return typeSafeActionGateDisabled();
  }
}
