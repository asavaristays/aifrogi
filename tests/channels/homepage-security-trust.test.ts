import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "app/page.tsx"), "utf8");

test("homepage presents the verified SEC-001 trust controls", () => {
  for (const claim of ["Tenant isolation", "Encrypted credentials", "Verified actions", "Accountable access", "Release safeguards"]) assert.match(source, new RegExp(claim));
  assert.match(source, /never asks customers to share card numbers, UPI PINs or OTPs/i);
  assert.match(source, /href="\/security-compliance"/);
});

test("homepage avoids unsupported certification claims", () => {
  assert.doesNotMatch(source, /ISO 27001 certified|SOC 2 compliant|PCI-DSS certified/i);
});
