import assert from "node:assert/strict";
import test from "node:test";
import { CORE_INTELLIGENCE_FRAMES, planCoreIntelligenceFrame, verifyCoreFrameAnswer, verifyCorePropertySources } from "../../lib/sovereign-intelligence/core-intelligence-frames";
import { runHotelGptContinuousJourney } from "../../lib/sovereign-intelligence/hotelgpt-journey";
import { scoreDeterministicAnswerQuality } from "../../lib/sovereign-intelligence/deterministic-quality-score";

test("Core Intelligence exposes reusable ordered frames", () => {
  assert.equal(CORE_INTELLIGENCE_FRAMES.length, 5);
  for (const frame of CORE_INTELLIGENCE_FRAMES) assert.deepEqual(frame.nodes.map((node) => node.type), ["DETECT_PARTS", "RESOLVE_TENANT", "RESOLVE_PROPERTY_ID", "RETRIEVE_EVIDENCE", "APPLY_AUTHORITY", "COMPOSE", "VERIFY"]);
});

test("multipart frame requires every requested hotel topic", () => {
  const question = "What is the rate and is breakfast included?";
  const plan = planCoreIntelligenceFrame("STAY", question);
  assert.equal(plan.frameKey, "HOTEL_MULTIPART");
  assert.deepEqual(verifyCoreFrameAnswer(plan, question, "The rate is INR 10,000."), { passed: false, missingParts: ["BREAKFAST"] });
  assert.deepEqual(verifyCoreFrameAnswer(plan, question, "The rate is INR 10,000. Breakfast is not included."), { passed: true, missingParts: [] });
});

test("Hotel frame carries one stable tenant property ID through the workflow", () => {
  const plan = planCoreIntelligenceFrame("STAY", "Kates Adboe price, bedrooms, bathrooms and guest capacity", "33");
  assert.equal(plan.tenantPropertyId, "33");
  assert.deepEqual(plan.requestedParts, ["RATE", "CAPACITY", "BEDROOMS", "BATHROOMS"]);
  assert.equal(verifyCorePropertySources(plan, ["https://asavaristays.com/properties/33", "https://asavaristays.com/cancellation-policies"]), true);
  assert.equal(verifyCorePropertySources(plan, ["https://asavaristays.com/properties/47"]), false);
});

test("continuous HotelGPT journey keeps the current property through 20 turns", () => {
  const rows = runHotelGptContinuousJourney();
  assert.equal(rows.length, 20);
  assert.deepEqual(rows.filter((row) => !row.passed), []);
});

test("deterministic quality score exposes explainable dimensions", () => {
  const strong = scoreDeterministicAnswerQuality({ question: "What is the rate and is breakfast included?", answer: "The rate is INR 10,000. Breakfast is not included.", intent: "BUSINESS", disposition: "ANSWER", grounded: true, decisionConsistent: true, safeResolution: true, personaCategory: "STAY", failureLayer: "NONE" });
  assert.equal(strong.score, 100);
  assert.equal(strong.grade, "STRONG");
  const partial = scoreDeterministicAnswerQuality({ question: "What is the rate and is breakfast included?", answer: "The rate is INR 10,000.", intent: "BUSINESS", disposition: "ANSWER", grounded: true, decisionConsistent: true, safeResolution: true, personaCategory: "STAY", failureLayer: "NONE" });
  assert.ok(partial.blockers.includes("MISSING_BREAKFAST"));
  assert.ok(partial.score < strong.score);
});
