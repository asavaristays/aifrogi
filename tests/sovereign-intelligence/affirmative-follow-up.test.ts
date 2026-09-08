import test from "node:test";
import assert from "node:assert/strict";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

test("yes uses the actual pending training offer, not a new knowledge query", () => {
  const result = resolveSovereignQuestion("yes", ["How to book training?"], "1.0", "Would you like details on the upcoming cohort dates or assistance with the booking process?");
  assert.equal(result.disposition, "ANSWER");
  assert.equal(result.contextUsed, true);
  assert.match(result.resolvedQuestion, /training/);
  assert.match(result.resolvedQuestion, /approved next-step link/);
});
test("yes without an offer asks for clarification", () => {
  assert.equal(resolveSovereignQuestion("yes").disposition, "CLARIFY");
  assert.equal(resolveSovereignQuestion("yes", ["training"], "1.0", "I cannot answer weather questions.").contextUsed, false);
});
test("accepting an offer does not grant transactional authority", () => {
  const result = resolveSovereignQuestion("yes please", ["Book an appointment"], "1.0", "Would you like me to book this?");
  assert.match(result.resolvedQuestion, /not authorisation/);
  assert.equal(result.disposition, "ANSWER");
});
