export const CONNECTOR_LIFECYCLE = ["REQUESTED", "AUTHORISED", "CONNECTED", "MAPPED", "SANDBOX_TESTED", "VERIFIED", "LIVE", "MONITORED", "SUSPENDED", "RETIRED"] as const;
export type ConnectorLifecycle = typeof CONNECTOR_LIFECYCLE[number];

export type ConnectorAuthority = {
  readOperations: string[];
  writeOperations: string[];
  requiresHumanApproval: string[];
  idempotencyRequired: boolean;
  readBackRequired: boolean;
  immediateSuspendAvailable: boolean;
};

export function connectorMayAct(input: { lifecycle: ConnectorLifecycle; enabled: boolean; operation: string; authority: ConnectorAuthority }) {
  if (!input.enabled || !["LIVE", "MONITORED"].includes(input.lifecycle)) return { allowed: false, reason: "Connector is not verified and live." };
  if (!input.authority.writeOperations.includes(input.operation)) return { allowed: false, reason: "Operation is outside connector write authority." };
  if (!input.authority.idempotencyRequired || !input.authority.readBackRequired) return { allowed: false, reason: "Material actions require idempotency and read-back verification." };
  return { allowed: true, reason: input.authority.requiresHumanApproval.includes(input.operation) ? "Human approval is required before execution." : "Connector authority permits verified execution." };
}
