export const CORE_ENTITY_VERSION = "1.0" as const;

export type CoreEntityKind = "PHONE" | "EMAIL" | "PINCODE" | "DATE" | "TIME" | "CURRENCY" | "QUANTITY" | "BOOKING_REFERENCE";
export type CoreEntity = { kind: CoreEntityKind; raw: string; normalized: string; confidence: number };

const MONTHS: Record<string, string> = { jan: "01", january: "01", feb: "02", february: "02", mar: "03", march: "03", apr: "04", april: "04", may: "05", jun: "06", june: "06", jul: "07", july: "07", aug: "08", august: "08", sep: "09", sept: "09", september: "09", oct: "10", october: "10", nov: "11", november: "11", dec: "12", december: "12" };

function unique(entities: CoreEntity[]) {
  const seen = new Set<string>();
  return entities.filter((entity) => { const key = `${entity.kind}:${entity.normalized}`; if (seen.has(key)) return false; seen.add(key); return true; });
}

function normalizePhone(raw: string, countryCode: string) {
  const digits = raw.replace(/\D/g, "");
  if (countryCode === "IN") {
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) return `+${digits}`;
  }
  if (raw.trim().startsWith("+") && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return "";
}

function normalizeDate(raw: string, locale: string) {
  const numeric = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$/);
  if (numeric) {
    const dayFirst = locale.toLowerCase() !== "en-us";
    const day = Number(dayFirst ? numeric[1] : numeric[2]);
    const month = Number(dayFirst ? numeric[2] : numeric[1]);
    let year = Number(numeric[3]); if (year < 100) year += 2000;
    if (month >= 1 && month <= 12 && day >= 1 && day <= new Date(year, month, 0).getDate()) return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return "";
  }
  const named = raw.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+(\d{4}))?$/i);
  if (named && MONTHS[named[2].toLowerCase()]) return `${named[3] || new Date().getFullYear()}-${MONTHS[named[2].toLowerCase()]}-${String(Number(named[1])).padStart(2, "0")}`;
  return raw.toLowerCase();
}

export function extractCoreEntities(text: string, options: { countryCode?: string; locale?: string } = {}) {
  const countryCode = options.countryCode || "IN";
  const locale = options.locale || "en-IN";
  const entities: CoreEntity[] = [];
  const add = (kind: CoreEntityKind, raw: string, normalized: string, confidence = 0.98) => { if (normalized) entities.push({ kind, raw, normalized, confidence }); };

  for (const match of text.matchAll(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi)) add("EMAIL", match[0], match[0].toLowerCase());
  for (const match of text.matchAll(/(?:\+?91[\s-]?)?[6-9](?:[\s-]?\d){9}\b/g)) add("PHONE", match[0], normalizePhone(match[0], countryCode));
  for (const match of text.matchAll(/\b(?:pin(?:code)?\s*(?:is|:)?\s*)?(\d{6})\b/gi)) {
    const explicitlyPin = /^pin/i.test(match[0]);
    if (explicitlyPin || !entities.some((item) => item.kind === "PHONE" && item.raw.includes(match[1]))) add("PINCODE", match[0], match[1], explicitlyPin ? 0.99 : 0.8);
  }
  for (const match of text.matchAll(/\b(?:today|tomorrow|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|\d{1,2}[/-]\d{1,2}[/-](?:\d{2}|\d{4})|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)(?:\s+\d{4})?)\b/gi)) add("DATE", match[0], normalizeDate(match[0], locale), /^\d/.test(match[0]) ? 0.96 : 0.9);
  for (const match of text.matchAll(/\b(?:[01]?\d|2[0-3]):[0-5]\d(?:\s*[ap]m)?\b|\b(?:1[0-2]|0?[1-9])(?:\s*[ap]m)\b/gi)) add("TIME", match[0], match[0].toLowerCase().replace(/\s+/g, ""), 0.94);
  for (const match of text.matchAll(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\.\d{1,2})?)/gi)) {
    const symbol = /^\$/i.test(match[0]) ? "USD" : "INR";
    add("CURRENCY", match[0], `${symbol} ${match[1].replace(/,/g, "")}`);
  }
  for (const match of text.matchAll(/\b(\d+)\s*(guests?|adults?|children|kids?|rooms?|nights?|days?|people|persons?|pax)\b/gi)) add("QUANTITY", match[0], `${match[1]} ${match[2].toLowerCase()}`, 0.96);
  for (const match of text.matchAll(/\b(?:booking|reservation|reference|ref)\s*(?:id|no\.?|number|#|:)?\s*([A-Z0-9-]{5,24})\b/gi)) add("BOOKING_REFERENCE", match[0], match[1].toUpperCase(), 0.96);
  return unique(entities);
}

export function coreEntityFacts(entities: CoreEntity[], options: { consentContact?: boolean } = {}) {
  const facts: Record<string, string> = {};
  const latest = (kind: CoreEntityKind) => entities.filter((item) => item.kind === kind).at(-1)?.normalized;
  for (const [kind, slot] of [["DATE", "date"], ["TIME", "time"], ["CURRENCY", "currency"], ["QUANTITY", "quantity"], ["BOOKING_REFERENCE", "bookingReference"], ["PINCODE", "pincode"]] as const) {
    const value = latest(kind); if (value) facts[slot] = value;
  }
  if (options.consentContact) {
    const phone = latest("PHONE"); const email = latest("EMAIL");
    if (phone) facts.contact = phone; else if (email) facts.contact = email;
  }
  return facts;
}
