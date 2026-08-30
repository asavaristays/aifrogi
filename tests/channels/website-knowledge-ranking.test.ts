import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { classifyWebsiteQuestion, resolveWebsiteKnowledgeQuestion, scoreWebsiteKnowledgePage } from "../../lib/services/website-knowledge-service";

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

test("context follow-up reuses the latest relevant question but skips weather", () => {
  const resolved = resolveWebsiteKnowledgeQuestion("You already have context", ["What is the weather today?", "Do you have upcoming training?"]);
  assert.equal(resolved.retrievalQuestion, "Do you have upcoming training?");
  assert.equal(resolved.priorQuestion, "Do you have upcoming training?");
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
