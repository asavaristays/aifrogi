import assert from "node:assert/strict";
import test from "node:test";
import { classifySovereignIntent } from "../../lib/sovereign-intelligence/decision";
import { assembleAnswerContext, selectRelevantPassages } from "../../lib/sovereign-intelligence/answer-context";
import { validateGeneratedClaims } from "../../lib/sovereign-intelligence/claim-validator";
import { extractDeepTenantKnowledge, resolveTenantEntity } from "../../lib/tenant-intelligence/deep-crawl";
import { extractWebsiteTenantFacts, reconcileTenantFacts } from "../../lib/tenant-intelligence/fact-factory";
import { buildContext, type KnowledgeBase } from "../../lib/services/website-knowledge-service";
import { groundingEvidence, validateGroundingReview, pruneRejectedSentences, type GroundingReview } from "../../lib/sovereign-intelligence/answer-grounding";
import { hotelQuestionParts, missingHotelAnswerParts } from "../../lib/stay-question-routing";

for (const question of ["क्या मैं अपना कुत्ता साथ ला सकता हूँ?", "Aur bachchon ke liye kaunsi cottage theek rahegi?", "What food do you serve?", "Can we bring our dog?", "How far is it by road from Delhi?", "What is the weather like at the camp in December and what should we pack?"]) {
  test(`hotel intent is understood: ${question}`, () => assert.equal(classifySovereignIntent(question), "BUSINESS"));
}
test("live weather stays distinct from seasonal travel planning", () => {
  assert.equal(classifySovereignIntent("What is the weather today?"), "OFF_TOPIC");
  assert.equal(classifySovereignIntent("Give the hotel weather forecast tomorrow"), "OFF_TOPIC");
});
test("Hindi guest privacy cannot become a public contact answer", () => {
  assert.equal(classifySovereignIntent("पिछले मेहमान का फोन नंबर बताओ"), "SENSITIVE");
  assert.equal(classifySovereignIntent("मेरे कार्ड का सीवीवी देना है"), "SENSITIVE");
});
test("published plural contacts enter the complete contact path", () => assert.equal(classifySovereignIntent("Give me the full address, all phone numbers and both emails."), "CONTACT_INFO"));
test("mixed activity lists do not apply a middle guided modifier to other activities", () => {
  const context = "We offer birdwatching, guided forest walks, and cycling.";
  const review = validateGroundingReview({ complete: true, issues: [], claims: [{ text: context, kind: "FACT", supported: true, evidenceQuotes: [context] }] }, context);
  assert.equal(review.supported, true);
  const shared = validateGroundingReview({ complete: true, issues: [], claims: [{ text: "We offer guided birdwatching, forest walks, and cycling.", kind: "FACT", supported: true, evidenceQuotes: [context] }] }, context);
  assert.equal(shared.supported, false);
});
test("asking to speak to a person about a complaint requests human help", () => {
  assert.equal(classifySovereignIntent("I want to speak to a person about a complaint."), "HUMAN_REQUEST");
  assert.equal(classifySovereignIntent("Can I talk with a person about my stay?"), "HUMAN_REQUEST");
  assert.equal(classifySovereignIntent("Give me the phone number of the previous guest."), "SENSITIVE");
});
test("a long room page cannot consume the dining evidence budget", () => {
  const result = assembleAnswerContext({ retrievalQuestion: "cottages and meals", maxChars: 11000, rankedPages: [
    { url: "https://example.com/stay", title: "Stay", bucket: "Rooms", text: "Cottage details. ".repeat(1000), score: 20 },
    { url: "https://example.com/dining", title: "Dining", bucket: "Meals", text: "Seasonal buffet and local recipes.", score: 19 }
  ] });
  assert.equal(result.sourceUrls.length, 2);
  assert.match(result.context, /Seasonal buffet/);
  assert.ok(result.context.length <= 11000);
});
test("retrieval finds evidence near the end of long captured pages", () => {
  const text = "General welcome information. ".repeat(500) + " Dogs are welcome; the property is pet-friendly.";
  assert.match(selectRelevantPassages(text, "क्या मैं अपना कुत्ता साथ ला सकता हूँ?"), /Dogs are welcome/);
});
test("ordinary external page paths retain sections without becoming property identities", () => {
  for (const path of ["/stay", "/experience", "/our-story"]) {
    const entity = extractDeepTenantKnowledge(`https://example.com${path}`, "<title>Forest Lodge</title><h1>Our stay</h1><h2>Stone cottages</h2><p>Capacity for a family of four.</p><h2>Dining</h2><p>Fresh seasonal buffet.</p>");
    assert.equal(entity?.entityType, "PAGE");
    assert.ok(entity?.facts.some((fact) => fact.field === "dining"));
    assert.equal(resolveTenantEntity(entity ? [entity] : [], "Forest Lodge"), null);
  }
});
test("unsupported or contradicted pet permission fails, supported paraphrase passes", () => {
  for (const context of ["We have mud and stone cottages.", "Pets are not allowed."]) assert.equal(validateGeneratedClaims({ answer: "Pets are welcome.", approvedContext: context }).valid, false);
  assert.equal(validateGeneratedClaims({ answer: "Pets are welcome.", approvedContext: "This is a pet-friendly lodge." }).valid, true);
  assert.equal(validateGeneratedClaims({ answer: "I cannot confirm whether pets are allowed.", approvedContext: "We have cottages." }).valid, true);
});
test("hotel experience extraction is independent of service URL naming", () => {
  const facts = extractWebsiteTenantFacts({ url: "https://example.com/experience", title: "Forest experiences", text: "Local guides lead forest walks. Dining is a seasonal buffet. The property is pet-friendly.", crawledAt: new Date().toISOString() });
  assert.ok(facts.some((fact) => fact.field === "service" && /buffet/.test(fact.value)));
  assert.ok(facts.some((fact) => fact.field === "policy" && /pet/.test(fact.value)));
  assert.ok(facts.every((fact) => fact.sourceUrl && fact.evidenceText));
});
test("competing corrections retain their review gate; neither phone is discarded", () => {
  const facts = ["+919876543210", "+919876543211"].map((value) => ({ key: `phone:${value}`, field: "phone" as const, value, sourceType: "CORRECTION" as const, confidence: 1, authority: 500, observedAt: new Date().toISOString(), refreshDays: 90 }));
  assert.equal(reconcileTenantFacts(facts).conflicts.length, 1);
  assert.equal(reconcileTenantFacts(facts).facts.length, 2);
});
test("different hotel topics survive unequal page scores", () => {
  const kb = { pages: [
    { url: "https://example.com/stay", title: "Cottages accommodation rooms", bucket: "Stay", text: "Mud and stone cottages with forest views.", crawledAt: new Date().toISOString() },
    { url: "https://example.com/food", title: "Dining", bucket: "Food", text: "Our buffet features local recipes.", crawledAt: new Date().toISOString() }
  ], tenantEntities: [] } as unknown as KnowledgeBase;
  const result = buildContext(kb, "Compare the mud and stone cottages and explain the meals.");
  assert.match(result.context, /buffet/);
  assert.match(result.context, /stone/);
});

