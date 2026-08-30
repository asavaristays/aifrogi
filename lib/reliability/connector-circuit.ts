export type ConnectorCircuitState = { state: "CLOSED" | "OPEN" | "HALF_OPEN"; consecutiveFailures: number; openedAt: number | null; nextProbeAt: number | null };

export const CLOSED_CONNECTOR_CIRCUIT: ConnectorCircuitState = { state: "CLOSED", consecutiveFailures: 0, openedAt: null, nextProbeAt: null };

export function connectorCircuitAfterFailure(current: ConnectorCircuitState, now = Date.now(), failureThreshold = 3, cooldownMs = 30_000): ConnectorCircuitState {
  const failures = current.consecutiveFailures + 1;
  if (current.state === "HALF_OPEN" || failures >= failureThreshold) return { state: "OPEN", consecutiveFailures: failures, openedAt: now, nextProbeAt: now + cooldownMs };
  return { ...current, consecutiveFailures: failures };
}

export function connectorCircuitBeforeAttempt(current: ConnectorCircuitState, now = Date.now()) {
  if (current.state !== "OPEN") return current;
  return current.nextProbeAt !== null && now >= current.nextProbeAt ? { ...current, state: "HALF_OPEN" as const } : current;
}

export function connectorCircuitAfterSuccess(): ConnectorCircuitState { return { ...CLOSED_CONNECTOR_CIRCUIT }; }

export function connectorFallbackPolicy(operation: "READ" | "WRITE", lastKnownCapturedAt?: Date | null) {
  if (operation === "WRITE") return { allowed: false, requiresFreshnessDisclosure: false, reason: "A failed material write may never fall back to an assumed result." };
  if (!lastKnownCapturedAt) return { allowed: false, requiresFreshnessDisclosure: false, reason: "No approved last-known read is available." };
  return { allowed: true, requiresFreshnessDisclosure: true, reason: `Last verified value captured at ${lastKnownCapturedAt.toISOString()}.` };
}
