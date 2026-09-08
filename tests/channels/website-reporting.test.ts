import test from "node:test";
import assert from "node:assert/strict";
import type { Lead } from "../../types";
import { resolveReportPeriod, websiteLeadsForPeriod, websiteOutcomeSummary } from "../../lib/website-reporting";

function lead(overrides: Partial<Lead> = {}): Lead {
  return {
    id: "lead-1", name: "Visitor", initials: "V", score: 70, source: "website_ai_bot", stage: "New", minutesAgo: 1,
    language: "EN", intent: "Pricing", stay: "", party: "", budget: "", phone: "", updatedAtLabel: "", updatedAtIso: "2026-09-08T05:00:00.000Z", tags: [],
    websiteSession: { status: "AI_READY", contactName: "Visitor", contactValue: "+919999999999", consentedAt: "2026-09-08T05:00:00.000Z", lastDeliveredAt: null, lastReadAt: null },
    transcript: [{ id: "m1", from: "guest", text: "Pricing?", time: "", sentAtIso: "2026-09-08T04:00:00.000Z" }], ...overrides
  };
}

test("report periods use the India day boundary", () => {
  const period = resolveReportPeriod("today", new Date("2026-09-08T06:00:00.000Z"));
  assert.equal(period.since?.toISOString(), "2026-09-07T18:30:00.000Z");
  assert.equal(period.label, "Today");
});

test("website report excludes non-website and out-of-period activity", () => {
  const since = new Date("2026-09-08T00:00:00.000Z");
  const old = lead({ id: "old", transcript: [{ id: "old-m", from: "guest", text: "Old", time: "", sentAtIso: "2026-09-07T23:00:00.000Z" }] });
  const whatsapp = lead({ id: "wa", source: "whatsapp", websiteSession: null });
  assert.deepEqual(websiteLeadsForPeriod([lead(), old, whatsapp], since).map((item) => item.id), ["lead-1"]);
});

test("qualification and contact capture are calculated from stored lead state", () => {
  const summary = websiteOutcomeSummary([lead(), lead({ id: "low", score: 20, websiteSession: null })]);
  assert.deepEqual(summary, { qualified: 1, captured: 1, qualificationRate: 50, captureRate: 50 });
});