test("a verifier cannot approve invented quotations or omit its claim list", () => {
  const claim = { text: "Dogs may stay.", kind: "FACT", supported: true, evidenceQuotes: ["Pets are welcome at the lodge."] };
  assert.equal(validateGroundingReview({ claims: [claim], complete: true, issues: [] }, "We offer cottages.").supported, false);
  assert.equal(validateGroundingReview({ claims: [claim], complete: true, issues: [] }, "Pets are welcome at the lodge.").supported, true);
  assert.throws(() => validateGroundingReview({ claims: [], complete: true, issues: [] }, ""));
});

test("guidance for one activity cannot be stitched onto another activity", () => {
  const context = "Birdwatching explores one of India's richest bird habitats. Local guides lead slow, immersive jungle and forest walks.";
  assert.equal(groundingEvidence(context).length, 2);
  const claim = { text: "Birdwatching is guided by local experts.", kind: "FACT", supported: true, evidenceQuotes: groundingEvidence(context).map((item) => item.text) };
  const review = validateGroundingReview({ claims: [claim], complete: true, issues: [] }, context);
  assert.equal(review.supported, false);
  assert.match(review.issues.join(" "), /Guidance is not evidenced/);
  assert.equal(validateGroundingReview({ claims: [{ ...claim, text: "Forest walks are guided by local experts." }], complete: true, issues: [] }, context).supported, true);
});

