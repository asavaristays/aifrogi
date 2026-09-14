export const INTELLIGENCE_ROUTER_VERSION = "1.0" as const;
export type IntelligenceLayer = "CORE_SAFETY" | "HUMAN_CONTROL" | "FLOW_INTELLIGENCE" | "CONNECTOR_INTELLIGENCE" | "TENANT_INTELLIGENCE" | "CORE_INTELLIGENCE" | "HUMAN_FALLBACK";

export function resolveIntelligenceLayer(input: { safetyBlocked?: boolean; humanRequested?: boolean; flowMatched?: boolean; connectorMatched?: boolean; tenantGrounded?: boolean; coreAnswered?: boolean }): IntelligenceLayer {
  if (input.safetyBlocked) return "CORE_SAFETY";
  if (input.humanRequested) return "HUMAN_CONTROL";
  if (input.flowMatched) return "FLOW_INTELLIGENCE";
  if (input.connectorMatched) return "CONNECTOR_INTELLIGENCE";
  if (input.tenantGrounded) return "TENANT_INTELLIGENCE";
  if (input.coreAnswered) return "CORE_INTELLIGENCE";
  return "HUMAN_FALLBACK";
}
