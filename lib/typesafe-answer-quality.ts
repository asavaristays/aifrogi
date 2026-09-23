import { eligibleTypesafeMessage } from "./typesafe-runtime-shadow";
import { reservePilotAttempt } from "./typesafe-pilot-store";

const API_URL = "https://api.typesafe.ai/v1/systemone";
const fitOptions = ["ADDRESSED", "PARTIAL", "MISSED", "APPROPRIATE_HANDOVER", "UNCLEAR"] as const;
const groundingOptions = ["SUPPORTED", "POSSIBLY_UNSUPPORTED", "NO_APPROVED_CONTEXT", "NOT_FACTUAL"] as const;
const handoverOptions = ["APPROPRIATE", "POSSIBLY_UNNECESSARY", "NOT_USED", "UNCLEAR"] as const;

type Choice<T extends string> = { choice: T; confidence: number };
type QualityInput = { organizationId: string; evidenceId: string; question: string; answer: string; disposition: string; approvedClaims: string[] };

/** Reject unsupported scripts and sensitive markers; remove contact values and numeric identifiers. */
export function redactQualityText(value: string, limit = 1200) {
  const normalized = value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2013\u2014]/g, "-").replace(/\u00a0/g, " ").replace(/\u20b9/g, "INR");
  if (!normalized || normalized.length > 5000 || /[^\x20-\x7e\r\n\t]/.test(normalized)
    || /\b(?:password|secret|otp|token|passport|medical|diagnosis|card number|upi pin|my name|i am|i'm)\b/i.test(normalized)
    || /\b(?:mr|mrs|ms|dr)\.?\s+[A-Z][a-z]+\b/.test(normalized)) return null;
  const redacted = normalized.replace(/https?:\/\/\S+|www\.\S+/gi, "[link]")
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\+?\d[\d\s().-]{5,}\d/g, "[number]")
    .replace(/\d+/g, "[number]")
    .replace(/\s+/g, " ").trim().slice(0, limit);
  return redacted.length >= 3 ? redacted : null;
}

function choice<T extends string>(value: unknown, options: readonly T[]): Choice<T> | null {
  if (!value || typeof value !== "object") return null;
  const answer = value as Record<string, unknown>;
  if (answer.type !== "choice" || !options.includes(answer.choice as T)
    || typeof answer.confidence !== "number" || !Number.isFinite(answer.confidence)
    || answer.confidence < 0 || answer.confidence > 1) return null;
  const probabilities = answer.probabilities;
  if (!probabilities || typeof probabilities !== "object" || Array.isArray(probabilities)) return null;
  const entries = Object.entries(probabilities);
  if (entries.length !== options.length || options.some((option) => !Object.hasOwn(probabilities, option))) return null;
  const values = entries.map(([, probability]) => probability);
  if (values.some((probability) => typeof probability !== "number" || !Number.isFinite(probability) || probability < 0 || probability > 1)
    || Math.abs(values.reduce<number>((sum, probability) => sum + (probability as number), 0) - 1) > 0.01) return null;
  return { choice: answer.choice as T, confidence: answer.confidence };
}

