import assert from "node:assert/strict";
import test from "node:test";
import { buildHumanResponseReport } from "../../lib/human-response-sla";
import type { Lead } from "../../types";

function lead(id: string, minutesAgo: number, from: "guest" | "agent" = "guest"): Lead {
  const sent = new Date(Date.UTC(2026, 7, 29, 10, 0) - minutesAgo * 60000);
  return { id, name: id, initials: "T", score: 50, source: "Website", stage: "NEW", minutesAgo, language: "EN", intent: "Test", stay: "", party: "", budget: "", phone: "", updatedAtLabel: "", updatedAtIso: sent.toISOString(), tags: [], isHighPriority: false, transcript: [{ id: `${id}-m`, from, text: "Please help", time: "", sentAtIso: sent.toISOString(), status: null }] };
}

test("response SLA separates waiting reminder and overdue conversations", () => {
  const now = new Date(Date.UTC(2026, 7, 29, 10, 0));
  const report = buildHumanResponseReport({ leads: [lead("waiting", 10), lead("reminder", 35), lead("overdue", 70), lead("answered", 90, "agent")], slaMinutes: 60, reminderPercent: 50, fallbackEnabled: true, now });
  assert.equal(report.waiting, 3);
  assert.equal(report.reminder, 1);
  assert.equal(report.overdue, 1);
  assert.equal(report.fallbackEligible, 1);
  assert.equal(report.items[0]?.leadId, "overdue");
});

test("fallback remains reporting-only when disabled", () => {
  const report = buildHumanResponseReport({ leads: [lead("overdue", 70)], slaMinutes: 60, fallbackEnabled: false, now: new Date(Date.UTC(2026, 7, 29, 10, 0)) });
  assert.equal(report.overdue, 1);
  assert.equal(report.fallbackEligible, 0);
});
