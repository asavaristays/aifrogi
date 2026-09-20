import assert from "node:assert/strict";
import test from "node:test";
import { assessTypesafeActionIntent, typeSafeActionGateDisabled } from "../../lib/typesafe-action-gateway";

test("TypeSafe gate is fail-closed when no independent credential is configured", () => {
  assert.deepEqual(typeSafeActionGateDisabled(), { enabled: false, intent: "UNKNOWN", confidence: 0, mayOfferNextStep: false, mustRequireHuman: false, reason: "TypeSafe action gate is not configured." });
});

test("high-confidence availability is advisory and never bypasses deterministic validation", async () => {
  const result = await assessTypesafeActionIntent({ question: "Do you have rooms in Coorg next weekend?", businessName: "Example Stay", apiKey: "typesafe-test-key", fetchImpl: async () => new Response(JSON.stringify({ answers: { action_intent: { choice: "AVAILABILITY_ENQUIRY", confidence: 0.91 } }, usage: { input_tokens: 18, output_tokens: 7 } }), { status: 200 }) });
  assert.equal(result.mayOfferNextStep, true);
  assert.equal(result.mustRequireHuman, false);
  assert.match(result.reason, /deterministic field validation/);
  assert.deepEqual(result.usage, { inputTokens: 18, outputTokens: 7 });
});

test("transactional or uncertain intent never becomes an executable action", async () => {
  const transaction = await assessTypesafeActionIntent({ question: "Please pay and confirm my room", businessName: "Example Stay", apiKey: "typesafe-test-key", fetchImpl: async () => new Response(JSON.stringify({ answers: { action_intent: { choice: "PAYMENT_OR_TRANSACTION", confidence: 0.99 } } }), { status: 200 }) });
  assert.equal(transaction.mayOfferNextStep, false);
  assert.equal(transaction.mustRequireHuman, true);
  const uncertain = await assessTypesafeActionIntent({ question: "help", businessName: "Example Stay", apiKey: "typesafe-test-key", fetchImpl: async () => new Response(JSON.stringify({ answers: { action_intent: { choice: "BOOKING_ENQUIRY", confidence: 0.52 } } }), { status: 200 }) });
  assert.equal(uncertain.mayOfferNextStep, false);
  assert.equal(uncertain.mustRequireHuman, true);
});

test("upstream failure cannot alter bot or connector behavior", async () => {
  const result = await assessTypesafeActionIntent({ question: "Book a room", businessName: "Example Stay", apiKey: "typesafe-test-key", fetchImpl: async () => { throw new Error("unavailable"); } });
  assert.equal(result.enabled, false);
  assert.equal(result.intent, "UNKNOWN");
});
