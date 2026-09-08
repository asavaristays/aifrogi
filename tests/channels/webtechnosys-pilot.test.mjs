import assert from "node:assert/strict";
import test from "node:test";
import { WEBTECHNOSYS_PILOT_CASES, evaluatePilotAnswer } from "../../scripts/lib/webtechnosys-pilot-cases.mjs";

test("pilot has exactly 25 bounded questions and two multi-turn sequences", () => {
  assert.equal(WEBTECHNOSYS_PILOT_CASES.length, 25);
  assert.deepEqual([...new Set(WEBTECHNOSYS_PILOT_CASES.filter(item => item.sequence).map(item => item.sequence))].sort(), ["bot-follow-up", "training-follow-up"]);
  assert.ok(WEBTECHNOSYS_PILOT_CASES.every(item => item.id && item.area && item.question));
  assert.equal(WEBTECHNOSYS_PILOT_CASES.filter(item => item.sourceReviewNo).length, 20);
  assert.equal(WEBTECHNOSYS_PILOT_CASES.filter(item => item.derivedFrom).length, 5);
  assert.deepEqual(WEBTECHNOSYS_PILOT_CASES.filter(item => item.sourceReviewNo).map(item => item.sourceReviewNo), [1,2,3,4,5,6,7,8,9,10,91,92,93,94,95,96,97,98,99,100]);
});

test("seven-dimension rubric catches internal language and premature sales pressure", () => {
  const internal = evaluatePilotAnswer(WEBTECHNOSYS_PILOT_CASES[0], 200, { answer: "I answer approved questions from the knowledge base." });
  assert.equal(internal.dimensions.tone, "FAIL");
  const pressure = evaluatePilotAnswer(WEBTECHNOSYS_PILOT_CASES[2], 200, { answer: "We offer automation. Please share your mobile number.", governance: { intent: "BUSINESS" }, qualification: null });
  assert.equal(pressure.dimensions.salesPressure, "FAIL");
});

test("commercial intent can expose bounded qualification without failing sales pressure", () => {
  const quotation = WEBTECHNOSYS_PILOT_CASES.find(item => item.sourceReviewNo === 6);
  const result = evaluatePilotAnswer(quotation, 200, { answer: "Our team can prepare a quotation and contact you.", qualification: { contactEligible: true, nextField: "contact" } });
  assert.equal(result.dimensions.salesPressure, "PASS");
  assert.equal(result.dimensions.nextStepQuality, "PASS");
});
