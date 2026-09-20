import assert from "node:assert/strict";
import test from "node:test";
import { assessTypesafeActionIntent, TYPESAFE_ACTION_INTENTS, type TypesafeActionIntent } from "../../lib/typesafe-action-gateway";
function response(choice: TypesafeActionIntent, confidence = 0.95) {
  return { answers: { action_intent: { type: "choice", choice, confidence,
    probabilities: Object.fromEntries(TYPESAFE_ACTION_INTENTS.map(key => [key, key === choice ? 1 : 0])) } } };
}
const input = { question: "Do you have rooms?", businessName: "Synthetic Hotel", apiKey: "test-only", enabled: true };
const fetchResponse = (body: unknown): typeof fetch => async () => new Response(JSON.stringify(body));
test("disabled flag prevents transmission even when a key exists", async () => {
  let called = false;
  const result = await assessTypesafeActionIntent({ ...input, enabled: false, fetchImpl: async () => { called = true; throw Error(); } });
  assert.equal(called, false); assert.equal(result.mayOfferNextStep, false);
});
test("validated availability permits only an advisory next step", async () => {
  const result = await assessTypesafeActionIntent({ ...input, fetchImpl: fetchResponse(response("AVAILABILITY_ENQUIRY")) });
  assert.equal(result.mayOfferNextStep, true); assert.match(result.reason, /deterministic field validation/);
});
for (const intent of ["PAYMENT_OR_TRANSACTION", "SENSITIVE_OR_UNSAFE", "HUMAN_HANDOVER", "UNKNOWN"] as const) {
  test(`${intent} never offers an automated next step`, async () => {
    const result = await assessTypesafeActionIntent({ ...input, fetchImpl: fetchResponse(response(intent)) });
    assert.equal(result.mayOfferNextStep, false); assert.equal(result.mustRequireHuman, intent === "HUMAN_HANDOVER");
  });
}
test("low confidence abstains without forcing clarification or handover", async () => {
  const result = await assessTypesafeActionIntent({ ...input, fetchImpl: fetchResponse(response("BOOKING_ENQUIRY", 0.3)) });
  assert.equal(result.mayOfferNextStep, false);
  assert.equal(result.mustRequireHuman, false);
  assert.equal(result.recommendation, "KEEP_EXISTING");
});
test("malformed provider output cannot suggest action", async () => {
  const valid = response("BOOKING_ENQUIRY").answers.action_intent;
  for (const answer of [null, {}, { ...valid, type: "noul" }, { ...valid, confidence: "0.99" }, { ...valid, confidence: 2 }, { ...valid, choice: "EXECUTE" }, { ...valid, probabilities: {} }]) {
    const result = await assessTypesafeActionIntent({ ...input, fetchImpl: fetchResponse({ answers: { action_intent: answer } }) });
    assert.equal(result.enabled, false); assert.equal(result.mayOfferNextStep, false);
  }
});
test("network failure and rate limits produce no decision", async () => {
  for (const fetchImpl of [async () => { throw Error("timeout"); }, async () => new Response("", { status: 429 })]) {
    const result = await assessTypesafeActionIntent({ ...input, fetchImpl }); assert.equal(result.enabled, false);
  }
});
test("request contains only explicit fields and disallows redirects", async () => {
  await assessTypesafeActionIntent({ ...input, fetchImpl: async (url, options) => {
    assert.equal(url, "https://api.typesafe.ai/v1/systemone"); assert.equal(options?.redirect, "error");
    assert.deepEqual(Object.keys(JSON.parse(options?.body as string).state).sort(), ["businessName", "customerMessage"]);
    return new Response(JSON.stringify(response("INFORMATION")));
  } });
});
