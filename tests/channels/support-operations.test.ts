import test from "node:test";
import assert from "node:assert/strict";
import { containsUnsafeSupportSecret, structuredResolution, SUPPORT_STATUSES, supportSlaHours, supportSlaState } from "../../lib/support-policy";

test("support lifecycle has explicit operational states", () => {
  assert.deepEqual(SUPPORT_STATUSES, ["OPEN", "ACKNOWLEDGED", "INVESTIGATING", "WAITING_FOR_CLIENT", "RESOLVED", "CLOSED"]);
});
test("urgent tickets have one-hour acknowledgement and eight-hour resolution targets", () => {
  assert.deepEqual(supportSlaHours("URGENT"), { acknowledge: 1, resolve: 8 });
  const createdAt = new Date("2026-09-01T00:00:00Z");
  const state = supportSlaState({ priority: "URGENT", status: "OPEN", createdAt, updatedAt: createdAt }, new Date("2026-09-01T02:00:00Z"));
  assert.equal(state.acknowledgmentOverdue, true); assert.equal(state.resolutionOverdue, false);
});
test("support messages reject common secrets", () => {
  assert.equal(containsUnsafeSupportSecret("password: hunter123"), true);
  assert.equal(containsUnsafeSupportSecret("Bearer abcdefghijklmnop"), true);
  assert.equal(containsUnsafeSupportSecret("The bot stopped after I changed the FAQ."), false);
});
test("resolution records are structured and evidence-led", () => {
  const record = structuredResolution({ cause: "Expired claim", action: "Paused and replaced", verification: "Replay 12/12 passed", prevention: "Expiry alert enabled" });
  for (const section of ["CAUSE", "ACTION TAKEN", "VERIFICATION EVIDENCE", "PREVENTION"]) assert.match(record, new RegExp(section));
});
