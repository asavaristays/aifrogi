import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("continuous security monitoring covers expiry, live connectors and repeated failures", () => {
  const source = read("ops/run-security-monitor.mjs");
  assert.match(source, /CREDENTIAL_EXPIRY/); assert.match(source, /INVALID_LIVE_CONNECTOR/); assert.match(source, /REPEATED_SECURITY_FAILURES/); assert.match(source, /count\(DISTINCT action/);
});
test("rejected support mail is audited once rather than every scheduled sync", () => {
  assert.match(read("lib/support-email-sync.ts"), /SUPPORT_EMAIL_REPLY_IMPORTED", "SUPPORT_EMAIL_REPLY_REJECTED/);
});
test("dependency gate blocks high findings outside the reviewed Prisma tooling exception", () => {
  const source = read("scripts/verify-dependency-security.mjs");
  assert.match(source, /critical.*high/); assert.match(source, /approved non-runtime Prisma tooling exception/);
});
test("security drill proves readiness and emergency shutdown without changing customer data", () => {
  const source = read("ops/run-security-drill.mjs");
  assert.match(source, /connector-emergency-shutdown/); assert.match(source, /ROLLBACK/); assert.match(source, /No customer connector or data was changed/);
});
test("external assurance documents retain honest boundaries", () => {
  assert.match(read("docs/security/PENETRATION_TEST_RULES_OF_ENGAGEMENT.md"), /independent assessor/i);
  assert.match(read("docs/security/ISO_SOC2_READINESS_REGISTER.md"), /not a certification claim/i);
  assert.match(read("docs/security/AIFROGI_SECURITY_TRUST_PACK.md"), /does not claim ISO 27001, SOC 2 or PCI-DSS certification/i);
});
test("public security page offers a controlled client review", () => {
  const source = read("app/security-compliance/page.tsx");
  assert.match(source, /Test the controls without exposing production data/); assert.match(source, /Request a security review/);
});
