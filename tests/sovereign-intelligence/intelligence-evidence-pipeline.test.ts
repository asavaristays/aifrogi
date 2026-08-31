import assert from "node:assert/strict";
import test from "node:test";
import { anonymizeReplayText, classifyEvidenceFailure, inferUsedClaimIds, isSafeResolution, scoreRetrievalCandidate } from "../../lib/sovereign-intelligence/evidence-pipeline";

const decision = (disposition: "ANSWER" | "CLARIFY" | "ESCALATE" | "REFUSE" | "FALLBACK", intent: "BUSINESS" | "CONTACT_INFO" = "BUSINESS") => ({ disposition, intent } as const);

test("retrieval scoring closes common synonym gaps", () => {
  const booking = scoreRetrievalCandidate("Can I schedule a dental appointment?", { question: "How do I book a clinic slot?", answer: "Use the approved clinic calendar.", category: "Appointments" });
  const unrelated = scoreRetrievalCandidate("Can I schedule a dental appointment?", { question: "Where is the restaurant?", answer: "The restaurant is in Goa.", category: "Location" });
  assert.ok(booking >= 0.12);
  assert.equal(unrelated, 0);
});

test("used-claim inference distinguishes selected evidence from unused candidates", () => {
  const used = inferUsedClaimIds("The consultation fee is Rs 500 and booking is available online.", [
    { claimId: "fee", claimKey: "fee", score: 0.8, selected: true, status: "PUBLISHED", answer: "The consultation fee is Rs 500." },
    { claimId: "parking", claimKey: "parking", score: 0.3, selected: true, status: "PUBLISHED", answer: "Free parking is available behind the building." },
  ]);
  assert.deepEqual(used, ["fee"]);
});

test("failure classes separate retrieval misses from generation and connector failures", () => {
  assert.equal(classifyEvidenceFailure({ decision: decision("ESCALATE"), grounded: false, nearMissClaimIds: ["claim-1"] }), "RETRIEVAL_MISS");
  assert.equal(classifyEvidenceFailure({ decision: decision("ANSWER"), grounded: false }), "UNGROUNDED_GENERATION");
  assert.equal(classifyEvidenceFailure({ decision: decision("ESCALATE"), grounded: false, failureLayer: "CONNECTOR" }), "CONNECTOR_FAILURE");
  assert.equal(classifyEvidenceFailure({ decision: decision("ESCALATE"), grounded: false }), "SAFE_ESCALATION");
});

test("safe resolution rewards grounded answers and governed caution without hiding failures", () => {
  assert.equal(isSafeResolution({ classification: "NONE", decisionConsistent: true, disposition: "ANSWER", grounded: true, intent: "BUSINESS_QUERY" }), true);
  assert.equal(isSafeResolution({ classification: "SAFE_ESCALATION", decisionConsistent: true, disposition: "ESCALATE", grounded: false, intent: "BUSINESS_QUERY" }), true);
  assert.equal(isSafeResolution({ classification: "RETRIEVAL_MISS", decisionConsistent: true, disposition: "ESCALATE", grounded: false, intent: "BUSINESS_QUERY" }), false);
});

test("replay cases remove direct contact and secret-like values", () => {
  const redacted = anonymizeReplayText("Email me at person@example.com or +91 98765 43210. password: secret123. See https://example.com/private");
  assert.equal(redacted.includes("person@example.com"), false);
  assert.equal(redacted.includes("98765"), false);
  assert.equal(redacted.includes("secret123"), false);
  assert.match(redacted, /\[EMAIL\].*\[PHONE\].*\[REDACTED\].*\[URL\]/);
});
