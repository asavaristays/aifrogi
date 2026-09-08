import test from "node:test";
import assert from "node:assert/strict";
import { containsUnsafeSupportSecret, structuredResolution, SUPPORT_STATUSES, supportSlaHours, supportSlaState } from "../../lib/support-policy";
import { getAdminSupportActions, getClientSupportUpdates } from "../../lib/support-notifications";

function ticket(overrides: Record<string, unknown> = {}) {
  const createdAt = new Date("2026-09-08T00:00:00Z");
  return {
    id: "ticket-1", reference: "LOS-20260908-TEST", subject: "Widget issue", priority: "NORMAL", status: "OPEN",
    createdAt, updatedAt: new Date("2026-09-08T01:00:00Z"), lastActivityBy: "CUSTOMER", lastClientViewedAt: createdAt,
    lastAdminViewedAt: null, organization: { name: "Example Client" }, messages: [{ body: "The widget stopped.", authorRole: "CUSTOMER", createdAt }], ...overrides
  };
}

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
test("client Today shows an admin response until the client acts", () => {
  const response = ticket({ status: "WAITING_FOR_CLIENT", lastActivityBy: "ADMIN", updatedAt: new Date("2026-09-08T02:00:00Z"), messages: [{ body: "Please confirm the installation URL.", authorRole: "ADMIN", createdAt: new Date("2026-09-08T02:00:00Z") }] });
  assert.equal(getClientSupportUpdates([response]).length, 1);
  assert.equal(getClientSupportUpdates([response])[0].action, "View and reply");
  assert.equal(getClientSupportUpdates([ticket({ status: "CLOSED" })]).length, 0);
});
test("Command Center shows new client activity but not tickets waiting on the client", () => {
  assert.equal(getAdminSupportActions([ticket()]).length, 1);
  assert.equal(getAdminSupportActions([ticket({ status: "WAITING_FOR_CLIENT", lastActivityBy: "ADMIN" })]).length, 0);
});
