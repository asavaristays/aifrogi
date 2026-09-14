import assert from "node:assert/strict";
import test from "node:test";
import { buildTenantTruthReview } from "../../lib/tenant-intelligence/truth-governance";
import { reconcileTenantFacts, sourceAuthority, type TenantFact } from "../../lib/tenant-intelligence/fact-factory";

const fact = (field: TenantFact["field"], value: string, sourceType: TenantFact["sourceType"], observedAt = "2026-09-14T00:00:00.000Z"): TenantFact => ({ key: `${field}:${value}`, field, value, sourceType, authority: sourceAuthority(sourceType), confidence: 0.9, observedAt, refreshDays: 30, sourceUrl: "https://tenant.test/source" });

test("multiple first-party website contacts are alternatives, not contradictions", () => {
  const result = reconcileTenantFacts([fact("phone", "1111111111", "WEBSITE"), fact("phone", "2222222222", "WEBSITE")]);
  assert.equal(result.conflicts.length, 0);
});

test("competing explicit corrections create a critical review item", () => {
  const facts = [fact("phone", "1111111111", "CORRECTION"), fact("phone", "2222222222", "CORRECTION")];
  const reconciled = reconcileTenantFacts(facts);
  const review = buildTenantTruthReview(reconciled.facts, reconciled.conflicts, new Date("2026-09-14T01:00:00.000Z"));
  assert.equal(review.counts.conflicts, 1);
  assert.equal(review.items[0].priority, "CRITICAL");
});

test("stale commercial facts are visible and require reconfirmation", () => {
  const facts = [fact("price", "INR 6,500", "WEBSITE", "2026-01-01T00:00:00.000Z")];
  const review = buildTenantTruthReview(facts, [], new Date("2026-09-14T00:00:00.000Z"));
  assert.equal(review.counts.stale, 1);
  assert.equal(review.counts.commercial, 1);
  assert.ok(review.items.some((item) => item.reason === "STALE" && item.action.includes("Reconfirm")));
});
