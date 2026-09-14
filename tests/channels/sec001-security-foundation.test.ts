import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("production encryption refuses a missing or default secret", () => {
  const source = read("lib/field-encryption.ts");
  assert.match(source, /NODE_ENV === "production"/);
  assert.match(source, /Production field encryption secret is not configured/);
  assert.match(source, /Unsafe production field encryption secret/);
});

test("connector credential lifecycle supports rotation, expiry, use tracking and revocation", () => {
  const schema = read("prisma/schema.prisma");
  for (const field of ["keyVersion", "rotatedAt", "expiresAt", "revokedAt", "revokedBy", "lastUsedAt"]) assert.match(schema, new RegExp(`\\b${field}\\b`));
  const control = read("lib/connector-api-control.ts");
  assert.match(control, /keyVersion: \{ increment: 1 \}/);
  assert.match(control, /CONNECTOR_CREDENTIAL_REVOKED/);
  assert.match(control, /missing, expired, or revoked/);
  assert.match(control, /lastUsedAt: new Date\(\)/);
});

test("tenant runtime fails closed for invalid connector credentials", () => {
  const source = read("lib/tenant-availability.ts");
  assert.match(source, /connector\.credential\.revokedAt/);
  assert.match(source, /connector\.credential\.expiresAt <= new Date\(\)/);
});

test("release promotion is blocked by the first-ten security gate", () => {
  assert.match(read("ops/verify-release-gates.mjs"), /verify-first-ten-bot-security\.mjs/);
  const gate = read("ops/verify-first-ten-bot-security.mjs");
  assert.match(gate, /RAZORPAY_BILLING_WEBHOOK_SECRET/);
  assert.match(gate, /duplicate live tenant owner identities/);
  assert.match(gate, /live connectors with invalid credentials/);
});
