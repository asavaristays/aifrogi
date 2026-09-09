import test from "node:test";
import assert from "node:assert/strict";
import { dateLabelForTimeZone, greetingForTimeZone, validTimeZone } from "../../lib/greeting";

test("shared greeting policy follows the requested IANA timezone", () => {
  const now = new Date("2026-09-08T16:00:00.000Z");
  assert.equal(greetingForTimeZone("Asia/Kolkata", now), "Good evening");
  assert.equal(greetingForTimeZone("America/New_York", now), "Good afternoon");
});

test("greeting boundaries are morning, afternoon and evening", () => {
  assert.equal(greetingForTimeZone("UTC", new Date("2026-09-08T11:59:00Z")), "Good morning");
  assert.equal(greetingForTimeZone("UTC", new Date("2026-09-08T12:00:00Z")), "Good afternoon");
  assert.equal(greetingForTimeZone("UTC", new Date("2026-09-08T17:00:00Z")), "Good evening");
});

test("invalid visitor timezones safely fall back to the business default", () => {
  assert.equal(validTimeZone("not/a-zone", "Europe/London"), "Europe/London");
  assert.match(dateLabelForTimeZone("not/a-zone", new Date("2026-09-08T23:30:00Z")), /Wednesday|Tuesday/);
});
