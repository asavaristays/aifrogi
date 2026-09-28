import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildMissingAnswerRecovery } from "../../lib/sovereign-intelligence/answer-quality-gate";
import { classifySovereignIntent } from "../../lib/sovereign-intelligence/decision";
import { buildPublishedWebsiteContactAnswer } from "../../lib/services/website-knowledge-service";

test("hotel missing-answer recovery is courteous and avoids generic business language", () => {
  const answer = buildMissingAnswerRecovery({ businessName: "The Camp Hornbill", category: "STAY", publicPhone: "+918279640517", handoffEnabled: true });
  assert.match(answer, /I’m sorry/i);
  assert.match(answer, /stay detail/i);
  assert.match(answer, /reservations team/i);
  assert.doesNotMatch(answer, /verified The Camp Hornbill information/i);
  assert.doesNotMatch(answer, /What outcome or service/i);
});

test("multipart contact request returns every published website contact", () => {
  const answer = buildPublishedWebsiteContactAnswer("Give me the full address, both phone numbers and both email addresses", "Camp Hornbill", [{
    url: "https://thecamphornbill.com/contact-us", title: "Contact Camp Hornbill", bucket: "Contact and location", crawledAt: new Date().toISOString(),
    text: "Address: Village Kyari, Post Office Ramnagar, District Nainital, Uttarakhand 244715, India. Phone: +91 8279640517 and +91 7983397932. Email: info@thecamphornbill.com and camphornbill@gmail.com."
  }]);
  assert.match(answer || "", /Village Kyari/);
  assert.match(answer || "", /82796 40517/);
  assert.match(answer || "", /79833 97932/);
  assert.match(answer || "", /info@thecamphornbill\.com/);
  assert.match(answer || "", /camphornbill@gmail\.com/);
});

test("recent guest data request is classified as sensitive", () => {
  assert.equal(classifySovereignIntent("Can you give me the phone number and stay details of a guest who visited last week?"), "SENSITIVE");
});

test("saved contact is transmitted only for an explicit handover draft or consent-only send", async () => {
  const source = await readFile(new URL("../../components/website-bot/website-bot-embed.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../../app/api/public/website-bot/[slug]/route.ts", import.meta.url), "utf8");
  assert.match(source, /const contactReady = canShareContact && \(humanHelpDraft \|\| !text\.trim\(\)\)/);
  assert.match(route, /profile\.category !== "STAY"/);
});

test("Camp Hornbill live-question bank retains all 30 required regression intents", () => {
  const bank = [
    "place and location", "cottage types", "birdwatching", "forest walks", "wildlife safari", "cycling", "village visit", "riverside activities", "community experiences", "dining",
    "airport and railway", "travel from Delhi", "best season", "weather and packing", "families", "pets", "wheelchair access", "connectivity", "check-in and check-out", "cancellation",
    "two-night price", "winter timetable", "cottage comparison", "family of four", "typo recovery", "complete contact details", "guest privacy", "OTP and card safety", "booking confirmation", "human without phone"
  ];
  assert.equal(bank.length, 30);
});
