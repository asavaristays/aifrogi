import { createHmac, timingSafeEqual } from "node:crypto";

const MAX_STAY_DAYS = 31;

export type HotelGuestStayToken = {
  slug: string;
  roomNumber: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  exp: number;
};

function secret() {
  const value = process.env.WEBSITE_VISITOR_SESSION_SECRET?.trim() || process.env.AUTH_SESSION_SECRET?.trim();
  if (!value || value === "change-this-in-production") throw new Error("Website visitor session secret is not configured");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(`hotelgpt-stay:${value}`, "utf8").digest("base64url");
}

export function propertyDateKey(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function validDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function checkoutExpiry(checkOut: string, timeZone: string) {
  const target = Date.parse(`${checkOut}T12:00:00Z`);
  // Find the first hour after the declared checkout date in the property's timezone.
  for (let offset = -18; offset <= 36; offset += 1) {
    const candidate = new Date(target + offset * 60 * 60 * 1000);
    if (propertyDateKey(candidate, timeZone) > checkOut) return Math.floor(candidate.getTime() / 1000);
  }
  return Math.floor(Date.parse(`${checkOut}T23:59:59Z`) / 1000);
}

export function validateHotelGuestStayInput(input: { roomNumber: unknown; guestName: unknown; checkIn: unknown; checkOut: unknown }, timeZone: string, now = new Date()) {
  const roomNumber = String(input.roomNumber || "").trim().replace(/\s+/g, " ").slice(0, 24);
  const guestName = String(input.guestName || "").trim().replace(/\s+/g, " ").slice(0, 100);
  const checkIn = String(input.checkIn || "").trim();
  const checkOut = String(input.checkOut || "").trim();
  if (!/^[\p{L}\p{N}][\p{L}\p{N} .\-\/]{0,23}$/u.test(roomNumber)) return { ok: false as const, error: "Enter a valid room number." };
  if (!/^[\p{L}][\p{L} .'-]{1,99}$/u.test(guestName)) return { ok: false as const, error: "Enter the guest name used for this stay." };
  if (!validDateKey(checkIn) || !validDateKey(checkOut) || checkOut < checkIn) return { ok: false as const, error: "Enter a valid check-in and checkout period." };
  const lengthDays = Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86_400_000);
  if (lengthDays < 0 || lengthDays > MAX_STAY_DAYS) return { ok: false as const, error: `Stay access can cover at most ${MAX_STAY_DAYS} days.` };
  const today = propertyDateKey(now, timeZone);
  if (today < checkIn) return { ok: false as const, error: "Stay access begins on the submitted check-in date." };
  if (today > checkOut) return { ok: false as const, error: "This submitted stay period has ended." };
  return { ok: true as const, value: { roomNumber, guestName, checkIn, checkOut, exp: checkoutExpiry(checkOut, timeZone) } };
}

export function issueHotelGuestStayToken(input: Omit<HotelGuestStayToken, "exp"> & { exp: number }) {
  const encoded = Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifyHotelGuestStayToken(token: string, expectedSlug: string): HotelGuestStayToken | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const actual = Buffer.from(signature);
  const expected = Buffer.from(sign(encoded));
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as HotelGuestStayToken;
    if (payload.slug !== expectedSlug || !payload.roomNumber || !payload.guestName || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
