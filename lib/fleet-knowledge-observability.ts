import { groupTenantKnowledgeGaps, tenantKnowledgeFreshness } from "@/lib/tenant-intelligence/learning-lifecycle";

export type BotReadinessInput = {
  propertyId: string;
  releaseActive: boolean;
  factualServingOpen: boolean;
  authorizedSourceCount: number;
  activeMemberCount: number;
  retrievableUnitCount: number;
  validatorHealthy: boolean;
  unresolvedDeliveryCount: number;
};

export function assessBotFactualReadiness(input: BotReadinessInput) {
  const blockers = [
    !input.releaseActive && "ACTIVE_RELEASE_MISSING",
    !input.factualServingOpen && "FACTUAL_SERVING_CLOSED",
    input.authorizedSourceCount < 1 && "AUTHORIZED_SOURCE_MISSING",
    input.activeMemberCount < 1 && "ACTIVE_RELEASE_EMPTY",
    input.retrievableUnitCount < 1 && "RETRIEVABLE_EVIDENCE_MISSING",
    !input.validatorHealthy && "VALIDATOR_UNHEALTHY",
    input.unresolvedDeliveryCount > 0 && "DELIVERY_RECONCILIATION_REQUIRED",
  ].filter((value): value is string => Boolean(value));
  return { propertyId: input.propertyId, ready: blockers.length === 0, blockers };
}

export function assessSourceCoverage(input: { sourceId: string; expectedItems: number; capturedItems: number; failedItems: number; lastCapturedAt: string | null; refreshHours: number }, now = new Date()) {
  const expected = Math.max(0, input.expectedItems);
  const captured = Math.max(0, input.capturedItems);
  const coveragePercent = expected === 0 ? 0 : Math.round(Math.min(1, captured / expected) * 10_000) / 100;
  const freshness = tenantKnowledgeFreshness(input.lastCapturedAt, input.refreshHours, now);
  const alerts = [expected === 0 && "EXPECTED_INVENTORY_MISSING", coveragePercent < 90 && "COVERAGE_BELOW_90", input.failedItems > 0 && "CAPTURE_FAILURES_PRESENT", freshness.status === "DUE" && "REFRESH_DUE"].filter((value): value is string => Boolean(value));
  return { sourceId: input.sourceId, coveragePercent, freshness, alerts, healthy: alerts.length === 0 };
}

export function clusterFleetKnowledgeGaps(gaps: Array<{ id: string; propertyId: string; question: string; occurrenceCount: number; lastAskedAt: string | Date }>) {
  const byProperty = new Map<string, typeof gaps>();
  for (const gap of gaps) byProperty.set(gap.propertyId, [...(byProperty.get(gap.propertyId) ?? []), gap]);
  return [...byProperty.entries()].flatMap(([propertyId, propertyGaps]) =>
    groupTenantKnowledgeGaps(propertyGaps).map((topic) => ({ ...topic, propertyId, priority: topic.occurrenceCount >= 10 ? "CRITICAL" as const : topic.occurrenceCount >= 3 ? "HIGH" as const : "NORMAL" as const }))
  ).sort((left, right) => right.occurrenceCount - left.occurrenceCount || left.propertyId.localeCompare(right.propertyId));
}

export function deliveryUncertaintyAlerts(outcomes: Array<{ propertyId: string; provider: string | null; occurredAt: string | Date; deliveryKey: string }>, now = new Date(), thresholdMinutes = 15) {
  return outcomes.map((outcome) => {
    const ageMinutes = Math.max(0, Math.round((now.getTime() - new Date(outcome.occurredAt).getTime()) / 60000));
    return { ...outcome, provider: outcome.provider || "UNKNOWN", ageMinutes, alert: ageMinutes >= thresholdMinutes, severity: ageMinutes >= thresholdMinutes * 4 ? "CRITICAL" as const : ageMinutes >= thresholdMinutes ? "HIGH" as const : "OBSERVE" as const };
  }).sort((a, b) => b.ageMinutes - a.ageMinutes);
}
