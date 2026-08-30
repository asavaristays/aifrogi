import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");

test("public website bot requires a lifecycle-approved website profile", () => {
  assert.match(source, /canServeWebsiteBot\(profile\.status, profile\.channels\)/);
});

test("contact details are persisted only with explicit consent", () => {
  assert.match(source, /payload\?\.consent && payload\.contact/);
  assert.match(source, /payload\?\.consent && payload\.name/);
  assert.match(source, /consentText:/);
  assert.match(source, /consentedAt:/);
});

test("website bot limits request size and request rate", () => {
  assert.match(source, /slice\(0, 1200\)/);
  assert.match(source, /rateLimited\(request\)/);
  assert.match(source, /current\.count > limit/);
  assert.match(source, /status: 429/);
});

test("website reply retrieval requires a signed tenant-bound visitor session", () => {
  assert.match(source, /verifyWebsiteVisitorToken\(bearerToken\(request\), slug\)/);
  assert.match(source, /property: \{ slug \}/);
  assert.match(source, /sender: "AGENT"/);
  assert.match(source, /deliveryStatus: "READ"/);
  assert.match(source, /conversationState: "CLOSED"/);
  assert.match(source, /capabilityHash: hashWebsiteVisitorValue/);
  assert.match(source, /revokedAt: null/);
});

test("every website answer records Sovereign Intelligence evidence and escalates governed sensitive intent", () => {
  assert.match(source, /recordSovereignAnswerEvidence/);
  assert.match(source, /constitutionVersion: evidenceDecision\.constitutionVersion/);
  assert.match(source, /evidenceDecision\.disposition === "ESCALATE"/);
  assert.match(source, /knowledgeClaimIds: result\?\.claimIds/);
  assert.match(source, /answerEvidenceId:/);
});

test("answer correction is tenant-bound and pauses only cited claims", () => {
  const flagSource = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/flag/route.ts"), "utf8");
  assert.match(flagSource, /verifyWebsiteVisitorToken\(rawToken, slug\)/);
  assert.match(flagSource, /propertyId: session\.propertyId, leadId: token\.leadId/);
  assert.match(flagSource, /evidence\.knowledgeClaimIds/);
  assert.match(flagSource, /flagKnowledgeAnswer/);
});

test("partner responses expose governed source labels, freshness, and response SLA", () => {
  assert.match(source, /sources: result\?\.sources\.slice\(0, 3\)/);
  assert.match(source, /knowledgeAsOf:/);
  assert.match(source, /responseSlaMinutes: profile\.responseSlaMinutes/);
});
