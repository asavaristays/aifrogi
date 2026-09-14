import type { TenantFact, TenantFactConflict, TenantFactField, TenantSourceType } from "@/lib/tenant-intelligence/fact-factory";

export type TenantTruthReviewItem = {
  id: string;
  reason: "CONFLICT" | "STALE" | "COMMERCIAL_REVIEW";
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  field: TenantFactField;
  values: string[];
  sources: TenantSourceType[];
  sourceUrls: string[];
  action: string;
};

export type TenantTruthReview = {
  generatedAt: string;
  counts: { conflicts: number; stale: number; commercial: number };
  items: TenantTruthReviewItem[];
};

const COMMERCIAL_FIELDS = new Set<TenantFactField>(["price", "policy", "hours", "phone", "email", "address"]);
const criticalFields = new Set<TenantFactField>(["price", "policy", "phone", "email", "address"]);
const canonical = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export function buildTenantTruthReview(facts: TenantFact[], conflicts: TenantFactConflict[], now = new Date()): TenantTruthReview {
  const items: TenantTruthReviewItem[] = conflicts.map((conflict) => ({
    id: `conflict-${canonical(conflict.key)}`,
    reason: "CONFLICT",
    priority: criticalFields.has(conflict.key as TenantFactField) ? "CRITICAL" : "HIGH",
    field: conflict.key as TenantFactField,
    values: conflict.values,
    sources: conflict.sources,
    sourceUrls: facts.filter((fact) => fact.field === conflict.key && conflict.values.includes(fact.value)).map((fact) => fact.sourceUrl || "").filter(Boolean),
    action: "Choose the current value or publish a correction before the bot uses this claim."
  }));

  for (const fact of facts) {
    const observedAt = Date.parse(fact.observedAt);
    const stale = !Number.isFinite(observedAt) || now.getTime() - observedAt > fact.refreshDays * 86400000;
    if (stale) items.push({
      id: `stale-${canonical(fact.key)}`,
      reason: "STALE",
      priority: criticalFields.has(fact.field) ? "HIGH" : "NORMAL",
      field: fact.field,
      values: [fact.value], sources: [fact.sourceType], sourceUrls: fact.sourceUrl ? [fact.sourceUrl] : [],
      action: "Reconfirm this fact or refresh its source before relying on it."
    });
    if (COMMERCIAL_FIELDS.has(fact.field) && fact.sourceType === "WEBSITE") items.push({
      id: `commercial-${canonical(fact.key)}`,
      reason: "COMMERCIAL_REVIEW",
      priority: criticalFields.has(fact.field) ? "HIGH" : "NORMAL",
      field: fact.field,
      values: [fact.value], sources: [fact.sourceType], sourceUrls: fact.sourceUrl ? [fact.sourceUrl] : [],
      action: "Confirm this customer-facing fact before publishing it as an approved answer."
    });
  }
  const priorityWeight = { CRITICAL: 3, HIGH: 2, NORMAL: 1 } as const;
  const unique = [...new Map(items.map((item) => [item.id, item])).values()]
    .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
  return {
    generatedAt: now.toISOString(),
    counts: {
      conflicts: unique.filter((item) => item.reason === "CONFLICT").length,
      stale: unique.filter((item) => item.reason === "STALE").length,
      commercial: unique.filter((item) => item.reason === "COMMERCIAL_REVIEW").length
    },
    items: unique.slice(0, 100)
  };
}
