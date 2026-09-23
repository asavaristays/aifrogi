import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { issueHotelGuestStayToken, validateHotelGuestStayInput, verifyHotelGuestStayToken } from "../../lib/hotelgpt-stay-session";

process.env.WEBSITE_VISITOR_SESSION_SECRET = "hotelgpt-stay-test-secret";

test("accepts a guest-declared stay active on the property date", () => {
  const result = validateHotelGuestStayInput({ roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2026-09-25" }, "Asia/Kolkata", new Date("2026-09-23T12:00:00Z"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.roomNumber, "204");
});

test("rejects future, expired, reversed and excessive stay windows", () => {
  const now = new Date("2026-09-23T12:00:00Z");
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-24", checkOut: "2026-09-25" }, "Asia/Kolkata", now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-20", checkOut: "2026-09-22" }, "Asia/Kolkata", now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-23", checkOut: "2026-09-22" }, "Asia/Kolkata", now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-01", checkOut: "2026-10-20" }, "Asia/Kolkata", now).ok, false);
});

test("stay capability is property-bound, signed and expires", () => {
  const token = issueHotelGuestStayToken({ slug: "hotel-a", roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2099-09-25", exp: Math.floor(Date.now() / 1000) + 60 });
  assert.equal(verifyHotelGuestStayToken(token, "hotel-a")?.roomNumber, "204");
  assert.equal(verifyHotelGuestStayToken(token, "hotel-b"), null);
  assert.equal(verifyHotelGuestStayToken(`${token}x`, "hotel-a"), null);
  const expired = issueHotelGuestStayToken({ slug: "hotel-a", roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2026-09-25", exp: Math.floor(Date.now() / 1000) - 1 });
  assert.equal(verifyHotelGuestStayToken(expired, "hotel-a"), null);
});

test("resident entry is HotelGPT-only and resident expiry survives token refresh", () => {
  const entryRoute = readFileSync(resolve(process.cwd(), "app/api/public/hotelgpt-stay/[slug]/session/route.ts"), "utf8");
  const botRoute = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");
  assert.match(entryRoute, /profile\.category !== "STAY"/);
  assert.match(botRoute, /residentStay\?\.exp \|\| residentSessionExpiry/);
  assert.match(botRoute, /verification: "GUEST_DECLARED"/);
  assert.doesNotMatch(entryRoute, /PMS|booking reference|manual approval/i);
});