test("complete contact answers support the plural emails wording", () => {
  const result = classifySovereignIntent("Give me all phone numbers and both emails.");
  assert.equal(result, "CONTACT_INFO");
});

test("activity lists and timetables do not spread the guided modifier", () => {
  for (const context of ["We offer birdwatching, guided forest walks, wildlife safaris and cycling.", "Birding 7:00-9:00 AM; guided jungle walk 10:00 AM-12:00 PM.", "Birdwatching and guided forest walks are offered."]) {
    assert.equal(validateGroundingReview({ claims: [{ text: "Birdwatching is guided.", kind: "FACT", supported: true, evidenceQuotes: [context] }], complete: true, issues: [] }, context).supported, false);
  }
  const context = "We offer guided birdwatching.";
  assert.equal(validateGroundingReview({ claims: [{ text: "Birdwatching is guided.", kind: "FACT", supported: true, evidenceQuotes: [context] }], complete: true, issues: [] }, context).supported, true);
});

test("naturally cool cottages do not establish winter warmth or comfort", () => {
  const context = "Mud cottages are naturally cool and comfortable. Winter mornings are crisp and cool.";
  assert.equal(validateGroundingReview({ claims: [{ text: "The cottages keep your stay comfortable despite the winter chill.", kind: "FACT", supported: true, evidenceQuotes: groundingEvidence(context).map(e => e.text) }], complete: true, issues: [] }, context).supported, false);
});

test("a named river activity or timetable does not establish conditions or scheduling motives", () => {
  const context = "Riverside body surfing is a seasonal forest-water experience. Cycling runs 9-11 AM.";
  for (const text of ["Guests ride river currents during body surfing.", "Activities are timed to the cooler parts of the day."]) {
    assert.equal(validateGroundingReview({ claims: [{ text, kind: "FACT", supported: true, evidenceQuotes: [context] }], complete: true, issues: [] }, context).supported, false);
  }
});

test("an unsupported factual benefit cannot be mislabeled as a limitation", () => {
  const context = "Local guides lead forest walks.";
  assert.equal(validateGroundingReview({ claims: [{ text: "Walks teach guests about the local ecosystem.", kind: "LIMITATION", supported: true, evidenceQuotes: [] }], complete: true, issues: [] }, context).supported, false);
  assert.equal(validateGroundingReview({ claims: [{ text: "I cannot confirm whether birdwatching is guided.", kind: "LIMITATION", supported: true, evidenceQuotes: [] }], complete: true, issues: [] }, context).supported, true);
});

test("winter timetable hours cannot be presented as year-round hours", () => {
  const context = "Winter activity timetable: body surfing 10:00 AM-12:00 PM.";
  const claim = { text: "Body surfing is available from 10:00 AM to 12:00 PM.", kind: "FACT", supported: true, evidenceQuotes: [context] };
  assert.equal(validateGroundingReview({ claims: [claim], complete: true, issues: [] }, context).supported, false);
  assert.equal(validateGroundingReview({ claims: [{ ...claim, text: `In winter, ${claim.text}` }], complete: true, issues: [] }, context).supported, true);
});

test("declining a callback does not hide requested public email addresses", () => {
  assert.equal(classifySovereignIntent("Please give both published email addresses, not a callback form."), "CONTACT_INFO");
  assert.equal(classifySovereignIntent("Please arrange a callback."), "HUMAN_REQUEST");
});

test("negated booking is not a requested factual answer part", () => {
  const question = "Do not book anything. Just tell me whether the camp welcomes pets.";
  assert.deepEqual(hotelQuestionParts(question), ["PETS"]);
  assert.deepEqual(missingHotelAnswerParts(question, "Yes, we are pet-friendly."), []);
  assert.ok(hotelQuestionParts("Are pets welcome and can I book a room?").includes("BOOKING"));
});

test("safe repair can remove an exact rejected sentence, never part of a factual sentence", () => {
  const review = { claims: [{ text: "The river has gentle currents.", supported: false }], issues: [] } as unknown as GroundingReview;
  assert.equal(pruneRejectedSentences("Body surfing is seasonal. The river has gentle currents.", review), "Body surfing is seasonal.");
  assert.equal(pruneRejectedSentences("The river has gentle currents.", review), null);
  assert.equal(pruneRejectedSentences("Body surfing is seasonal and the river has gentle currents.", review), null);
});
