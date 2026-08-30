import assert from "node:assert/strict";
import test from "node:test";
import { evaluateBotReadiness } from "../../lib/bot-readiness";

const profile = { category: "BUSINESS_AI" as const, personaPackVersion: "1.0", operatingMode: "LEAD_CAPTURE" as const, channels: ["WEBSITE"] as const, capabilities: ["ANSWER_QUESTIONS"] as const, humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: "Webtechnosys team", businessObjective: "Answer approved service questions", tone: "Professional", languages: ["English"], prohibitedClaims: ["No invented commitments"], escalationTriggers: ["Low confidence"], status: "CONFIGURED" };

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

test("action mode remains blocked until its required connector is verified live", () => {
  const result = evaluateBotReadiness({
    profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: true },
    businessVerified: true,
    approvedKnowledgeCount: 1,
    websitePageCount: 0,
    whatsappConnected: false,
    connectors: [{ name: "Google Calendar", required: true, enabled: false, lifecycle: "CONFIGURED" }]
  });
  assert.equal(result.checks.find((item) => item.key === "connectors")?.complete, false);
  assert.equal(result.ready, false);
});

test("verified live connectors satisfy the action readiness gate", () => {
  const result = evaluateBotReadiness({
    profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: true },
    businessVerified: true,
    approvedKnowledgeCount: 1,
    websitePageCount: 0,
    whatsappConnected: false,
    connectors: [{ name: "Google Calendar", required: true, enabled: true, lifecycle: "LIVE" }]
  });
  assert.equal(result.checks.find((item) => item.key === "connectors")?.complete, true);
  assert.equal(result.ready, true);
});
