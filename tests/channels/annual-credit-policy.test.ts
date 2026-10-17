import assert from "node:assert/strict";
import test from "node:test";
import { annualCreditWindows, usesMonthlyCredits, monthlyCreditUsage } from "../../lib/annual-credit-policy";

test("Monthly allowances apply only to the newly offered annual plans", () => {
  assert.equal(usesMonthlyCredits("AI_STARTER_YEARLY_2026"), true);
  assert.equal(usesMonthlyCredits("HOTELGPT_YEARLY_2026"), true);
  for (const code of ["AI_STARTER_YEARLY", "AI_STARTER_MONTHLY", "TRIAL"]) assert.equal(usesMonthlyCredits(code), false);
});

test("Anniversary windows clamp January 31 in February without March drift", () => {
  const windows = annualCreditWindows(new Date("2026-01-31T10:15:00Z"), new Date("2027-01-31T10:15:00Z"), new Date("2026-03-31T10:15:00Z"));
  assert.deepEqual(windows.map(w => [w.start.toISOString(), w.end.toISOString()]), [
    ["2026-01-31T10:15:00.000Z", "2026-02-28T10:15:00.000Z"],
    ["2026-02-28T10:15:00.000Z", "2026-03-31T10:15:00.000Z"],
    ["2026-03-31T10:15:00.000Z", "2026-04-30T10:15:00.000Z"]
  ]);
});

test("Leap day anniversaries and annual end do not grant a thirteenth allowance", () => {
  const start = new Date("2024-02-29T00:00:00Z"), end = new Date("2025-02-28T00:00:00Z");
  const windows = annualCreditWindows(start, end, end);
  assert.equal(windows.length, 12);
  assert.equal(windows.at(-1)?.end.toISOString(), end.toISOString());
  assert.equal(annualCreditWindows(start, end, new Date("2024-02-28T00:00:00Z")).length, 0);
});


test("Monthly reset does not revive spent add-on credits or roll over unused plan credits", () => {
  assert.deepEqual(monthlyCreditUsage([4200, 4500, 100], 4000), { current: 100, previousOverage: 700 });
  assert.deepEqual(monthlyCreditUsage([100, 4000], 4000), { current: 4000, previousOverage: 0 });
  assert.deepEqual(monthlyCreditUsage([5100, 500], 5000), { current: 500, previousOverage: 100 });
  assert.deepEqual(monthlyCreditUsage([], 4000), { current: 0, previousOverage: 0 });
});
