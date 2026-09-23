import assert from "node:assert/strict";
import test from "node:test";
import { assembleAnswerContext } from "../../lib/sovereign-intelligence/answer-context";
import { validateGeneratedClaims } from "../../lib/sovereign-intelligence/claim-validator";

test("the highest-ranked policy page cannot be evicted by deep entity context", () => {
  const policy = "Cancellation policy: cancel 14 days before arrival for a refund.";
  const result = assembleAnswerContext({
    retrievalQuestion: "What is the cancellation policy?",
    rankedPages: [
      { url: "https://hotel.example/policy", title: "Policy", bucket: "policy", text: policy.repeat(80), score: 20 },
      { url: "https://hotel.example/rooms", title: "Rooms", bucket: "rooms", text: "Room details".repeat(500), score: 18 }
    ],
    explicitEntityContext: "Entity facts".repeat(1000),
    explicitEntitySourceUrl: "https://hotel.example/property/one",
    maxChars: 11000
  });
  assert.match(result.context, /Cancellation policy/);
  assert.equal(result.sourceUrls[0], "https://hotel.example/policy");
  assert.ok(result.context.length <= 11000);
  assert.equal(result.trace.retrievalQuestion, "What is the cancellation policy?");
});

test("numeric claims normalize equivalent percent spacing", () => {
  assert.equal(validateGeneratedClaims({ answer: "The rate is INR 22,500 plus 18% tax.", approvedContext: "Published rate: INR 22,500 plus 18 % tax." }).valid, true);
});

test("unsupported free parking is blocked even when free Wi-Fi is approved", () => {
  const result = validateGeneratedClaims({ answer: "Self-parking is free for guests.", approvedContext: "Amenities: Self-parking, Free Wi-Fi, airport transfers." });
  assert.equal(result.valid, false);
  if (!result.valid) assert.ok(result.violations.includes("UNSUPPORTED_ENTITLEMENT:parking"));
});

test("an approved complimentary entitlement remains valid", () => {
  assert.equal(validateGeneratedClaims({ answer: "Breakfast is complimentary.", approvedContext: "Breakfast is complimentary for registered guests." }).valid, true);
});