export async function assessTypesafeAnswerQuality(input: QualityInput,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
  reserve: (organizationId: string) => Promise<boolean> = reservePilotAttempt) {
  if (env.TYPESAFE_ACTION_GATEWAY_ENABLED !== "true" || env.TYPESAFE_MODE !== "shadow"
    || env.TYPESAFE_HOTEL_SHADOW_ENABLED !== "true" || !env.TYPESAFE_API_KEY
    || !eligibleTypesafeMessage(input.question)) return null;
  const question = redactQualityText(input.question, 500);
  const answer = redactQualityText(input.answer, 1200);
  if (!question || !answer) return null;
  const approvedClaims = input.approvedClaims.slice(0, 3).map((claim) => redactQualityText(claim, 450)).filter((claim): claim is string => Boolean(claim));
  if (!await reserve(input.organizationId).catch(() => false)) return null;
  const start = Date.now();
  const request = {
    model: "jev-latest",
    state: { guestQuestion: question, servedAnswer: answer, disposition: input.disposition,
      approvedKnowledge: approvedClaims.length ? approvedClaims : "No exact approved excerpt supplied" },
    questions: {
      response_fit: { type: "choice", instructions: "Judge whether `servedAnswer` addresses `guestQuestion`. Treat a handover as appropriate if the request needs human authority. Do not assume facts not in state.", criteria: {
        ADDRESSED: "Directly answers the guest's request or gives its valid next step.",
        PARTIAL: "Addresses part of the request but omits an important requested detail.",
        MISSED: "Does not address the guest's request.",
        APPROPRIATE_HANDOVER: "The answer appropriately routes a request needing human judgment to staff.",
        UNCLEAR: "The question or answer is too ambiguous to judge."
      } },
      grounding: { type: "choice", instructions: "Compare factual claims in `servedAnswer` only with `approvedKnowledge`. If no exact approved excerpt is supplied, choose NO_APPROVED_CONTEXT. Do not infer support from general knowledge or from a link alone.", criteria: {
        SUPPORTED: "The factual claims are directly supported by the supplied approved knowledge.",
        POSSIBLY_UNSUPPORTED: "A concrete factual claim conflicts with or is not supported by the supplied approved knowledge.",
        NO_APPROVED_CONTEXT: "No exact approved knowledge excerpt is supplied to verify factual claims.",
        NOT_FACTUAL: "The answer is a greeting, clarification, or handover with no factual business claim."
      } },
      handover: { type: "choice", instructions: "Judge `disposition` and `servedAnswer` against `guestQuestion`; this is advisory review, not permission to change routing.", criteria: {
        APPROPRIATE: "A human handover is used and justified by the guest request or missing authority.",
        POSSIBLY_UNNECESSARY: "A human handover is used although the supplied context suggests the bot could answer safely.",
        NOT_USED: "No human handover is used.",
        UNCLEAR: "The available context cannot establish whether handover was appropriate."
      } }
    }
  };
  try {
    const response = await fetchImpl(API_URL, { method: "POST", headers: { Authorization: `Bearer ${env.TYPESAFE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(request), signal: AbortSignal.timeout(3000), redirect: "error" });
    if (!response.ok) return { version: "typesafe-quality-v1", status: "UNAVAILABLE" as const, evidenceId: input.evidenceId, httpStatus: response.status, latencyMs: Date.now() - start };
    const body = await response.json().catch(() => null) as Record<string, unknown> | null;
    const answers = body?.answers as Record<string, unknown> | undefined;
    const fit = choice(answers?.response_fit, fitOptions);
    const grounding = choice(answers?.grounding, groundingOptions);
    const handover = choice(answers?.handover, handoverOptions);
    if (!fit || !grounding || !handover) return { version: "typesafe-quality-v1", status: "UNAVAILABLE" as const, evidenceId: input.evidenceId, httpStatus: 200, latencyMs: Date.now() - start };
    const usage = body?.usage as Record<string, unknown> | undefined;
    const reviewReasons = [
      ...(fit.confidence >= 0.8 && ["PARTIAL", "MISSED"].includes(fit.choice) ? ["RESPONSE_FIT"] : []),
      ...(approvedClaims.length && grounding.confidence >= 0.8 && grounding.choice === "POSSIBLY_UNSUPPORTED" ? ["POSSIBLE_UNSUPPORTED_CLAIM"] : []),
      ...(handover.confidence >= 0.8 && handover.choice === "POSSIBLY_UNNECESSARY" ? ["HANDOVER"] : [])
    ];
    return { version: "typesafe-quality-v1", status: "OBSERVED" as const, evidenceId: input.evidenceId,
      fit, grounding: approvedClaims.length ? grounding : { choice: "NO_APPROVED_CONTEXT" as const, confidence: 1 }, handover, reviewReasons,
      approvedClaimCount: approvedClaims.length, latencyMs: Date.now() - start,
      inputTokens: Math.max(0, Number(usage?.input_tokens) || 0), outputTokens: Math.max(0, Number(usage?.output_tokens) || 0) };
  } catch {
    return { version: "typesafe-quality-v1", status: "UNAVAILABLE" as const, evidenceId: input.evidenceId, httpStatus: 0, latencyMs: Date.now() - start };
  }
}
