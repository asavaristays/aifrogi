import assert from "node:assert/strict";
import test from "node:test";
import { canPerformGovernedKnowledgeAction } from "@/lib/knowledge-authority";
import { unavailableKnowledgeMessage } from "@/lib/knowledge-fallback";
import { runKnowledgePublicationGate } from "@/lib/knowledge-publication-gate";
import { normalizeImprovementSignal } from "@/lib/improvement-signal";
import { buildImprovementRoutes } from "@/lib/governed-improvement-routing";

test("only Client Owner and Admin can alter governed business truth", () => {
  for (const role of ["OWNER", "ADMIN"] as const) assert.equal(canPerformGovernedKnowledgeAction(role, "FIELD_APPROVE"), true);
  for (const role of ["AGENT", "VIEWER"] as const) {
    assert.equal(canPerformGovernedKnowledgeAction(role, "FIELD_APPROVE"), false);
    assert.equal(canPerformGovernedKnowledgeAction(role, "REVIEW_FLAG"), false);
  }
});

test("every unavailable knowledge state has an explicit safe response", () => {
  const conflict = unavailableKnowledgeMessage("CONFLICT", "Example Hotel");
  assert.match(conflict, /two versions conflict/i);
  assert.match(conflict, /will not guess/i);
  assert.match(unavailableKnowledgeMessage("FLAGGED", "Example Hotel"), /paused for review/i);
  assert.match(unavailableKnowledgeMessage("EXPIRED", "Example Hotel"), /awaiting reconfirmation/i);
  assert.match(unavailableKnowledgeMessage("PAUSED", "Example Hotel"), /temporarily unavailable/i);
});

test("publication gate stores a complete sovereign regression decision", () => {
  const safe = runKnowledgePublicationGate({ question: "What is the consultation fee?", answer: "The consultation fee is ₹499.", category: "APPOINTMENTS", claimType: "FEE", currency: "INR" });
  assert.equal(safe.passed, true);
  assert.equal(safe.commonSuite.total, 30);
  assert.equal(safe.commonSuite.zeroTolerancePassed, true);
  const unsafe = runKnowledgePublicationGate({ question: "Is my appointment booked?", answer: "Your appointment is confirmed.", category: "APPOINTMENTS" });
  assert.equal(unsafe.passed, false);
  assert.ok(unsafe.failures.includes("OUTPUT_UNVERIFIED_ACTION_COMPLETION"));
});

test("improvement signals are privacy-normalized and tenant-bound", () => {
  const first = normalizeImprovementSignal({ propertyId: "tenant-a", type: "NEGATIVE_FEEDBACK", text: "Call me at +91 98765 43210; wrong PRICE!" });
  const repeated = normalizeImprovementSignal({ propertyId: "tenant-a", type: "NEGATIVE_FEEDBACK", text: "Call me at +91 98765 43210; wrong PRICE!" });
  const otherTenant = normalizeImprovementSignal({ propertyId: "tenant-b", type: "NEGATIVE_FEEDBACK", text: "Call me at +91 98765 43210; wrong PRICE!" });
  assert.equal(first.normalizedText, "call me at [phone] wrong price");
  assert.equal(first.fingerprint, repeated.fingerprint);
  assert.notEqual(first.fingerprint, otherTenant.fingerprint);
});

test("routing prioritizes overdue flags and suppressed conflicts without auto-correction", () => {
  const now = new Date("2026-08-31T10:00:00.000Z");
  const routes = buildImprovementRoutes({ now, flags: [{ id: "f1", status: "OPEN", acknowledgedAt: null, acknowledgeDueAt: new Date("2026-08-31T09:00:00.000Z"), resolveDueAt: new Date("2026-09-01T08:00:00.000Z") }], gaps: [{ id: "g1", status: "OPEN", occurrenceCount: 4, lastAskedAt: now }], entries: [{ id: "e1", status: "CONFLICT", conflictStatus: "UNRESOLVED" }] });
  assert.equal(routes[0].priority, "CRITICAL");
  assert.deepEqual(new Set(routes.filter((item) => item.priority === "CRITICAL").map((item) => item.trigger)), new Set(["INCORRECT_FACT_FLAG", "CONFLICT"]));
  assert.ok(routes.every((item) => item.owner === "CLIENT_ADMIN"));
  assert.ok(routes.every((item) => !/automatic correction/i.test(item.nextAction)));
});
