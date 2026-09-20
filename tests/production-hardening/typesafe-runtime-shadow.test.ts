import test from "node:test";
import assert from "node:assert/strict";
import { observeTypesafeRuntime, projectTypesafeMessage } from "../../lib/typesafe-runtime-shadow";
import { TYPESAFE_ACTION_INTENTS } from "../../lib/typesafe-action-gateway";

test("projection drops names, numbers, URLs and emails before provider request", () => {
  const projected = projectTypesafeMessage("please call Rajesh +919999111111 rajesh@example.com https://example.com/key I want to book room 204");
  assert.equal(projected, "please call i want book room");
});
test("explicit mode, tenant allowlist and key all required", async () => {
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: "a" };
  for (const override of [{ TYPESAFE_MODE: "off" }, { TYPESAFE_SHADOW_ORGANIZATIONS: "b" }, { TYPESAFE_API_KEY: "" }, { TYPESAFE_ACTION_GATEWAY_ENABLED: "false" }]) {
    assert.equal(await observeTypesafeRuntime({ organizationId: "a", message: "please book room", primaryIntent: "BUSINESS" }, { ...env, ...override }, async () => { assert.fail("must not transmit"); }), null);
  }
});
test("provider receives vocabulary only and telemetry omits message and credentials", async () => {
  const result = await observeTypesafeRuntime({ organizationId: "test-one", message: "please book room for Rajesh +919999111111", primaryIntent: "BUSINESS" },
    { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: "test-one" }, async (_, options) => {
      assert.equal(JSON.parse(options!.body as string).state.customerMessage, "please book room");
      return new Response(JSON.stringify({ answers: { action_intent: { type: "choice", choice: "BOOKING_ENQUIRY", confidence: 1, probabilities: Object.fromEntries(TYPESAFE_ACTION_INTENTS.map(k => [k, k === "BOOKING_ENQUIRY" ? 1 : 0])) } } }));
    });
  assert.equal(result?.status, "OBSERVED");
  assert.doesNotMatch(JSON.stringify(result), /Rajesh|919999111111|customerMessage|apiKey/);
});
