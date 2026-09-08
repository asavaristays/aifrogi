import assert from "node:assert/strict";
import test from "node:test";
import { WEBTECHNOSYS_PILOT_CASES, evaluatePilotAnswer } from "../../scripts/lib/webtechnosys-pilot-cases.mjs";

test("pilot has exactly 25 bounded questions and two multi-turn sequences", () => {
  assert.equal(WEBTECHNOSYS_PILOT_CASES.length, 25);
  assert.deepEqual([...new Set(WEBTECHNOSYS_PILOT_CASES.filter(item => item.sequence).map(item => item.sequence))].sort(), ["bot-follow-up", "training-follow-up"]);
  assert.ok(WEBTECHNOSYS_PILOT_CASES.every(item => item.id && item.area && item.question));
});

test("seven-dimension rubric catches internal language and premature sales pressure", () => {
  const internal = evaluatePilotAnswer(WEBTECHNOSYS_PILOT_CASES[0], 200, { answer: "I answer approved questions from the knowledge base." });
  assert.equal(internal.dimensions.tone, "FAIL");
  const pressure = evaluatePilotAnswer(WEBTECHNOSYS_PILOT_CASES[2], 200, { answer: "We offer automation. Please share your mobile number.", governance: { intent: "BUSINESS" }, qualification: null });
  assert.equal(pressure.dimensions.salesPressure, "FAIL");
});

test("commercial intent can expose bounded qualification without failing sales pressure", () => {
  const quotation = WEBTECHNOSYS_PILOT_CASES.find(item => item.id === "quotation");
  const result = evaluatePilotAnswer(quotation, 200, { answer: "Our team can prepare a quotation and contact you.", qualification: { contactEligible: true, nextField: "contact" } });
  assert.equal(result.dimensions.salesPressure, "PASS");
  assert.equal(result.dimensions.nextStepQuality, "PASS");
});
