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
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1 ? number : 0;
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
  if (!certain) return { enabled: true, intent, confidence, mayOfferNextStep: false, mustRequireHuman: true, reason: "Intent confidence is below the action threshold; clarification or human review is required.", usage };
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
}): Promise<TypesafeActionGate> {
  const apiKey = input.apiKey?.trim();
  const question = boundedText(input.question);
  const businessName = boundedText(input.businessName) || "this business";
  if (!apiKey || !question) return typeSafeActionGateDisabled();

  const request = {
    state: { customerMessage: question, businessName },
    model: "jev-latest",
    questions: {
      action_intent: {
        type: "choice",
        instructions: "Classify `customerMessage` for `businessName` into one safe intent. This is routing only; do not infer missing dates, identity, payment authority, or booking confirmation.",
        criteria: {
          INFORMATION: "Public business, property, service, policy, contact, or amenity information.",
          AVAILABILITY_ENQUIRY: "Asks whether a stay/service is available; dates or other required fields may still be missing.",
          BOOKING_ENQUIRY: "Wants to start or continue a booking/enquiry; this never authorizes a booking write.",
          PAYMENT_OR_TRANSACTION: "Asks to pay, confirm payment, refund, cancel, modify, or otherwise transact.",
          HUMAN_HANDOVER: "Explicit request for a person, manager, callback, complaint, or exception review.",
          SENSITIVE_OR_UNSAFE: "Requests private data, credentials, OTPs, card data, another guest record, or unsafe action.",
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
      signal: AbortSignal.timeout(2_500)
    });
    if (!response.ok) return typeSafeActionGateDisabled();
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    const answers = body?.answers as Record<string, unknown> | undefined;
    const answer = answers?.action_intent as Record<string, unknown> | undefined;
    const usage = body?.usage as Record<string, unknown> | undefined;
    return policy(choice(answer?.choice), boundedConfidence(answer?.confidence), true, usage ? { inputTokens: Math.max(0, Number(usage.input_tokens) || 0), outputTokens: Math.max(0, Number(usage.output_tokens) || 0) } : undefined);
  } catch {
    return typeSafeActionGateDisabled();
  }
}
