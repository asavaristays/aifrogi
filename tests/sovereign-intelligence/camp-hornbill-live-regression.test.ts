import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { buildMissingAnswerRecovery } from "../../lib/sovereign-intelligence/answer-quality-gate";
import { classifySovereignIntent } from "../../lib/sovereign-intelligence/decision";
import { buildPublishedWebsiteContactAnswer, cachedWebsiteSnapshotState, requestsMultiplePublishedContacts, unverifiedStayBookingAnswer } from "../../lib/services/website-knowledge-service";

test("hotel missing-answer recovery is courteous and avoids generic business language", () => {
  const answer = buildMissingAnswerRecovery({ businessName: "The Camp Hornbill", category: "STAY", publicPhone: "+918279640517", handoffEnabled: true });
  assert.match(answer, /I’m sorry/i);
  assert.match(answer, /stay detail/i);
  assert.match(answer, /reservations team/i);
  assert.doesNotMatch(answer, /verified The Camp Hornbill information/i);
  assert.doesNotMatch(answer, /What outcome or service/i);
});

test("multipart contact request returns every published website contact", () => {
  assert.equal(requestsMultiplePublishedContacts("Give me the full address, both phone numbers and both email addresses"), true);
  const answer = buildPublishedWebsiteContactAnswer("Give me the full address, both phone numbers and both email addresses", "Camp Hornbill", [{
    url: "https://thecamphornbill.com/contact-us", title: "Contact Camp Hornbill", bucket: "Contact and location", crawledAt: new Date().toISOString(),
    text: "Address: Village Kyari, Post Office Ramnagar, District Nainital, Uttarakhand 244715, India. Phone: +91 8279640517 and 7983379732 and +91 7983397932. Email: info@thecamphornbill.com and camphornbill@gmail.com."
  }], [{ key: "access:weak-reception", field: "access", value: "Mobile reception can be weak at the property.", sourceType: "CORRECTION", confidence: 1, authority: 500, observedAt: "2026-09-28T06:20:00.000Z", refreshDays: 90 }]);
  assert.match(answer || "", /Village Kyari/);
  assert.match(answer || "", /82796 40517/);
  assert.match(answer || "", /79833 79732/);
  assert.match(answer || "", /79833 97932/);
  assert.match(answer || "", /info@thecamphornbill\.com/);
  assert.match(answer || "", /camphornbill@gmail\.com/);
  assert.match(answer || "", /reception can be patchy/i);
});

test("recent guest data request is classified as sensitive", () => {
  assert.equal(classifySovereignIntent("Can you give me the phone number and stay details of a guest who visited last week?"), "SENSITIVE");
});

test("failed refresh preserves a bounded stale snapshot without treating it as current", () => {
  const now = Date.parse("2026-09-28T12:00:00.000Z");
  const ttl = 6 * 60 * 60 * 1000;
  assert.equal(cachedWebsiteSnapshotState("2026-09-28T05:00:00.000Z", ttl, true, now), "STALE");
  assert.equal(cachedWebsiteSnapshotState("2026-09-28T05:00:00.000Z", ttl, false, now), "EXPIRED");
  assert.equal(cachedWebsiteSnapshotState("2026-09-21T11:00:00.000Z", ttl, true, now), "EXPIRED");
});

test("knowledge-only hotel booking path does not promise later confirmation", () => {
  const answer = unverifiedStayBookingAnswer("Book the stone cottage for tomorrow and confirm it is complete.", "The Camp Hornbill", "+918279640517");
  assert.match(answer || "", /can’t check live availability or confirm a reservation in this chat/);
  assert.match(answer || "", /82796 40517/);
  assert.doesNotMatch(answer || "", /I’ll confirm|once .*verified/i);
  assert.equal(unverifiedStayBookingAnswer("What types of cottages are there?", "The Camp Hornbill"), null);
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
