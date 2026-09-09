import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluateBotReadiness } from "../../lib/bot-readiness";

const profile = { category: "BUSINESS_AI" as const, personaPackVersion: "1.0", operatingMode: "LEAD_CAPTURE" as const, channels: ["WEBSITE"] as const, capabilities: ["ANSWER_QUESTIONS"] as const, humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: "Webtechnosys team", businessObjective: "Answer approved service questions", tone: "Professional", languages: ["English"], prohibitedClaims: ["No invented commitments"], escalationTriggers: ["Low confidence"], status: "CONFIGURED" };

test("configured grounded website bot becomes operationally ready", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, channels: [...profile.channels], capabilities: [...profile.capabilities] }, appearanceConfigured: true, approvedKnowledgeCount: 2, websitePageCount: 3, testComplete: true, installationComplete: true });
  assert.equal(result.ready, true);
  assert.equal(result.percent, 100);
});

test("non-website profile is not ready in the website-bot product", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, channels: [] }, appearanceConfigured: true, approvedKnowledgeCount: 1, websitePageCount: 0, testComplete: true, installationComplete: true });
  assert.equal(result.ready, false);
  assert.equal(result.checks.find((item) => item.key === "blueprint")?.complete, false);
});

test("action mode requires an approval boundary", () => {
  const result = evaluateBotReadiness({ profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: false }, appearanceConfigured: true, approvedKnowledgeCount: 1, websitePageCount: 0, testComplete: true, installationComplete: true });
  assert.equal(result.checks.find((item) => item.key === "authority")?.complete, false);
});

test("action mode remains blocked until its required connector is verified live", () => {
  const result = evaluateBotReadiness({
    profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: true },
    appearanceConfigured: true,
    approvedKnowledgeCount: 1,
    websitePageCount: 0,
    testComplete: true,
    installationComplete: true,
    connectors: [{ name: "Google Calendar", required: true, enabled: false, lifecycle: "CONFIGURED" }]
  });
  assert.equal(result.checks.find((item) => item.key === "connectors")?.complete, false);
  assert.equal(result.ready, false);
});

test("verified live connectors satisfy the action readiness gate", () => {
  const result = evaluateBotReadiness({
    profile: { ...profile, operatingMode: "APPROVED_ACTIONS", actionApprovalNeeded: true },
    appearanceConfigured: true,
    approvedKnowledgeCount: 1,
    websitePageCount: 0,
    testComplete: true,
    installationComplete: true,
    connectors: [{ name: "Google Calendar", required: true, enabled: true, lifecycle: "LIVE" }]
  });
  assert.equal(result.checks.find((item) => item.key === "connectors")?.complete, true);
  assert.equal(result.ready, true);
});

test("Today is website-bot focused and contains no business-verification gate", () => {
  const page = readFileSync(resolve(process.cwd(), "app/(app)/dashboard/page.tsx"), "utf8");
  const view = readFileSync(resolve(process.cwd(), "components/dashboard/client-dashboard-view.tsx"), "utf8");
  assert.doesNotMatch(page, /businessVerified|Business verification|kycStatus|href:\s*"\/onboarding"|\/whatsapp-bot/);
  assert.doesNotMatch(view, /\/whatsapp-bot/);
  assert.doesNotMatch(page, /Usage matrix|Hard-stop protected/);
});

test("client settings and intelligence expose only current website-bot actions", () => {
  const settings = readFileSync(resolve(process.cwd(), "app/(app)/settings/page.tsx"), "utf8");
  const integrations = readFileSync(resolve(process.cwd(), "app/(app)/settings/integrations/page.tsx"), "utf8");
  const leads = readFileSync(resolve(process.cwd(), "components/manual-leads/manual-leads-workspace.tsx"), "utf8");
  const knowledge = readFileSync(resolve(process.cwd(), "components/knowledge/knowledge-workspace.tsx"), "utf8");
  assert.doesNotMatch(settings, /WhatsApp API|\/settings\/integrations|\/onboarding|\/billing/);
  assert.match(integrations, /redirect\("\/setup"\)/);
  assert.doesNotMatch(leads, /WhatsApp Bot|Add lead|Save To Shared Sheet|\["all", "manual", "whatsapp"/);
  assert.doesNotMatch(knowledge, /Governed improvement routing|Correction queue|Unanswered customer questions/);
});
