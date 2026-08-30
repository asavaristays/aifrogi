import assert from "node:assert/strict";
import test from "node:test";
import { SOVEREIGN_CONSTITUTION, SOVEREIGN_CONSTITUTION_VERSION } from "../../lib/sovereign-intelligence/constitution";
import { runSovereignCommonEvaluation, SAFE_RESOLUTION_RELEASE_THRESHOLD, scoreSovereignEvaluation } from "../../lib/sovereign-intelligence/evaluation";
import { governResolutionOutcome } from "../../lib/sovereign-intelligence/resolution";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

test("Constitution 1.1 locks bounded resolution as Rule 11", () => {
  assert.equal(SOVEREIGN_CONSTITUTION_VERSION, "1.1");
  assert.equal(SOVEREIGN_CONSTITUTION.rules.length, 11);
  assert.equal(SOVEREIGN_CONSTITUTION.rules[10].code, "BOUNDED_RESOLUTION");
});

test("Common Suite reaches the 94.5% internal SRR gate with every zero-tolerance gate at 100%", () => {
  const score = scoreSovereignEvaluation(runSovereignCommonEvaluation());
  assert.ok(score.srr >= SAFE_RESOLUTION_RELEASE_THRESHOLD, JSON.stringify(score));
  assert.equal(score.zeroTolerancePassed, true, JSON.stringify(score.gates));
  assert.equal(score.releasePassed, true);
});

test("repeated unresolved intent trips the circuit breaker before a third clarification", () => {
  const decision = { ...resolveSovereignQuestion("What is your cancellation policy?"), disposition: "FALLBACK" as const };
  const first = governResolutionOutcome({ question: "What is your cancellation policy?", answer: "I do not have approved policy information.", decision });
  const second = governResolutionOutcome({ question: "What is your cancellation policy?", answer: "I do not have approved policy information.", decision, previousState: first.state });
  assert.equal(first.state.clarifyCount, 1);
  assert.equal(second.state.clarifyCount, 2);
  assert.equal(second.decision.disposition, "ESCALATE");
  assert.equal(second.state.circuitBreakerReason, "CUSTOMER_REPEAT");
});

test("consented facts are retained and not lost across a contextual follow-up", () => {
  const firstDecision = resolveSovereignQuestion("I need training next Saturday");
  const first = governResolutionOutcome({ question: "I need training next Saturday", answer: "Which course?", decision: { ...firstDecision, disposition: "CLARIFY" }, consentedFacts: { name: "Test Visitor" } });
  const nextDecision = resolveSovereignQuestion("Give me the booking link", ["I need training next Saturday"]);
  const second = governResolutionOutcome({ question: "Give me the booking link", answer: "Use the approved training page.", decision: nextDecision, previousState: first.state });
  assert.equal(second.state.collectedFacts.name.value, "Test Visitor");
  assert.equal(second.state.collectedFacts.date.value.toLowerCase(), "next saturday");
});
