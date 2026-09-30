import { createHash } from "node:crypto";
import { canonicalJson } from "@/lib/bot-machine-policy";

export type TransactionCapability = { capability: string; connector: string; requiresConfirmation: true; idempotencyRequired: true };
export type TransactionPreview = { previewId: string; propertyId: string; capability: string; connector: string; inputHash: string; expiresAt: string };

export function previewTransaction(input: { propertyId: string; capability: string; connector: string; payload: unknown; enabled: TransactionCapability[]; now?: Date }): TransactionPreview {
  const allowed = input.enabled.find((item) => item.capability === input.capability && item.connector === input.connector);
  if (!allowed) throw new Error("TRANSACTION_CAPABILITY_NOT_AUTHORIZED");
  const inputHash = createHash("sha256").update(canonicalJson(input.payload)).digest("hex");
  const now = input.now ?? new Date();
  return { previewId: createHash("sha256").update(`${input.propertyId}:${input.capability}:${input.connector}:${inputHash}`).digest("hex"), propertyId: input.propertyId, capability: input.capability, connector: input.connector, inputHash, expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString() };
}

export function confirmTransaction(input: { preview: TransactionPreview; payload: unknown; confirmationId: string; idempotencyKey: string; now?: Date }) {
  if (!input.confirmationId.trim()) throw new Error("EXPLICIT_CONFIRMATION_REQUIRED");
  if (!input.idempotencyKey.trim()) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  if (Date.parse(input.preview.expiresAt) <= (input.now ?? new Date()).getTime()) throw new Error("TRANSACTION_PREVIEW_EXPIRED");
  const actualHash = createHash("sha256").update(canonicalJson(input.payload)).digest("hex");
  if (actualHash !== input.preview.inputHash) throw new Error("TRANSACTION_INPUT_CHANGED_AFTER_PREVIEW");
  return { operationKey: createHash("sha256").update(`${input.preview.propertyId}:${input.preview.capability}:${input.idempotencyKey}`).digest("hex"), outcome: "PENDING" as const };
}

export function truthfulTransactionOutcome(input: { accepted: boolean; providerReference?: string; error?: unknown; commitSucceeded: boolean }) {
  if (input.accepted && input.commitSucceeded && input.providerReference) return { state: "CONFIRMED" as const, providerReference: input.providerReference };
  if (input.accepted && !input.commitSucceeded) return { state: "UNCERTAIN" as const, reason: "PROVIDER_ACCEPTED_DATABASE_COMMIT_UNKNOWN" };
  if (!input.accepted && input.error) return { state: "FAILED" as const, reason: input.error instanceof Error ? input.error.message : "PROVIDER_REJECTED" };
  return { state: "PENDING" as const, reason: "PROVIDER_OUTCOME_NOT_PROVEN" };
}

export type TransactionOutcome = ReturnType<typeof truthfulTransactionOutcome>;
export async function executeGovernedTransaction(input: {
  operationKey: string;
  timeoutMs: number;
  store: {
    reserve: (operationKey: string) => Promise<{ existing: TransactionOutcome | null }>;
    finalize: (operationKey: string, outcome: TransactionOutcome) => Promise<void>;
    markUncertain: (operationKey: string, outcome: TransactionOutcome) => Promise<void>;
  };
  send: (signal: AbortSignal) => Promise<{ accepted: boolean; providerReference?: string }>;
}) {
  const reservation=await input.store.reserve(input.operationKey);
  if(reservation.existing) return reservation.existing;
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  try {
    const provider=await Promise.race([input.send(controller.signal),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error("PROVIDER_TIMEOUT"));},input.timeoutMs);})]);
    const outcome=truthfulTransactionOutcome({accepted:provider.accepted,providerReference:provider.providerReference,commitSucceeded:true});
    try { await input.store.finalize(input.operationKey,outcome); return outcome; }
    catch(error) { const uncertain=truthfulTransactionOutcome({accepted:provider.accepted,providerReference:provider.providerReference,error,commitSucceeded:false}); await input.store.markUncertain(input.operationKey,uncertain); return uncertain; }
  } catch(error) {
    const message=error instanceof Error?error.message:"PROVIDER_REJECTED";
    const outcome:TransactionOutcome=message==="PROVIDER_TIMEOUT"
      ? {state:"UNCERTAIN" as const,reason:"PROVIDER_TIMEOUT_OUTCOME_UNKNOWN"}
      : truthfulTransactionOutcome({accepted:false,error,commitSucceeded:false});
    await input.store.markUncertain(input.operationKey,outcome);
    return outcome;
  } finally { if(timer) clearTimeout(timer); }
}
