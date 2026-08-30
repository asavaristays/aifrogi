import assert from "node:assert/strict";
import test from "node:test";
import { BOT_BLUEPRINTS } from "../../lib/bot-blueprints";
import { parseBotProfile } from "../../lib/bot-profile";

test("every commercial bot category has a complete intelligence blueprint", () => {
  for (const [category, blueprint] of Object.entries(BOT_BLUEPRINTS)) {
    assert.ok(blueprint.productName, `${category} product name`);
    assert.ok(blueprint.requiredInputs.length >= 5, `${category} required inputs`);
    assert.ok(blueprint.internalKnowledge.length >= 5, `${category} internal knowledge`);
    assert.ok(blueprint.externalKnowledge.length >= 1, `${category} external knowledge`);
    assert.ok(blueprint.negotiationRules.length >= 3, `${category} negotiation rules`);
    assert.ok(blueprint.safetyRules.length >= 3, `${category} safety rules`);
    assert.ok(blueprint.verifiedOutcomes.length >= 1, `${category} outcomes`);
    assert.ok(blueprint.evaluations.length >= 5, `${category} evaluations`);
  }
});

test("Restaurant, Real Estate, and Education profiles are accepted as governed categories", () => {
  for (const category of ["RESTAURANT", "REAL_ESTATE", "EDUCATION"]) {
    const parsed = parseBotProfile({
      category,
      operatingMode: "LEAD_CAPTURE",
      channels: ["WEBSITE"],
      capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS"],
      humanHandoffEnabled: true,
      actionApprovalNeeded: true,
      personaName: `${category} Assistant`,
      businessObjective: "Answer approved questions, qualify the enquiry, and hand it to the responsible team.",
      languages: ["English"]
    });
    assert.equal(parsed.value?.category, category);
  }
});

test("eduGPT blueprint protects students and avoids admissions guarantees", () => {
  const education = BOT_BLUEPRINTS.EDUCATION;
  assert.equal(education.productName, "eduGPT");
  assert.match(education.safetyRules.join(" "), /guardian/i);
  assert.match(education.safetyRules.join(" "), /admission decision/i);
  assert.match(education.negotiationRules.join(" "), /never guarantee/i);
  assert.match(education.internalKnowledge.join(" "), /programme/i);
});

test("HotelGPT blueprint protects price, availability, policy, and booking verification", () => {
  const hotel = BOT_BLUEPRINTS.STAY;
  const rules = hotel.safetyRules.join(" ");
  assert.equal(hotel.productName, "HotelGPT");
  for (const protectedFact of ["price", "availability", "policy"]) assert.match(rules, new RegExp(protectedFact, "i"));
  assert.match(rules, /read-back/i);
  assert.match(rules, /connector/i);
  assert.match(hotel.negotiationRules.join(" "), /floor rate/i);
});
