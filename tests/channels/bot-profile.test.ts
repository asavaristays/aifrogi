import assert from "node:assert/strict";
import test from "node:test";
import { parseBotProfile } from "../../lib/bot-profile";

test("regular business bot supports website and WhatsApp as channels", () => {
  const parsed = parseBotProfile({ category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE", "WHATSAPP"], capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS"], humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: "Business team", businessObjective: "Answer approved questions and qualify leads", tone: "Professional", languages: ["English"], prohibitedClaims: ["No invented commitments"], escalationTriggers: ["Low confidence"] });
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.value?.channels, ["WEBSITE", "WHATSAPP"]);
});

test("configured bot requires governed persona identity and objective", () => {
  const parsed = parseBotProfile({ category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS"] });
  assert.match(parsed.error || "", /persona name/);
});

test("PingBook cannot be configured without appointment capability", () => {
  const parsed = parseBotProfile({ category: "PINGBOOK", operatingMode: "APPROVED_ACTIONS", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS"] });
  assert.match(parsed.error || "", /appointment booking/);
});

test("unsupported channel is rejected", () => {
  const parsed = parseBotProfile({ category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["TELEGRAM"], capabilities: ["CAPTURE_LEADS"] });
  assert.match(parsed.error || "", /supported channel/);
});
