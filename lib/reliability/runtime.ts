export const RELIABILITY_FRAMEWORK_VERSION = "1.0" as const;

export type ReliabilityFailureLayer = "NONE" | "MODEL" | "KNOWLEDGE" | "CONNECTOR" | "CONVERSATION_STATE" | "INFRASTRUCTURE";
export type EscalationTier = "TIER_0_SELF_RESOLVE" | "TIER_1_BUSINESS_ASYNC" | "TIER_2_AIFROGI_ASYNC" | "TIER_3_LIVE_CALL";

export type ReliabilityEvidence = {
  frameworkVersion: typeof RELIABILITY_FRAMEWORK_VERSION;
  failureLayer: ReliabilityFailureLayer;
  failureCode: string | null;
  latencyMs: number;
  attemptCount: number;
  escalationTier: EscalationTier;
  degradedMode: boolean;
};

export class ReliableOperationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly layer: ReliabilityFailureLayer,
    public readonly retryable: boolean
  ) { super(message); }
}

export function modelHttpError(status: number) {
  const retryable = status === 408 || status === 429 || status >= 500;
  return new ReliableOperationError(`Model provider returned HTTP ${status}.`, `MODEL_HTTP_${status}`, "MODEL", retryable);
}

export function escalationTierFor(input: { failureLayer?: ReliabilityFailureLayer; disposition?: string; humanRequested?: boolean }): EscalationTier {
  if (input.humanRequested) return "TIER_1_BUSINESS_ASYNC";
  if (input.failureLayer === "MODEL" || input.failureLayer === "INFRASTRUCTURE" || input.failureLayer === "CONNECTOR") return "TIER_2_AIFROGI_ASYNC";
  if (input.failureLayer === "KNOWLEDGE" || input.failureLayer === "CONVERSATION_STATE" || input.disposition === "ESCALATE") return "TIER_1_BUSINESS_ASYNC";
  return "TIER_0_SELF_RESOLVE";
}

function normalizeError(error: unknown): ReliableOperationError {
  if (error instanceof ReliableOperationError) return error;
  if (error instanceof DOMException && error.name === "AbortError") return new ReliableOperationError("Operation timed out.", "MODEL_TIMEOUT", "MODEL", true);
  if (error instanceof Error && /abort|timeout/i.test(error.message)) return new ReliableOperationError("Operation timed out.", "MODEL_TIMEOUT", "MODEL", true);
  return new ReliableOperationError("Model transport failed.", "MODEL_TRANSPORT", "MODEL", true);
}

export async function executeReliableModel<T>({
  models,
  execute,
  validate,
  attemptsPerModel = 2,
  attemptTimeoutMs = 4500,
  totalBudgetMs = 10500,
  baseBackoffMs = 180,
  random = Math.random,
  wait = (milliseconds: number) => new Promise<void>((resolve) => setTimeout(resolve, milliseconds))
}: {
  models: string[];
  execute: (model: string, signal: AbortSignal) => Promise<T>;
  validate: (value: T) => boolean;
  attemptsPerModel?: number;
  attemptTimeoutMs?: number;
  totalBudgetMs?: number;
  baseBackoffMs?: number;
  random?: () => number;
  wait?: (milliseconds: number) => Promise<void>;
}): Promise<{ ok: true; value: T; model: string; evidence: ReliabilityEvidence } | { ok: false; error: ReliableOperationError; evidence: ReliabilityEvidence }> {
  const startedAt = Date.now();
  const uniqueModels = [...new Set(models.map((model) => model.trim()).filter(Boolean))];
  let attempts = 0;
  let fallbackAttempted = false;
  let lastError = new ReliableOperationError("No model was configured.", "MODEL_NOT_CONFIGURED", "INFRASTRUCTURE", false);

  for (let modelIndex = 0; modelIndex < uniqueModels.length; modelIndex += 1) {
    for (let modelAttempt = 0; modelAttempt < Math.max(1, attemptsPerModel); modelAttempt += 1) {
      const elapsed = Date.now() - startedAt;
      const remaining = totalBudgetMs - elapsed;
      if (remaining <= 0) {
        lastError = new ReliableOperationError("Total model budget was exhausted.", "MODEL_BUDGET_EXHAUSTED", "MODEL", false);
        break;
      }
      attempts += 1;
      if (modelIndex > 0) fallbackAttempted = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(attemptTimeoutMs, remaining));
      try {
        const value = await execute(uniqueModels[modelIndex], controller.signal);
        if (!validate(value)) throw new ReliableOperationError("Model output failed validation.", "MODEL_OUTPUT_INVALID", "MODEL", true);
        clearTimeout(timer);
        return { ok: true, value, model: uniqueModels[modelIndex], evidence: {
          frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: "NONE", failureCode: null,
          latencyMs: Date.now() - startedAt, attemptCount: attempts, escalationTier: "TIER_0_SELF_RESOLVE", degradedMode: modelIndex > 0
        } };
      } catch (error) {
        clearTimeout(timer);
        lastError = normalizeError(error);
        if (!lastError.retryable) break;
        const moreAttempts = modelAttempt + 1 < Math.max(1, attemptsPerModel) || modelIndex + 1 < uniqueModels.length;
        if (moreAttempts) {
          const jitter = Math.floor(baseBackoffMs * Math.max(0, random()));
          const delay = Math.min(baseBackoffMs * (2 ** Math.max(0, attempts - 1)) + jitter, Math.max(0, totalBudgetMs - (Date.now() - startedAt)));
          if (delay > 0) await wait(delay);
        }
      }
    }
  }

  return { ok: false, error: lastError, evidence: {
    frameworkVersion: RELIABILITY_FRAMEWORK_VERSION, failureLayer: lastError.layer, failureCode: lastError.code,
    latencyMs: Date.now() - startedAt, attemptCount: attempts,
    escalationTier: escalationTierFor({ failureLayer: lastError.layer }), degradedMode: fallbackAttempted
  } };
}
