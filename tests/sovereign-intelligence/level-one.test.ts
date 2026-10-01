import assert from "node:assert/strict";
import test from "node:test";
import { LEVEL_ONE_PROBES, RAPID_PREVIEW_SLA_MS, levelOneManifest, levelOneFingerprint, levelOneChecksPassed, assessLevelOneAnswer, isLevelOneProfile, previewProbes } from "../../lib/sovereign-intelligence/level-one";
import type { KnowledgeBase, KnowledgeAnswer } from "../../lib/services/website-knowledge-service";
import type { GroundingReview } from "../../lib/sovereign-intelligence/answer-grounding";

export function snapshot(): KnowledgeBase {
  const now = new Date().toISOString();
  return { baseUrl: "https://hotel.example", crawledAt: now,
    pages: ["/", "/stay"].map(p => ({ url: `https://hotel.example${p}`, title: "Hotel", text: "Hotel has cottages and dining.", bucket: "Stay", crawledAt: now })),
    structuredFacts: ["business_name", "address", "phone", "rooms", "amenities"].map(field => ({ field, sourceType: "WEBSITE", sourceUrl: "https://hotel.example/", evidenceText: "Hotel has cottages and dining." })),
    truthReview: { counts: { conflicts: 0, stale: 0 } }, crawlReport: { readiness: "READY", reasons: [] }
  } as unknown as KnowledgeBase;
}
const rows = () => LEVEL_ONE_PROBES.map(p => ({ id: p.id, question: p.question, answer: "Checked answer", passed: true, issues: [], latencyMs: 1, sourceUrls: [] }));
test("automatic trial authority never covers action-performing or extra-channel profiles", () => {
  const profile = { category: "STAY", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS"] };
  assert.equal(isLevelOneProfile(profile), true);
  assert.equal(isLevelOneProfile({ ...profile, operatingMode: "APPROVED_ACTIONS" }), false);
  assert.equal(isLevelOneProfile({ ...profile, channels: ["WEBSITE", "WHATSAPP"] }), false);
  assert.equal(isLevelOneProfile({ ...profile, capabilities: ["ANSWER_QUESTIONS", "BOOK_APPOINTMENTS"] }), false);
});
test("rapid preview supports ordinary website bots and exposes the four-minute target", () => {
  const profile = { category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS"] };
  assert.equal(isLevelOneProfile(profile), true);
  assert.equal(previewProbes("BUSINESS_AI").length, 4);
  assert.equal(RAPID_PREVIEW_SLA_MS, 240000);
  const kb = snapshot();
  kb.structuredFacts.push({ field: "service", sourceType: "WEBSITE", sourceUrl: kb.pages[0].url } as never);
  assert.equal(levelOneManifest(kb, kb.baseUrl, Date.now(), "BUSINESS_AI").ready, true);
});
test("Level-1 requires a fresh same-site manifest and all five essential topics", () => {
  const kb = snapshot();
  assert.equal(levelOneManifest(kb, kb.baseUrl).ready, true);
  assert.equal(levelOneManifest(kb, "https://other.example").ready, false);
  for (const field of ["business_name", "address", "phone", "rooms", "amenities"]) {
    assert.equal(levelOneManifest({ ...kb, structuredFacts: kb.structuredFacts.filter(f => f.field !== field) }, kb.baseUrl).ready, false);
  }
  assert.equal(levelOneManifest({ ...kb, pages: kb.pages.slice(0, 1) }, kb.baseUrl).ready, false);
  assert.equal(levelOneManifest({ ...kb, crawledAt: "invalid" }, kb.baseUrl).ready, false);
  assert.equal(levelOneManifest(kb, kb.baseUrl, Date.now() + 7 * 3600000).ready, false);
});
test("page counts cannot override review-required, conflicting or fabricated-source evidence", () => {
  const kb = snapshot();
  assert.equal(levelOneManifest({ ...kb, crawlReport: { ...kb.crawlReport, readiness: "REVIEW_REQUIRED", reasons: ["Check sources"] } }, kb.baseUrl).ready, false);
  assert.equal(levelOneManifest({ ...kb, truthReview: { ...kb.truthReview, counts: { ...kb.truthReview.counts, conflicts: 1 } } }, kb.baseUrl).ready, false);
  assert.equal(levelOneManifest({ ...kb, structuredFacts: kb.structuredFacts.map(f => ({ ...f, sourceUrl: "https://other.example" })) }, kb.baseUrl).ready, false);
});
test("activation needs every distinct successful check, not an empty/partial/duplicate bank", () => {
  assert.equal(levelOneChecksPassed(rows()), true);
  assert.equal(levelOneChecksPassed([]), false);
  assert.equal(levelOneChecksPassed(rows().slice(1)), false);
  assert.equal(levelOneChecksPassed(rows().map(r => ({ ...r, id: "identity" }))), false);
  assert.equal(levelOneChecksPassed(rows().map((r, i) => ({ ...r, passed: i !== 0 }))), false);
});
test("manifest and settings changes invalidate answer evidence", () => {
  const kb = snapshot();
  assert.notEqual(levelOneFingerprint(kb, { approved: true }), levelOneFingerprint(kb, { approved: false }));
  assert.notEqual(levelOneFingerprint(kb, {}), levelOneFingerprint({ ...kb, pages: [] }, {}));
});
test("factual usefulness, evidence completeness, execution health and privacy all gate activation", () => {
  const answer = { answer: "We have cottages.", reliability: { failureCode: null }, decision: { disposition: "ANSWER" }, model: "CONSTITUTIONAL" } as KnowledgeAnswer;
  const review = { supported: true, complete: true, issues: [], claims: [{ text: answer.answer, kind: "FACT", supported: true, evidenceQuotes: [answer.answer] }] } as unknown as GroundingReview;
  assert.deepEqual(assessLevelOneAnswer(LEVEL_ONE_PROBES[0], answer, review), []);
  assert.ok(assessLevelOneAnswer(LEVEL_ONE_PROBES[0], answer, { ...review, claims: [] }).length);
  assert.ok(assessLevelOneAnswer(LEVEL_ONE_PROBES[0], answer, { ...review, complete: false }).length);
  assert.ok(assessLevelOneAnswer(LEVEL_ONE_PROBES[0], null, review).length);
  assert.ok(assessLevelOneAnswer(LEVEL_ONE_PROBES[6], answer, null).length);
  assert.deepEqual(assessLevelOneAnswer(LEVEL_ONE_PROBES[6], { ...answer, decision: { ...answer.decision, disposition: "REFUSE" } }, null), []);
  assert.ok(assessLevelOneAnswer(LEVEL_ONE_PROBES[7], { ...answer, model: "llm" }, review).length);
});
