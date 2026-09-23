import { eligibleTypesafeMessage } from "./typesafe-runtime-shadow";
import { redactQualityText } from "./typesafe-answer-quality";
import { authorizePreSendAttempt } from "./typesafe-pilot-store";

const HOTEL_IDS = new Set(["cmtv7qspl00678ekxasnphvqc", "cmu2dcedu003284kxjotchehs"]);
const options = ["SUPPORTED", "CONTRADICTED", "INSUFFICIENT"] as const;
type Input = { organizationId: string; question: string; answer: string; approvedClaims: string[] };

export function shouldEscalatePreSend(result: { status: string; choice?: string; confidence?: number } | null) {
  return result?.status === "OBSERVED" && result.choice === "CONTRADICTED" && (result.confidence || 0) >= 0.9;
}

/** Only a high-confidence contradiction with exact approved knowledge may alter a reply. */
export async function assessTypesafePreSend(input: Input,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
  reserve: (organizationId: string) => Promise<boolean> = authorizePreSendAttempt) {
  if (!HOTEL_IDS.has(input.organizationId) || env.TYPESAFE_PRE_SEND_ENABLED !== "true"
    || env.TYPESAFE_ACTION_GATEWAY_ENABLED !== "true" || !env.TYPESAFE_API_KEY
    || !eligibleTypesafeMessage(input.question)) return null;
  const question = redactQualityText(input.question, 500);
  const answer = redactQualityText(input.answer, 1200);
  const claims = input.approvedClaims.slice(0, 3).map((value) => redactQualityText(value, 450)).filter((value): value is string => Boolean(value));
  if (!question || !answer || !claims.length || !await reserve(input.organizationId).catch(() => false)) return null;
  const started = Date.now();
  const request = { model: "jev-latest", state: { guestQuestion: question, proposedAnswer: answer, approvedKnowledge: claims },
    questions: { claim_check: { type: "choice", instructions: "Compare factual claims in `proposedAnswer` against the exact `approvedKnowledge`. Choose CONTRADICTED only for a clear factual conflict, not for missing information, wording differences, or a safe next step. Do not infer facts from general knowledge.", criteria: {
      SUPPORTED: "The relevant factual statements agree with the approved knowledge.",
      CONTRADICTED: "A concrete factual statement directly conflicts with the approved knowledge.",
      INSUFFICIENT: "The approved knowledge cannot verify the proposed answer, or the answer has no factual claim."
    } } } };
  try {
    const response = await fetchImpl("https://api.typesafe.ai/v1/systemone", { method: "POST",
      headers: { Authorization: `Bearer ${env.TYPESAFE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(request), signal: AbortSignal.timeout(3000), redirect: "error" });
    if (!response.ok) return { version: "typesafe-pre-send-v1", status: "UNAVAILABLE" as const, httpStatus: response.status, latencyMs: Date.now() - started };
    const body = await response.json().catch(() => null) as { answers?: { claim_check?: { type?: string; choice?: string; confidence?: number; probabilities?: Record<string, number> } } } | null;
    const result = body?.answers?.claim_check;
    const probabilities = result?.probabilities;
    if (result?.type !== "choice" || !options.includes(result.choice as typeof options[number])
      || typeof result.confidence !== "number" || result.confidence < 0 || result.confidence > 1
      || !probabilities || Object.keys(probabilities).length !== options.length
      || options.some((option) => typeof probabilities[option] !== "number" || probabilities[option] < 0 || probabilities[option] > 1)
      || Math.abs(Object.values(probabilities).reduce((sum, value) => sum + value, 0) - 1) > 0.01)
      return { version: "typesafe-pre-send-v1", status: "UNAVAILABLE" as const, httpStatus: 200, latencyMs: Date.now() - started };
    return { version: "typesafe-pre-send-v1", status: "OBSERVED" as const, choice: result.choice,
      confidence: result.confidence, approvedClaimCount: claims.length, latencyMs: Date.now() - started };
  } catch {
    return { version: "typesafe-pre-send-v1", status: "UNAVAILABLE" as const, httpStatus: 0, latencyMs: Date.now() - started };
  }
}
