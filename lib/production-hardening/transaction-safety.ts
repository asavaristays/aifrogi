export type ProviderOutcome =
  | { kind: "VERIFIED_SUCCESS"; providerReference: string; verificationId: string }
  | { kind: "VERIFIED_REJECTION"; code: string }
  | { kind: "TIMEOUT" }
  | { kind: "MALFORMED_RESPONSE"; detail?: string }
  | { kind: "UNKNOWN"; detail?: string };

export type TransactionDecision = {
  state: "CONFIRMED" | "REJECTED" | "PENDING_RECONCILIATION";
  customerMaySeeSuccess: boolean;
  retryMode: "NONE" | "STATUS_READ_ONLY";
  providerReference?: string;
  reason: string;
};

/**
 * Zero-trust boundary for every money or inventory-changing action.
 * A transport-level 2xx, redirect, browser return, or client claim is never
 * sufficient. Only a verified provider result may create customer-visible success.
 */
export function decideTransactionalOutcome(outcome: ProviderOutcome): TransactionDecision {
  if (outcome.kind === "VERIFIED_SUCCESS" && outcome.providerReference.trim() && outcome.verificationId.trim()) {
    return { state: "CONFIRMED", customerMaySeeSuccess: true, retryMode: "NONE", providerReference: outcome.providerReference, reason: "Authoritative provider success was verified." };
  }
  if (outcome.kind === "VERIFIED_REJECTION") {
    return { state: "REJECTED", customerMaySeeSuccess: false, retryMode: "NONE", reason: `Provider rejected the action (${outcome.code || "unspecified"}).` };
  }
  return { state: "PENDING_RECONCILIATION", customerMaySeeSuccess: false, retryMode: "STATUS_READ_ONLY", reason: "Provider outcome is ambiguous; hold for authoritative status reconciliation." };
}

export function transactionIdempotencyKey(input: { tenantId: string; operation: string; clientRequestId: string }) {
  const parts = [input.tenantId, input.operation, input.clientRequestId].map((value) => value.trim());
  if (parts.some((value) => !value)) throw new Error("Tenant, operation and client request ID are required for a transactional action.");
  return parts.join(":");
}

export function mayRepeatMaterialWrite(input: { existingState?: string | null; providerReference?: string | null }) {
  return !input.existingState && !input.providerReference;
}
