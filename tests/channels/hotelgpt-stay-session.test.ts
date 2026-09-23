import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { issueHotelGuestStayToken, validateHotelGuestStayInput, verifyHotelGuestStayToken } from "../../lib/hotelgpt-stay-session";

process.env.WEBSITE_VISITOR_SESSION_SECRET = "hotelgpt-stay-test-secret";

test("accepts a stay request with an exact checkout date and time", () => {
  const result = validateHotelGuestStayInput({ roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2026-09-25T11:00:00.000+05:30" }, new Date("2026-09-23T12:00:00Z"));
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.value.roomNumber, "204");
});

test("rejects future, expired, reversed and excessive stay windows", () => {
  const now = new Date("2026-09-23T12:00:00Z");
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-23", checkOut: "2026-09-22T11:00:00Z" }, now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-23", checkOut: "2026-09-23T10:00:00Z" }, now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-01", checkOut: "2026-10-20T11:00:00Z" }, now).ok, false);
  assert.equal(validateHotelGuestStayInput({ roomNumber: "1", guestName: "Guest Name", checkIn: "2026-09-23", checkOut: "2026-09-25" }, now).ok, false);
});

test("stay capability is property-bound, signed and expires", () => {
  const token = issueHotelGuestStayToken({ slug: "hotel-a", requestId: "request-a", roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2099-09-25", exp: Math.floor(Date.now() / 1000) + 60 });
  assert.equal(verifyHotelGuestStayToken(token, "hotel-a")?.roomNumber, "204");
  assert.equal(verifyHotelGuestStayToken(token, "hotel-b"), null);
  assert.equal(verifyHotelGuestStayToken(`${token}x`, "hotel-a"), null);
  const expired = issueHotelGuestStayToken({ slug: "hotel-a", requestId: "request-a", roomNumber: "204", guestName: "Asha Mehta", checkIn: "2026-09-23", checkOut: "2026-09-25", exp: Math.floor(Date.now() / 1000) - 1 });
  assert.equal(verifyHotelGuestStayToken(expired, "hotel-a"), null);
});

test("resident entry is HotelGPT-only and resident expiry survives token refresh", () => {
  const entryRoute = readFileSync(resolve(process.cwd(), "app/api/public/hotelgpt-stay/[slug]/session/route.ts"), "utf8");
  const botRoute = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");
  assert.match(entryRoute, /profile\.category !== "STAY"/);
  assert.match(botRoute, /residentStay\?\.exp \|\| residentSessionExpiry/);
  assert.match(botRoute, /status='APPROVED'/);
  assert.match(entryRoute, /Awaiting front desk approval/);
  assert.doesNotMatch(entryRoute, /PMS|booking reference/i);
});

test("front-desk approval is privileged, origin-protected and tenant-scoped", () => {
  const accessRoute = readFileSync(resolve(process.cwd(), "app/api/hotelgpt-stay/access/route.ts"), "utf8");
  const migration = readFileSync(resolve(process.cwd(), "prisma/migrations/20260923180000_hotelgpt_guest_access/migration.sql"), "utf8");
  assert.match(accessRoute, /requireManage: true/);
  assert.match(accessRoute, /Cross-origin request denied/);
  assert.match(accessRoute, /botProfile\?\.category !== "STAY"/);
  assert.match(accessRoute, /propertyId"=\$\{access\.propertyId\}/);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /FORCE ROW LEVEL SECURITY/);
});
