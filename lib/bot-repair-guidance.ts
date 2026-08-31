export const BOT_REPAIR_GUIDANCE_VERSION = "1.0" as const;

export const BOT_REPAIR_LAYERS = [
  { key: "TENANT_KNOWLEDGE", title: "Business truth", symptom: "Missing, incorrect, expired or conflicting fact", owner: "Client Admin", action: "Add or correct an atomic claim, complete field approval and Preview Approval, then publish through the regression gate." },
  { key: "SHARED_INTELLIGENCE", title: "Shared intelligence", symptom: "Intent, context, repetition, persona boundary or evidence classification is wrong", owner: "AiFrogi Engineering", action: "Create a universal regression case, repair the shared runtime or versioned persona pack, and release only after all affected suites pass." },
  { key: "CONNECTOR_RUNTIME", title: "Connector or action", symptom: "Live availability, booking, payment, order or external-system update fails", owner: "AiFrogi Operations / Engineering", action: "Suspend unsafe writes, inspect connector evidence, verify idempotency and read-back, then certify before re-enabling." }
] as const;

export function classifyBotRepair(input: { failureLayer?: string | null; trigger?: string | null }) {
  const failure = (input.failureLayer || "").toUpperCase();
  const trigger = (input.trigger || "").toUpperCase();
  if (failure === "CONNECTOR" || trigger.includes("CONNECTOR")) return BOT_REPAIR_LAYERS[2];
  if (["MODEL", "CONVERSATION_STATE", "INFRASTRUCTURE"].includes(failure) || trigger.includes("EVIDENCE") || trigger.includes("RULE_11")) return BOT_REPAIR_LAYERS[1];
  return BOT_REPAIR_LAYERS[0];
}
