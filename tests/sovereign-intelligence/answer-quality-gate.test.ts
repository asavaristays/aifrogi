import assert from "node:assert/strict";
import test from "node:test";
import { buildMissingAnswerRecovery, evaluateVisitorAnswerQuality } from "../../lib/sovereign-intelligence/answer-quality-gate";
import { runCoreLaunchCertification } from "../../lib/sovereign-intelligence/launch-certification";

const answerDecision = { intent: "BUSINESS" as const, disposition: "ANSWER" as const };

test("visitor answer gate rejects internal and robotic language", () => {
  assert.equal(evaluateVisitorAnswerQuality({ question: "Tell me about training", answer: "I can answer approved questions from the review dataset.", decision: answerDecision }).passed, false);
  assert.equal(evaluateVisitorAnswerQuality({ question: "Tell me about training", answer: "Please restate the business topic before I use approved knowledge.", decision: answerDecision }).passed, false);
});

test("visitor answer gate blocks premature qualification but allows commercial follow-up", () => {
  assert.equal(evaluateVisitorAnswerQuality({ question: "What services do you offer?", answer: "We provide automation. What is your budget?", decision: answerDecision }).passed, false);
  assert.equal(evaluateVisitorAnswerQuality({ question: "I need a quotation", answer: "I can help. What is your budget?", decision: answerDecision }).passed, true);
});

test("missing answer recovery is category-aware, consented and contact-capable", () => {
  const answer = buildMissingAnswerRecovery({ businessName: "Asavari Stays", category: "STAY", publicPhone: "8800507181", handoffEnabled: true });
  assert.match(answer, /reservations team/);
  assert.match(answer, /private consent fields/);
  assert.match(answer, /8800507181/);
  assert.doesNotMatch(answer, /approved knowledge|review dataset/i);
});

test("every go-live inherits the complete Core certification", () => {
  const result = runCoreLaunchCertification();
  assert.equal(result.questionCount, 30);
  assert.equal(result.passed, 30);
  assert.equal(result.eligible, true);
});
