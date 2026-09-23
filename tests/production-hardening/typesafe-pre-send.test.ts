import test from "node:test";
import assert from "node:assert/strict";
import { assessTypesafePreSend, shouldEscalatePreSend } from "../../lib/typesafe-pre-send";

const env = { TYPESAFE_PRE_SEND_ENABLED: "true", TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_API_KEY: "test-key" };
const input = { organizationId: "cmtv7qspl00678ekxasnphvqc", question: "Is parking free?",
  answer: "Parking is free.", approvedClaims: ["Parking has a fee."] };
const response = (choice: string, confidence = 0.95) => new Response(JSON.stringify({ answers: { claim_check: {
  type: "choice", choice, confidence, probabilities: { SUPPORTED: choice === "SUPPORTED" ? 1 : 0,
    CONTRADICTED: choice === "CONTRADICTED" ? 1 : 0, INSUFFICIENT: choice === "INSUFFICIENT" ? 1 : 0 }
} } }));

test("only a high-confidence factual contradiction routes to staff", async () => {
  const conflict = await assessTypesafePreSend(input, env, async () => response("CONTRADICTED"), async () => true);
  assert.equal(shouldEscalatePreSend(conflict), true);
  const uncertain = await assessTypesafePreSend(input, env, async () => response("CONTRADICTED", 0.75), async () => true);
  assert.equal(shouldEscalatePreSend(uncertain), false);
  const supported = await assessTypesafePreSend(input, env, async () => response("SUPPORTED"), async () => true);
  assert.equal(shouldEscalatePreSend(supported), false);
});

test("provider failure retains the governed answer", async () => {
  const failed = await assessTypesafePreSend(input, env, async () => new Response("", { status: 429 }), async () => true);
  assert.equal(failed?.status, "UNAVAILABLE");
  assert.equal(shouldEscalatePreSend(failed), false);
});

test("only approved hotels and non-sensitive answers can leave the server", async () => {
  let calls = 0;
  const provider: typeof fetch = async () => { calls++; return response("SUPPORTED"); };
  assert.equal(await assessTypesafePreSend({ ...input, organizationId: "other-hotel" }, env, provider, async () => true), null);
  assert.equal(await assessTypesafePreSend({ ...input, question: "My card number is here" }, env, provider, async () => true), null);
  assert.equal(await assessTypesafePreSend({ ...input, approvedClaims: [] }, env, provider, async () => true), null);
  assert.equal(calls, 0);
});
