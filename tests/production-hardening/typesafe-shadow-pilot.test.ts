import assert from "node:assert/strict";
import test from "node:test";
import { planConversation } from "../../lib/sovereign-intelligence/conversation-planner";
import { compareTypesafeShadow } from "../../lib/typesafe-shadow-pilot";
import { TYPESAFE_ACTION_INTENTS } from "../../lib/typesafe-action-gateway";

const primaryPlan = planConversation({ question: "Do you host weddings?" });
const input = { primaryPlan, question: "Do you host weddings?", businessName: "Fictional Hotel", enabled: true, synthetic: true, apiKey: "test-only" };
test("low confidence observation never adds a handover or mutates primary plan", async () => {
  const before = JSON.stringify(primaryPlan);
  const result = await compareTypesafeShadow({ ...input, fetchImpl: async () => new Response(JSON.stringify({ answers: { action_intent: { type: "choice", choice: "INFORMATION", confidence: 0.56, probabilities: Object.fromEntries(TYPESAFE_ACTION_INTENTS.map(k => [k, k === "INFORMATION" ? 1 : 0])) } } })) });
  assert.equal(result.plan, primaryPlan);
  assert.equal(JSON.stringify(primaryPlan), before);
  assert.equal(result.observation.recommendation, "KEEP_EXISTING");
  assert.equal(result.observation.mustRequireHuman, false);
});
test("real traffic and disabled pilot never call provider", async () => {
  for (const config of [{ synthetic: false }, { enabled: false }, { apiKey: undefined }]) {
    const result = await compareTypesafeShadow({ ...input, ...config, fetchImpl: async () => { assert.fail("No transmission permitted"); } });
    assert.equal(result.plan, primaryPlan); assert.equal(result.observation.status, "SKIPPED");
  }
});
test("provider failure retains original governed response plan", async () => {
  const result = await compareTypesafeShadow({ ...input, fetchImpl: async () => { throw Error("timeout"); } });
  assert.equal(result.plan, primaryPlan); assert.equal(result.observation.status, "UNAVAILABLE");
});
