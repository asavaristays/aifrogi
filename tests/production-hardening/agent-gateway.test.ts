import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Agent Gateway is strictly read-only in its first release", () => {
  const profile = readFileSync(resolve(process.cwd(), "app/api/agent/v1/[slug]/profile/route.ts"), "utf8");
  const availability = readFileSync(resolve(process.cwd(), "app/api/agent/v1/[slug]/availability/route.ts"), "utf8");
  assert.match(profile, /actions: \[\]/);
  assert.match(profile, /bookingAndPayment: "not available through this release"/);
  assert.match(availability, /checkTenantStayAvailability/);
  assert.doesNotMatch(`${profile}\n${availability}`, /createBooking|createPayment|paymentOrder|createQuote/i);
});

test("Agent availability requires a tenant-scoped bearer credential and rate limit", () => {
  const source = readFileSync(resolve(process.cwd(), "app/api/agent/v1/[slug]/availability/route.ts"), "utf8");
  assert.match(source, /authorizeAgentGatewayRequest/);
  assert.match(source, /availability:read/);
  assert.match(source, /rateLimited/);
  assert.match(source, /WWW-Authenticate/);
});

test("Agent credentials are hashed, auditable and revocable", () => {
  const source = readFileSync(resolve(process.cwd(), "lib/agent-gateway.ts"), "utf8");
  assert.match(source, /createHash\("sha256"\)/);
  assert.match(source, /timingSafeEqual/);
  assert.match(source, /AGENT_GATEWAY_CLIENT_CREATED/);
  assert.match(source, /AGENT_GATEWAY_CLIENT_REVOKED/);
  assert.doesNotMatch(source, /secretEncrypted/);
});
