import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PAID_PLAN, TRIAL_DAYS, TRIAL_UPGRADE_REMINDER_DAY, addTrialDays } from "../../lib/trial-policy";

test("trial policy expires after 15 days and converts toward Starter", () => {
  const start = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(TRIAL_DAYS, 15);
  assert.equal(TRIAL_UPGRADE_REMINDER_DAY, 13);
  assert.equal(DEFAULT_PAID_PLAN, "STARTER");
  assert.equal(addTrialDays(start).toISOString(), "2026-08-16T00:00:00.000Z");
});
