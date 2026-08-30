import assert from "node:assert/strict";
import test from "node:test";
import { SOVEREIGN_CONSTITUTION, SOVEREIGN_CONSTITUTION_VERSION } from "../../lib/sovereign-intelligence/constitution";
import { REQUIRED_COMMON_CASE_IDS, runSovereignCommonEvaluation, SAFE_RESOLUTION_RELEASE_THRESHOLD, scoreSovereignEvaluation } from "../../lib/sovereign-intelligence/evaluation";
import { governResolutionOutcome, semanticSimilarity } from "../../lib/sovereign-intelligence/resolution";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

test("Constitution 1.1 locks bounded resolution as Rule 11", () => {
  assert.equal(SOVEREIGN_CONSTITUTION_VERSION, "1.1");
  assert.equal(SOVEREIGN_CONSTITUTION.rules.length, 11);
  assert.equal(SOVEREIGN_CONSTITUTION.rules[10].code, "BOUNDED_RESOLUTION");
});

test("complete Common Suite reaches the release gate with every zero-tolerance gate at 100%", () => {
  const score = scoreSovereignEvaluation(runSovereignCommonEvaluation());
  assert.equal(score.total, REQUIRED_COMMON_CASE_IDS.length);
  assert.equal(score.suiteComplete, true);
  assert.equal(score.scoreStatus, "CALCULATED");
  assert.ok(score.srr !== null && score.srr >= SAFE_RESOLUTION_RELEASE_THRESHOLD, JSON.stringify(score));
  assert.equal(score.zeroTolerancePassed, true, JSON.stringify(score.gates));
  assert.equal(score.releasePassed, true);
});

test("suite completeness gate withholds score when a required case is missing", () => {
  const incomplete = runSovereignCommonEvaluation().slice(0, -1);
  assert.ok(incomplete.every((result) => result.passed));
  const score = scoreSovereignEvaluation(incomplete);
  assert.equal(score.suiteComplete, false);
  assert.equal(score.scoreStatus, "WITHHELD");
  assert.equal(score.srr, null);
  assert.equal(score.releasePassed, false);
  assert.deepEqual(score.missingIds, ["SIC-A8-03"]);
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

test("semantic near-duplicate requests trigger bounded exit without verbatim equality", () => {
  assert.ok(semanticSimilarity("Tell me the cancellation policy for my booking", "Can you explain your booking cancellation policy?") >= 0.72);
  const firstDecision = { ...resolveSovereignQuestion("Tell me the cancellation policy for my booking"), disposition: "FALLBACK" as const };
  const first = governResolutionOutcome({ question: "Tell me the cancellation policy for my booking", answer: "I do not have an approved cancellation policy.", decision: firstDecision });
  const nextDecision = { ...resolveSovereignQuestion("Can you explain your booking cancellation policy?", ["Tell me the cancellation policy for my booking"]), disposition: "FALLBACK" as const };
  const second = governResolutionOutcome({ question: "Can you explain your booking cancellation policy?", answer: "I still do not have an approved cancellation policy.", decision: nextDecision, previousState: first.state });
  assert.equal(second.state.circuitBreakerTriggered, true);
  assert.equal(second.state.circuitBreakerReason, "CUSTOMER_REPEAT");
  assert.equal(second.decision.disposition, "ESCALATE");
});

test("slot memory refuses to ask again for consented contact details", () => {
  const decision = { ...resolveSovereignQuestion("I need a clinic appointment Friday"), disposition: "CLARIFY" as const };
  const first = governResolutionOutcome({ question: "I need a clinic appointment Friday", answer: "Which clinic service do you need?", decision, consentedFacts: { contact: "+91 9876543210" } });
  assert.equal(first.state.collectedFacts.contact.value, "+91 9876543210");
  const followUpDecision = { ...resolveSovereignQuestion("I need a dental appointment Friday", ["I need a clinic appointment Friday"]), disposition: "CLARIFY" as const };
  const second = governResolutionOutcome({ question: "I need a dental appointment Friday", answer: "What mobile number should the clinic use?", decision: followUpDecision, previousState: first.state });
  assert.equal(second.state.circuitBreakerTriggered, true);
  assert.equal(second.state.circuitBreakerReason, "REDUNDANT_SLOT_REQUEST");
  assert.doesNotMatch(second.answer, /what mobile number/i);
});
