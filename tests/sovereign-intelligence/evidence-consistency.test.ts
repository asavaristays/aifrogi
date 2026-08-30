import assert from "node:assert/strict";
import test from "node:test";
import { evaluateDecisionBehaviourConsistency } from "../../lib/sovereign-intelligence/evidence-consistency";

test("evidence consistency independently distinguishes answer, clarify, refusal, escalation, fallback and action", () => {
  const cases = [
    { disposition: "ANSWER" as const, answer: "The approved fee is Rs. 500.", resolutionState: "RESOLVED", circuitBreaker: false, expected: "ANSWER" },
    { disposition: "CLARIFY" as const, answer: "Please provide your preferred day.", resolutionState: "ACTIVE", circuitBreaker: false, expected: "CLARIFY" },
    { disposition: "REFUSE" as const, answer: "I’m focused on this business, so I don’t provide sports results.", resolutionState: "REFUSED", circuitBreaker: false, expected: "REFUSE" },
    { disposition: "ESCALATE" as const, answer: "An authorised team member must verify this.", resolutionState: "ESCALATED", circuitBreaker: false, expected: "ESCALATE" },
    { disposition: "FALLBACK" as const, answer: "I could not validate that generated answer, so it was withheld.", resolutionState: "ACTIVE", circuitBreaker: false, failureLayer: "MODEL", expected: "FALLBACK" },
    { disposition: "ANSWER" as const, answer: "Demo booking created.", resolutionState: "RESOLVED", circuitBreaker: false, actionPerformed: true, expected: "ACT" }
  ];
  for (const item of cases) {
    const result = evaluateDecisionBehaviourConsistency(item);
    assert.equal(result.observedBehavior, item.expected);
    assert.equal(result.decisionConsistent, true);
  }
});

test("safe content with the wrong declared disposition is a release-blocking mismatch", () => {
  const result = evaluateDecisionBehaviourConsistency({ disposition: "ANSWER", answer: "I cannot provide sports results.", resolutionState: "REFUSED", circuitBreaker: false });
  assert.equal(result.observedBehavior, "REFUSE");
  assert.equal(result.decisionConsistent, false);
  assert.match(result.consistencyReason, /conflicts/);
});
