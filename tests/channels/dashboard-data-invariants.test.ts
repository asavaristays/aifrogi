import assert from "node:assert/strict";
import test from "node:test";
import { compareDashboardDataSnapshots, validateDashboardDataSnapshot } from "@/lib/security/dashboard-data-invariants";

const baseline = { organizations: 5, websiteConversations: 278, subscriptions: 5, creditTransactions: 2 };

test("deployment invariants accept stable or increasing dashboard records", () => {
  assert.deepEqual(compareDashboardDataSnapshots(baseline, { ...baseline, websiteConversations: 279 }), []);
});

test("deployment invariants reject silent RLS-style count collapse", () => {
  assert.deepEqual(compareDashboardDataSnapshots(baseline, { ...baseline, websiteConversations: 0 }), ["websiteConversations decreased from 278 to 0"]);
});

test("deployment invariants reject malformed or partial baselines", () => {
  assert.throws(() => validateDashboardDataSnapshot({}), /contain exactly/);
  assert.throws(() => validateDashboardDataSnapshot({ ...baseline, subscriptions: "5" }), /non-negative integer/);
  assert.throws(() => validateDashboardDataSnapshot({ ...baseline, creditTransactions: -1 }), /non-negative integer/);
  assert.throws(() => validateDashboardDataSnapshot({ ...baseline, unexpected: 1 }), /contain exactly/);
});
