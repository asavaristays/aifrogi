import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseConnectorApiConfiguration } from "../../lib/connector-api-control";

test("connector API configuration accepts a public HTTPS booking contract", () => {
  const value = parseConnectorApiConfiguration({ apiBaseUrl: "https://booking.example.com/api/aifrogi/", authType: "bearer", operationMapping: { health: "/health", availability: "/v1/availability", create: "/v1/bookings", paymentVerification: "/v1/payments/{paymentId}/verify" } });
  assert.equal(value.apiBaseUrl, "https://booking.example.com/api/aifrogi");
  assert.equal(value.authType, "BEARER");
  assert.equal(value.operationMapping.create, "/v1/bookings");
  assert.equal(value.operationMapping.paymentVerification, "/v1/payments/{paymentId}/verify");
});

test("connector API configuration rejects credentials, insecure URLs and unsafe paths", () => {
  assert.throws(() => parseConnectorApiConfiguration({ apiBaseUrl: "http://booking.example.com" }), /HTTPS/);
  assert.throws(() => parseConnectorApiConfiguration({ apiBaseUrl: "https://user:pass@booking.example.com" }), /without credentials/);
  assert.throws(() => parseConnectorApiConfiguration({ apiBaseUrl: "https://127.0.0.1" }), /public HTTPS host/);
  assert.throws(() => parseConnectorApiConfiguration({ apiBaseUrl: "https://booking.example.com", operationMapping: { health: "/../secret" } }), /cannot contain/);
});

test("Super Admin API controls never return saved connector secrets", () => {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const repository = readFileSync(resolve(process.cwd(), "lib/repositories/onboarding-repository.ts"), "utf8");
  const component = readFileSync(resolve(process.cwd(), "components/bot-profile/bot-connector-plan.tsx"), "utf8");
  assert.match(schema, /model BotConnectorCredential/);
  assert.doesNotMatch(repository, /botConnectors:\s*\{[^}]*credential/);
  assert.match(component, /secrets are encrypted and never shown again/i);
  assert.match(component, /Test connection/);
});
