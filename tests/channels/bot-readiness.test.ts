import assert from "node:assert/strict";
import test from "node:test";
import { evaluateBotReadiness } from "../../lib/bot-readiness";

const profile = { category: "BUSINESS_AI" as const, operatingMode: "LEAD_CAPTURE" as const, channels: ["WEBSITE"] as const, capabilities: ["ANSWER_QUESTIONS"] as const, humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: "Webtechnosys team", businessObjective: "Answer approved service questions", tone: "Professional", languages: ["English"], prohibitedClaims: ["No invented commitments"], escalationTriggers: ["Low confidence"], status: "CONFIGURED" };

test("configured grounded website bot becomes operationally ready", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, channels: [...profile.channels], capabilities: [...profile.capabilities] }, businessVerified: true, approvedKnowledgeCount: 2, websitePageCount: 3, whatsappConnected: false });
  assert.equal(result.ready, true);
  assert.equal(result.percent, 100);
});

test("WhatsApp category is not ready without its connector", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, channels: ["WHATSAPP"] }, businessVerified: true, approvedKnowledgeCount: 1, websitePageCount: 0, whatsappConnected: false });
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((item) => item.key === "channels")?.complete, false);
});

test("action mode requires an approval boundary", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: false }, businessVerified: true, approvedKnowledgeCount: 1, websitePageCount: 0, whatsappConnected: false });
  assert.equal(result.checks.find((item) => item.key === "authority")?.complete, false);
});
