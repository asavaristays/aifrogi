import test from "node:test";
import assert from "node:assert/strict";
import { observeTypesafeRuntime, projectTypesafeMessage } from "../../lib/typesafe-runtime-shadow";
import { TYPESAFE_ACTION_INTENTS } from "../../lib/typesafe-action-gateway";

test("pilot stops after twenty attempted requests, including provider failures", async () => {
  const organizationId = "budget-test";
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: organizationId };
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response("unavailable", { status: 503 }); };
  for (let i = 0; i < 25; i++) await observeTypesafeRuntime({ organizationId, message: "please book room", primaryIntent: "BUSINESS" }, env, fetcher);
  assert.equal(calls, 20);
});

test("pilot permits only one in-flight request per tenant", async () => {
  const organizationId = "concurrency-test";
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: organizationId };
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; await pending; return new Response("unavailable", { status: 503 }); };
  const input = { organizationId, message: "please book room", primaryIntent: "BUSINESS" };
  const first = observeTypesafeRuntime(input, env, fetcher);
  assert.equal(await observeTypesafeRuntime(input, env, fetcher), null);
  release();
  await first;
  assert.equal(calls, 1);
});

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
