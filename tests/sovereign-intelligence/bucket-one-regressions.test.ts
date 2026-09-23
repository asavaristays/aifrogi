import test from "node:test";
import assert from "node:assert/strict";
import { governResolutionOutcome } from "../../lib/sovereign-intelligence/resolution";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

test("contact follow-up survives unrelated weather interruption", () => {
  const result = resolveSovereignQuestion("You already have context", ["What is the weather today?", "What is your phone number?"]);
  assert.equal(result.resolvedQuestion, "What is your phone number?\nFollow-up question: You already have context");
  assert.equal(result.contextUsed, true);
});

test("a repeated question with a newly verified answer does not escalate", () => {
  const question = "What does the service cost?";
  const decision = resolveSovereignQuestion(question);
  const first = governResolutionOutcome({ question, answer: "Which service do you need?", decision: { ...decision, disposition: "CLARIFY" } });
  const second = governResolutionOutcome({ question, answer: "The approved service fee is INR 499.", decision, previousState: first.state });
  assert.equal(second.decision.disposition, "ANSWER");
  assert.equal(second.state.circuitBreakerTriggered, false);
});

test("an unresolved hotel question cannot contaminate a later property answer", () => {
  const firstQuestion = "Kates Adobe rate, bedrooms, bathrooms and capacity?";
  const firstDecision = { ...resolveSovereignQuestion(firstQuestion), disposition: "FALLBACK" as const };
  const first = governResolutionOutcome({ question: firstQuestion, answer: "I do not have enough verified information.", decision: firstDecision });
  const nextQuestion = "I meant Rohet Garh. What is its rate and max guest capacity?";
  const nextDecision = { ...resolveSovereignQuestion(nextQuestion), disposition: "ANSWER" as const };
  const next = governResolutionOutcome({
    question: nextQuestion,
    answer: "For Rohet Garh, the published rate is INR 9,500 / night and the listed capacity is Up to 3 guests.",
    decision: nextDecision,
    previousState: first.state
  });
  assert.equal(next.decision.disposition, "ANSWER");
  assert.equal(next.state.status, "RESOLVED");
  assert.equal(next.state.circuitBreakerTriggered, false);
  assert.match(next.answer, /Rohet Garh/);
});

test("unresolved repeated question exits without naming another tenant or promising delivery", () => {
  const question = "What does the service cost?";
  const decision = { ...resolveSovereignQuestion(question), disposition: "CLARIFY" as const };
  const first = governResolutionOutcome({ question, answer: "Please specify your requirements.", decision });
  const second = governResolutionOutcome({ question, answer: "Please specify your requirements.", decision, previousState: first.state });
  assert.equal(second.decision.disposition, "ESCALATE");
  assert.doesNotMatch(second.answer, /Webtechnosys|requesting|notified/i);
  const third = governResolutionOutcome({ question, answer: "Please specify your requirements.", decision, previousState: second.state });
  assert.equal(third.state.circuitBreakerTriggered, true);
});

test("distinct non-Latin questions have distinct fingerprints", () => {
  const make = (question: string) => governResolutionOutcome({ question, answer: "Please clarify.", decision: { ...resolveSovereignQuestion(question), disposition: "CLARIFY" } });
  assert.notEqual(make("आपका पता क्या है").state.lastCustomerFingerprint, make("आपकी सेवाएं क्या हैं").state.lastCustomerFingerprint);
});

test("different URLs remain distinct in answer evidence", () => {
  const question = "Share booking link";
  const make = (answer: string) => governResolutionOutcome({ question, answer, decision: resolveSovereignQuestion(question) });
  assert.notEqual(make("https://example.com/training-booking").state.lastAnswerFingerprint, make("https://example.com/hotel-booking").state.lastAnswerFingerprint);
});
