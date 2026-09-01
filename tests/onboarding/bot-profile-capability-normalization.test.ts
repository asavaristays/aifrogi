import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCapabilitiesForCategory, parseBotProfile } from "@/lib/bot-profile";

test("repairs an older BusinessGPT profile missing its qualification capability", () => {
  assert.deepEqual(
    normalizeCapabilitiesForCategory("BUSINESS_AI", ["ANSWER_QUESTIONS", "CAPTURE_LEADS"]),
    ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS"]
  );
});

test("a repaired BusinessGPT profile passes persona validation", () => {
  const capabilities = normalizeCapabilitiesForCategory("BUSINESS_AI", ["ANSWER_QUESTIONS", "CAPTURE_LEADS"]);
  const parsed = parseBotProfile({
    category: "BUSINESS_AI",
    operatingMode: "LEAD_CAPTURE",
    channels: ["WEBSITE"],
    capabilities,
    humanHandoffEnabled: true,
    actionApprovalNeeded: true,
    personaName: "BusinessGPT",
    businessObjective: "Answer approved questions and qualify genuine enquiries.",
    tone: "Professional",
    languages: ["English"],
    prohibitedClaims: [],
    escalationTriggers: [],
    responseSlaMinutes: 60,
    reminderPercent: 50,
    fallbackEnabled: false,
    safeFallbackMessage: ""
  });

  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.value?.capabilities, capabilities);
});
