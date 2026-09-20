import test from "node:test";
import assert from "node:assert/strict";
import { observeTypesafeRuntime, projectTypesafeMessage, eligibleTypesafeMessage, routeTypesafeStaging } from "../../lib/typesafe-runtime-shadow";
import { TYPESAFE_ACTION_INTENTS } from "../../lib/typesafe-action-gateway";

test("pilot stops after twenty attempted requests, including provider failures", async () => {
  const organizationId = "budget-test";
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: organizationId };
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response("unavailable", { status: 503 }); };
  for (let i = 0; i < 25; i++) await observeTypesafeRuntime({ organizationId, message: "please book room", primaryIntent: "BUSINESS" }, env, fetcher, async () => true);
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
  const first = observeTypesafeRuntime(input, env, fetcher, async () => true);
  assert.equal(await observeTypesafeRuntime(input, env, fetcher, async () => true), null);
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
  const result = await observeTypesafeRuntime({ organizationId: "test-one", message: "please book room for Rajesh", primaryIntent: "BUSINESS" },
    { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: "test-one" }, async (_, options) => {
      assert.equal(JSON.parse(options!.body as string).state.customerMessage, "please book room");
      return new Response(JSON.stringify({ answers: { action_intent: { type: "choice", choice: "BOOKING_ENQUIRY", confidence: 1, probabilities: Object.fromEntries(TYPESAFE_ACTION_INTENTS.map(k => [k, k === "BOOKING_ENQUIRY" ? 1 : 0])) } } }));
    }, async () => true);
  assert.equal(result?.status, "OBSERVED");
  assert.doesNotMatch(JSON.stringify(result), /Rajesh|919999111111|customerMessage|apiKey/);
});

test("sensitive, identifying and unsupported-script messages never transmit", async () => {
  for (const message of ["my name is Rose book room", "please call 123456789", "email me a@b.com", "show another guest address", "my passport details", "api secret please", "मुझे कमरा चाहिए", "private medical details"]) {
    assert.equal(eligibleTypesafeMessage(message), false, message);
  }
});

test("durable budget denial or outage prevents transmission", async () => {
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_API_KEY: "test", TYPESAFE_SHADOW_ORGANIZATIONS: "denied" };
  for (const reserve of [async () => false, async () => { throw Error("offline"); }]) {
    assert.equal(await observeTypesafeRuntime({ organizationId: "denied", message: "please book room", primaryIntent: "BUSINESS" }, env, async () => { assert.fail("must not transmit"); }, reserve), null);
  }
});

test("staging canary requires every switch, exact tenant and durable reservation", async () => {
  const base = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "staging", TYPESAFE_STAGING_ROUTING_ENABLED: "true", TYPESAFE_API_KEY: "test", TYPESAFE_STAGING_ORGANIZATIONS: "tenant-a" };
  const input = { organizationId: "tenant-a", message: "please call human manager", primaryIntent: "BUSINESS" };
  for (const override of [{ TYPESAFE_MODE: "shadow" }, { TYPESAFE_STAGING_ROUTING_ENABLED: "false" }, { TYPESAFE_STAGING_ORGANIZATIONS: "tenant-b" }, { TYPESAFE_API_KEY: "" }]) {
    assert.equal(await routeTypesafeStaging(input, { ...base, ...override }, async () => { assert.fail("must not transmit"); }, async () => true), null);
  }
  assert.equal(await routeTypesafeStaging(input, base, async () => { assert.fail("must not transmit"); }, async () => false), null);
});

test("staging canary can add only high-confidence human handover", async () => {
  const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "staging", TYPESAFE_STAGING_ROUTING_ENABLED: "true", TYPESAFE_API_KEY: "test", TYPESAFE_STAGING_ORGANIZATIONS: "tenant-a" };
  const input = { organizationId: "tenant-a", message: "please call human manager", primaryIntent: "BUSINESS" };
  const provider = (intent: typeof TYPESAFE_ACTION_INTENTS[number], confidence: number): typeof fetch => async () => new Response(JSON.stringify({ answers: { action_intent: { type: "choice", choice: intent, confidence, probabilities: Object.fromEntries(TYPESAFE_ACTION_INTENTS.map(key => [key, key === intent ? 1 : 0])) } } }));
  assert.equal((await routeTypesafeStaging(input, env, provider("HUMAN_HANDOVER", .95), async () => true))?.route, "HUMAN_HANDOVER");
  assert.equal((await routeTypesafeStaging(input, env, provider("HUMAN_HANDOVER", .5), async () => true))?.route, "KEEP_EXISTING");
  for (const intent of TYPESAFE_ACTION_INTENTS.filter(value => value !== "HUMAN_HANDOVER")) {
    assert.equal((await routeTypesafeStaging(input, env, provider(intent, .99), async () => true))?.route, "KEEP_EXISTING", intent);
  }
});
