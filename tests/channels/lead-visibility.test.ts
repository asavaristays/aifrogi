import assert from "node:assert/strict";
import test from "node:test";
import { gradeCapturedLead, isCapturedLead, leadGradeLabel } from "../../lib/lead-insights";

test("only a named, consented callback capture becomes a client lead", () => {
  assert.equal(isCapturedLead({ websiteSession: null }), false);
  assert.equal(isCapturedLead({ websiteSession: { status: "AI_READY", contactName: "Visitor", contactValue: "+91 90000 00000", consentedAt: null, lastDeliveredAt: null, lastReadAt: null } }), false);
  assert.equal(isCapturedLead({ websiteSession: { status: "HANDOFF_READY", contactName: "Visitor", contactValue: "+91 90000 00000", consentedAt: "2026-09-08T10:00:00.000Z", lastDeliveredAt: null, lastReadAt: null } }), true);
});

test("captured lead grades are deterministic and explainable", () => {
  assert.equal(gradeCapturedLead({ score: 91 }), "A");
  assert.equal(gradeCapturedLead({ score: 80 }), "A");
  assert.equal(gradeCapturedLead({ score: 79 }), "B");
  assert.equal(gradeCapturedLead({ score: 60 }), "B");
  assert.equal(gradeCapturedLead({ score: 59 }), "C");
  assert.equal(leadGradeLabel("A"), "Hot");
  assert.equal(leadGradeLabel("B"), "Warm");
  assert.equal(leadGradeLabel("C"), "Nurture");
});
