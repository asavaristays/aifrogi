// REVIEW-ONLY exact proposed module. Intended path: lib/canonical-serving-gate.ts
export const CANONICAL_SERVING_CONTRACT_VERSION = 1 as const;

export function assertCanonicalServingStartup(env: NodeJS.ProcessEnv = process.env) {
  const required = env.AIFROGI_CANONICAL_SERVING_REQUIRED === "1";
  if (!required) return { enabled: false as const, reason: "CANONICAL_SERVING_NOT_REQUIRED" };
  if (CANONICAL_SERVING_CONTRACT_VERSION < 1) throw new Error("CANONICAL_SERVING_BUILD_INCOMPATIBLE");
  if (env.AIFROGI_LEGACY_FACT_FALLBACK !== "0") throw new Error("LEGACY_FACT_FALLBACK_FORBIDDEN");
  return { enabled: true as const, contractVersion: CANONICAL_SERVING_CONTRACT_VERSION };
}

export type CanonicalRouteState = {
  propertyId: string;
  policyMode: "LEGACY" | "CLAIMS_ONLY" | "BLOCKED";
  reviewRequired: boolean;
  publicationId: string | null;
  pointerGeneration: bigint | null;
  eligibilityGeneration: bigint | null;
};

export function assertCanonicalRoute(expectedPropertyId: string, state: CanonicalRouteState) {
  assertCanonicalServingStartup();
  if (state.propertyId !== expectedPropertyId) throw new Error("CANONICAL_PROPERTY_MISMATCH");
  if (state.policyMode !== "CLAIMS_ONLY" || state.reviewRequired) throw new Error("CANONICAL_POLICY_BLOCKED");
  if (!state.publicationId || state.pointerGeneration === null || state.eligibilityGeneration === null) throw new Error("CANONICAL_POINTER_MISSING");
  return Object.freeze({
    propertyId: state.propertyId,
    publicationId: state.publicationId,
    pointerGeneration: state.pointerGeneration,
    eligibilityGeneration: state.eligibilityGeneration
  });
}
