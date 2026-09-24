import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const MAX_STAY_DAYS = 31;
export type HotelGuestStayToken = { slug: string; requestId: string; roomNumber: string; guestName: string; checkIn: string; checkOut: string; exp: number };
export type HotelGuestRequestToken = { slug: string; requestId: string; exp: number };

function secret() {
  const value = process.env.WEBSITE_VISITOR_SESSION_SECRET?.trim() || process.env.AUTH_SESSION_SECRET?.trim();
  if (!value || value === "change-this-in-production") throw new Error("Website visitor session secret is not configured");
  return value;
}
function sign(scope: string, value: string) { return createHmac("sha256", secret()).update(`${scope}:${value}`, "utf8").digest("base64url"); }
function encode<T>(scope: string, payload: T) { const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url"); return `${encoded}.${sign(scope, encoded)}`; }
function decode<T>(scope: string, token: string): T | null {
  const [encoded, signature, extra] = token.split("."); if (!encoded || !signature || extra) return null;
  const actual = Buffer.from(signature); const expected = Buffer.from(sign(scope, encoded));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try { return JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T; } catch { return null; }
}
export function hashHotelGuestRequestToken(value: string) { return createHash("sha256").update(value, "utf8").digest("hex"); }
function validDateKey(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)); }
function validExactDateTime(value: string) { return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && !Number.isNaN(Date.parse(value)); }

export function validateHotelGuestStayInput(input: { roomNumber: unknown; guestName: unknown; checkIn: unknown; checkOut: unknown }, now = new Date()) {
  const roomNumber = String(input.roomNumber || "").trim().replace(/\s+/g, " ").slice(0, 24);
  const guestName = String(input.guestName || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const checkIn = String(input.checkIn || "").trim(); const checkOut = String(input.checkOut || "").trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .\-\/]{0,23}$/u.test(roomNumber)) return { ok: false as const, error: "Enter a valid room number." };
  if (!/^[\p{L}][\p{L} .'-]{1,99}$/u.test(guestName)) return { ok: false as const, error: "Enter the guest name used for this stay." };
  if (!validDateKey(checkIn) || !validExactDateTime(checkOut)) return { ok: false as const, error: "Enter a valid check-in date and checkout date and time." };
  const requestedCheckIn = new Date(`${checkIn}T00:00:00Z`); const requestedCheckOut = new Date(checkOut);
  const lengthDays = (requestedCheckOut.getTime() - requestedCheckIn.getTime()) / 86_400_000;
  if (lengthDays < 0 || lengthDays > MAX_STAY_DAYS) return { ok: false as const, error: `Stay access can cover at most ${MAX_STAY_DAYS} days.` };
  if (requestedCheckOut <= now) return { ok: false as const, error: "The submitted checkout time has already passed." };
  return { ok: true as const, value: { roomNumber, guestName, checkIn, checkOut, requestedCheckIn, requestedCheckOut } };
}
export function issueHotelGuestRequestToken(input: HotelGuestRequestToken) { return encode("hotelgpt-request", input); }
export function verifyHotelGuestRequestToken(token: string, slug: string) { const p = decode<HotelGuestRequestToken>("hotelgpt-request", token); return p && p.slug === slug && p.requestId && p.exp > Math.floor(Date.now() / 1000) ? p : null; }
export function issueHotelGuestStayToken(input: HotelGuestStayToken) { return encode("hotelgpt-stay", input); }
export function verifyHotelGuestStayToken(token: string, slug: string) { const p = decode<HotelGuestStayToken>("hotelgpt-stay", token); return p && p.slug === slug && p.requestId && p.roomNumber && p.guestName && p.exp > Math.floor(Date.now() / 1000) ? p : null; }
