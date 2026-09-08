import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BOT_ANSWER_CONSTITUTION, buildCustomerFacingIdentity, buildWarmGreeting, classifyWebsiteQuestion, publishedClaimFallback, resolveWebsiteKnowledgeQuestion, scoreWebsiteKnowledgePage } from "../../lib/services/website-knowledge-service";
import { classifySovereignIntent, resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";
import { RELIABILITY_FRAMEWORK_VERSION } from "../../lib/reliability/runtime";

const source = readFileSync(resolve(process.cwd(), "lib/services/website-knowledge-service.ts"), "utf8");

test("partner knowledge ranking boosts automation and hospitality intent", () => {
  assert.match(source, /asksAutomation/);
  assert.match(source, /asksHospitality/);
  assert.match(source, /ai-automation\|ai-solutions/);
});

test("unrequested filmmaking and training pages are demoted", () => {
  assert.match(source, /score -= 12/g);
});

test("current partner automation and hotel solution paths are seeded for refresh", () => {
  assert.match(source, /"\/ai-automation\/"/);
  assert.match(source, /"\/ai-solutions\/"/);
  assert.match(source, /"\/channel-manager\/"/);
});

test("training booking intent selects the active training route over the hotel booking engine", () => {
  const crawledAt = new Date().toISOString();
  const training = scoreWebsiteKnowledgePage({ url: "https://webtechnosys.com/training-booking/", title: "AI Training Booking", bucket: "Training", text: "Register for an upcoming AI skill training workshop.", crawledAt }, "Give me the link to book the upcoming training");
  const hotel = scoreWebsiteKnowledgePage({ url: "https://webtechnosys.com/booking-engine/", title: "Hotel Booking Engine", bucket: "Hospitality", text: "Direct hotel room booking engine.", crawledAt }, "Give me the link to book the upcoming training");
  assert.ok(training > hotel + 40);
  assert.match(source, /"\/training-booking\/"/);
  assert.match(source, /Never substitute a different booking, training, product, or contact URL/);
});

test("citations exclude weak matches relative to the best approved source", () => {
  assert.match(source, /relevanceFloor/);
  assert.match(source, /score \* 0\.8/);
  assert.match(source, /item\.score >= relevanceFloor/);
});

test("website intent routing separates identity, off-topic, and business questions", () => {
  assert.equal(classifyWebsiteQuestion("Who are you?"), "IDENTITY");
  assert.equal(classifyWebsiteQuestion("What is the weather today?"), "OFF_TOPIC");
  assert.equal(classifyWebsiteQuestion("Do you have upcoming AI training?"), "BUSINESS");
});

test("greetings mirror the visitor warmly without exposing governance language", () => {
  const answer = buildWarmGreeting("Good Morning", "Webtechnosys AI Bot");
  assert.match(answer, /^Good morning!/);
  assert.match(answer, /welcome/i);
  assert.match(answer, /how can I help today/i);
  assert.doesNotMatch(answer, /approved questions|knowledge base|policy/i);
  assert.equal((answer.match(/Webtechnosys AI Bot/g) || []).length, 1);
});

test("identity is human-readable and hides platform and governance terminology", () => {
  const answer = buildCustomerFacingIdentity("Webtechnosys AI Bot", "Webtechnosys");
  assert.match(answer, /online assistant for Webtechnosys/i);
  assert.match(answer, /bring in the team/i);
  assert.doesNotMatch(answer, /AiFrogi-powered|approved business knowledge|qualif|human judgment|governed/i);
});

test("shared tone standard prevents repetitive selling while protecting precise boundaries", () => {
  assert.match(BOT_ANSWER_CONSTITUTION, /does not need a sales question/i);
  assert.match(BOT_ANSWER_CONSTITUTION, /genuine commercial intent/i);
  assert.match(BOT_ANSWER_CONSTITUTION, /prefer calm precision/i);
  assert.match(BOT_ANSWER_CONSTITUTION, /never expose internal governance/i);
});

test("model failure serves the best selected published claim without inventing an answer", () => {
  const answer = publishedClaimFallback({
    context: "approved",
    claimIds: ["training"],
    candidates: [{ claimId: "training", claimKey: "training", score: 0.8, selected: true, status: "PUBLISHED", answer: "Our approved AI training programme is available for business teams." }],
    nearMissClaimIds: [],
    blockedState: null
  }, {
    frameworkVersion: RELIABILITY_FRAMEWORK_VERSION,
    failureLayer: "MODEL",
    failureCode: "MODEL_TIMEOUT",
    latencyMs: 4500,
    attemptCount: 2,
    escalationTier: "TIER_2_AIFROGI_ASYNC",
    degradedMode: true
  }, resolveSovereignQuestion("I am interested in training"));
  assert.equal(answer?.answer, "Our approved AI training programme is available for business teams.");
  assert.equal(answer?.model, "APPROVED_CLAIM_FALLBACK");
  assert.deepEqual(answer?.claimIds, ["training"]);
  assert.equal(answer?.decision.disposition, "ANSWER");
});

test("ordinary sports-result wording remains outside the business bot domain", () => {
  assert.equal(classifySovereignIntent("Who won the football match?"), "OFF_TOPIC");
});

test("contact information remains distinct from a human callback request", () => {
  assert.equal(classifyWebsiteQuestion("Please share contact details"), "CONTACT_INFO");
  assert.equal(classifyWebsiteQuestion("What is your contact number?"), "CONTACT_INFO");
  assert.equal(classifyWebsiteQuestion("Where are you based?"), "CONTACT_INFO");
  assert.equal(classifyWebsiteQuestion("Please contact me"), "HUMAN_REQUEST");
});

test("context follow-up reuses the latest relevant question but skips weather", () => {
  const resolved = resolveWebsiteKnowledgeQuestion("You already have context", ["What is the weather today?", "Do you have upcoming training?"]);
  assert.equal(resolved.retrievalQuestion, "Do you have upcoming training?");
  assert.equal(resolved.priorQuestion, "Do you have upcoming training?");
});

test("short booking-link follow-up retains the prior training intent", () => {
  const resolved = resolveWebsiteKnowledgeQuestion("Give me the link to book", ["What upcoming AI training can I book?"]);
  assert.equal(resolved.intent, "CONTEXT_FOLLOW_UP");
  assert.equal(resolved.retrievalQuestion, "What upcoming AI training can I book?");
});

test("crawler prioritizes sitemap inventory before legacy seeds", () => {
  assert.match(source, /baseUrl, \.\.\.priorityUrls, \.\.\.sitemapUrls, \.\.\.homepageLinks, \.\.\.seedUrls/);
  assert.match(source, /MAX_DISCOVERY_URLS = 120/);
  assert.match(source, /pages\.length >= MAX_PAGES/);
});

test("crawler preserves approved JSON-LD and meta-description business facts", () => {
  assert.match(source, /application\\\/ld\\\+json/);
  assert.match(source, /structuredDataText\(html\)/);
  assert.match(source, /name=\["'\]description/);
  assert.match(source, /JSON\.parse\(match\[1\]\)/);
});
