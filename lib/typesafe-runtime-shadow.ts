import { assessTypesafeActionIntent } from "./typesafe-action-gateway";
import { reservePilotAttempt } from "./typesafe-pilot-store";

// A deliberately lossy projection. Unknown words, names, numbers and punctuation
// never cross the vendor boundary. This supports English intent evaluation only.
const vocabulary = new Set(("i you your me my we our the a an is are do does can could would want like please share tell give have any no not dont don't only just " +
  "hotel room rooms suite suites stay stays book booking reserve reservation reservations desk contact numbr nmbr number phone mobile telephone email address " +
  "available availability free tomorrow today tonight friday saturday sunday weekend next check in out dates adults children " +
  "price rate breakfast food included wedding weddings host facilities wheelchair parking pool " +
  "pay paid payment confirm cancel cancellation refund deposit manager human person call callback " +
  "guest customer private another details password secret api otp card reveal ignore rules").split(/\s+/));

export function projectTypesafeMessage(message: string) {
  return message.toLowerCase()
    .replace(/\S*@\S*/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\S*\d\S*/g, " ")
    .split(/\s+/).filter(word => vocabulary.has(word)).slice(0, 80).join(" ");
}

export function eligibleTypesafeMessage(message: string) {
  // Skip entire sensitive/identifying messages instead of relying on redaction.
  return message.length <= 500 && !/[^\x20-\x7e\r\n\t]/.test(message)
    && !/\d|@|https?:|www\.|\b(password|secret|otp|token|api|card|passport|medical|diagnosis|private|another|customer|guest|my name|i am|i'm)\b/i.test(message);
}

const limits = new Map<string, { date: string; attempts: number; busy: boolean }>();
export async function observeTypesafeRuntime(input: { organizationId: string; message: string; primaryIntent: string; reviewRef?: string },
  env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch,
  reserve: (organizationId: string) => Promise<boolean> = reservePilotAttempt) {
  if (env.TYPESAFE_ACTION_GATEWAY_ENABLED !== "true" || env.TYPESAFE_MODE !== "shadow" || !env.TYPESAFE_API_KEY) return null;
  const allowed = (env.TYPESAFE_SHADOW_ORGANIZATIONS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (env.TYPESAFE_HOTEL_SHADOW_ENABLED !== "true" && !allowed.includes(input.organizationId)) return null;
  if (!eligibleTypesafeMessage(input.message)) return null;
  const projected = projectTypesafeMessage(input.message);
  if (projected.split(" ").length < 3) return null;
  const date = new Date().toISOString().slice(0, 10);
  const prior = limits.get(input.organizationId);
  const budget = prior?.date === date ? prior : { date, attempts: 0, busy: false };
  if (budget.busy || budget.attempts >= 20) return null;
  budget.attempts++; budget.busy = true; limits.set(input.organizationId, budget);
  const start = Date.now();
  try {
    if (!await reserve(input.organizationId).catch(() => false)) return null;
    const result = await assessTypesafeActionIntent({ question: projected, businessName: "Hospitality business", enabled: true, apiKey: env.TYPESAFE_API_KEY, fetchImpl });
    // No question, visitor/session IDs, business name or credentials in telemetry.
    return { version: "typesafe-shadow-v2", status: result.enabled ? "OBSERVED" : "UNAVAILABLE", primaryIntent: input.primaryIntent,
      intent: result.intent, confidence: result.confidence, recommendation: result.recommendation || "KEEP_EXISTING",
      latencyMs: Date.now() - start, inputTokens: result.usage?.inputTokens || 0, outputTokens: result.usage?.outputTokens || 0,
      ...(input.reviewRef ? { reviewRef: input.reviewRef } : {}) };
  } finally { budget.busy = false; }
}

/**
 * Narrow staging canary. The only behavioral route it may add is an explicit
 * human-handover request. Every other result preserves the governed primary path.
 */
export async function routeTypesafeStaging(input: { organizationId: string; message: string; primaryIntent: string; reviewRef?: string },
  env: Record<string, string | undefined> = process.env, fetchImpl?: typeof fetch,
  reserve: (organizationId: string) => Promise<boolean> = reservePilotAttempt) {
  if (env.TYPESAFE_ACTION_GATEWAY_ENABLED !== "true" || env.TYPESAFE_MODE !== "staging"
    || env.TYPESAFE_STAGING_ROUTING_ENABLED !== "true" || !env.TYPESAFE_API_KEY) return null;
  const allowed = (env.TYPESAFE_STAGING_ORGANIZATIONS || "").split(",").map(value => value.trim()).filter(Boolean);
  if (!allowed.includes(input.organizationId) || !eligibleTypesafeMessage(input.message)) return null;
  const projected = projectTypesafeMessage(input.message);
  if (projected.split(" ").length < 3 || !await reserve(input.organizationId).catch(() => false)) return null;
  const start = Date.now();
  const result = await assessTypesafeActionIntent({ question: projected, businessName: "Hospitality business", enabled: true, apiKey: env.TYPESAFE_API_KEY, fetchImpl });
  const humanRoute = result.enabled && result.intent === "HUMAN_HANDOVER" && result.mustRequireHuman && result.confidence >= 0.82;
  return {
    version: "typesafe-staging-v1", status: result.enabled ? "OBSERVED" : "UNAVAILABLE",
    primaryIntent: input.primaryIntent, intent: result.intent, confidence: result.confidence,
    route: humanRoute ? "HUMAN_HANDOVER" as const : "KEEP_EXISTING" as const,
    recommendation: result.recommendation || "KEEP_EXISTING", latencyMs: Date.now() - start,
    inputTokens: result.usage?.inputTokens || 0, outputTokens: result.usage?.outputTokens || 0,
    ...(input.reviewRef ? { reviewRef: input.reviewRef } : {})
  };
}
