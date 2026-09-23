import test from "node:test";
import assert from "node:assert/strict";
import { assessTypesafeAnswerQuality, redactQualityText } from "../../lib/typesafe-answer-quality";

const env = { TYPESAFE_ACTION_GATEWAY_ENABLED: "true", TYPESAFE_MODE: "shadow", TYPESAFE_HOTEL_SHADOW_ENABLED: "true", TYPESAFE_API_KEY: "test-key" };
const input = { organizationId: "hotel", evidenceId: "evidence-1", question: "Can I book a room?", answer: "Please contact our desk for booking help.", disposition: "ESCALATE", approvedClaims: [] };
const answer = (options: string[], selected: string) => ({ type: "choice", choice: selected, confidence: 0.9,
  probabilities: Object.fromEntries(options.map((option) => [option, option === selected ? 1 : 0])) });
const provider: typeof fetch = async () => new Response(JSON.stringify({ answers: {
  response_fit: answer(["ADDRESSED", "PARTIAL", "MISSED", "APPROPRIATE_HANDOVER", "UNCLEAR"], "APPROPRIATE_HANDOVER"),
  grounding: answer(["SUPPORTED", "POSSIBLY_UNSUPPORTED", "NO_APPROVED_CONTEXT", "NOT_FACTUAL"], "NO_APPROVED_CONTEXT"),
  handover: answer(["APPROPRIATE", "POSSIBLY_UNNECESSARY", "NOT_USED", "UNCLEAR"], "APPROPRIATE")
} }));

test("advisory quality is linked to exact evidence and keeps no raw text in observation", async () => {
  const result = await assessTypesafeAnswerQuality(input, env, provider, async () => true);
  assert.equal(result?.status, "OBSERVED");
  assert.equal(result?.evidenceId, input.evidenceId);
  assert.equal(JSON.stringify(result).includes(input.question), false);
  assert.equal(JSON.stringify(result).includes(input.answer), false);
});

test("disabled configuration and sensitive input never call provider", async () => {
  let called = false;
  const fetchImpl: typeof fetch = async () => { called = true; return new Response(""); };
  assert.equal(await assessTypesafeAnswerQuality(input, { ...env, TYPESAFE_MODE: "off" }, fetchImpl, async () => true), null);
  assert.equal(await assessTypesafeAnswerQuality({ ...input, question: "My password is secret" }, env, fetchImpl, async () => true), null);
  assert.equal(called, false);
  assert.equal(redactQualityText("email me at foo@example.com"), "email me at [email]");
  assert.equal(redactQualityText("I’ll check the ₹500 rate."), "I'll check the INR[number] rate.");
});

test("provider rejection is unavailable, not an answer change", async () => {
  const result = await assessTypesafeAnswerQuality(input, env, async () => new Response("", { status: 401 }), async () => true);
  assert.equal(result?.status, "UNAVAILABLE");
  assert.equal(result?.httpStatus, 401);
});
