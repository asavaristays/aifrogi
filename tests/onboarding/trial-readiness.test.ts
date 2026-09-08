import test from "node:test";
import assert from "node:assert/strict";
import { trialEssentialCoverage, hasSafeKnowledge } from "../../lib/trial-readiness";

test("five copies of one topic cannot complete trial essentials", () => {
  const claims = Array.from({ length: 5 }, () => ({ question: "Contact email", category: "Contact", answer: "hello@example.com" }));
  assert.equal(trialEssentialCoverage(claims).covered, 1);
});
test("all five distinct approved topics complete the topic checklist", () => {
  const claims = ["Business identity", "Services offered", "Contact email", "How to start", "Human support"].map((question) => ({ question, category: "General", answer: "Approved business answer." }));
  assert.deepEqual(trialEssentialCoverage(claims), { covered: 5, missing: [] });
});
test("empty or trivial answers never satisfy an essential topic", () => {
  assert.equal(trialEssentialCoverage([{ question: "Business identity", category: "General", answer: "" }]).covered, 0);
});
test("trial safety checks cannot be bypassed by topic completeness", () => {
  const safe = { freshnessRate: 100, conflicts: 0, unsigned: 0, openFlags: 0, previewPending: 0 };
  assert.equal(hasSafeKnowledge(safe), true);
  for (const key of ["conflicts", "unsigned", "openFlags", "previewPending"]) assert.equal(hasSafeKnowledge({ ...safe, [key]: 1 }), false);
  assert.equal(hasSafeKnowledge({ ...safe, freshnessRate: 94 }), false);
});
