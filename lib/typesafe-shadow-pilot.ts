import { assessTypesafeActionIntent, type TypesafeActionIntent } from "./typesafe-action-gateway";
import type { ConversationPlan } from "./sovereign-intelligence/conversation-planner";

const compatible: Record<TypesafeActionIntent, string[]> = {
  INFORMATION: ["BUSINESS", "CONTACT_INFO", "IDENTITY", "GREETING"],
  AVAILABILITY_ENQUIRY: ["BUSINESS", "CONTEXT_FOLLOW_UP"],
  BOOKING_ENQUIRY: ["BUSINESS", "CONTEXT_FOLLOW_UP"],
  PAYMENT_OR_TRANSACTION: ["BUSINESS", "CONTEXT_FOLLOW_UP", "SENSITIVE"],
  HUMAN_HANDOVER: ["HUMAN_REQUEST"], SENSITIVE_OR_UNSAFE: ["SENSITIVE"], UNKNOWN: ["UNKNOWN"]
};

/** Operator-invoked synthetic pilot. Never changes the supplied primary plan. */
export async function compareTypesafeShadow(input: {
  primaryPlan: ConversationPlan; question: string; businessName: string;
  apiKey?: string; enabled: boolean; synthetic: boolean; fetchImpl?: typeof fetch;
}) {
  if (!input.enabled || !input.synthetic || !input.apiKey) {
    return { plan: input.primaryPlan, observation: { status: "SKIPPED" as const } };
  }
  const start = Date.now();
  const result = await assessTypesafeActionIntent({ ...input, enabled: true });
  return {
    plan: input.primaryPlan,
    observation: {
      status: result.enabled ? "OBSERVED" as const : "UNAVAILABLE" as const,
      primaryIntent: input.primaryPlan.decision.intent,
      intent: result.intent, confidence: result.confidence,
      // Categories have different granularity; compatibility is not correctness.
      compatible: result.enabled ? compatible[result.intent].includes(input.primaryPlan.decision.intent) : null,
      recommendation: result.recommendation ?? "KEEP_EXISTING",
      mustRequireHuman: result.mustRequireHuman,
      latencyMs: Date.now() - start, usage: result.usage
    }
  };
}
