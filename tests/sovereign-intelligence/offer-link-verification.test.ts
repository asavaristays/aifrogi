import test from "node:test";
import assert from "node:assert/strict";
import { approvedOfferLinks } from "../../lib/sovereign-intelligence/offer-continuation";
const base = { question: "yes", lastAssistantAnswer: "https://example.test/training-booking/ Would you like booking assistance?", contextUsed: true, candidates: [{ claimId: "own-claim", answer: "https://example.test/training-booking/", selected: true, status: "PUBLISHED" }] };
test("accepted offer uses the exact currently approved link", () => assert.deepEqual(approvedOfferLinks(base), [{ url: "https://example.test/training-booking/", claimId: "own-claim" }]));
for (const status of ["PAUSED", "EXPIRED", "CONFLICT", "APPROVED", "DRAFT"]) test(`offer cannot re-use ${status} knowledge`, () => assert.deepEqual(approvedOfferLinks({ ...base, candidates: [{ ...base.candidates[0], status }] }), []));
test("invented or unselected link is not reused", () => {
  assert.deepEqual(approvedOfferLinks({ ...base, lastAssistantAnswer: "https://example.test/wrong-link" }), []);
  assert.deepEqual(approvedOfferLinks({ ...base, candidates: [{ ...base.candidates[0], selected: false }] }), []);
  assert.deepEqual(approvedOfferLinks({ ...base, contextUsed: false }), []);
});
