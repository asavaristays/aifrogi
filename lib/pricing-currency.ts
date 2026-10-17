export const PRICING_CURRENCIES = ["INR", "CAD", "USD", "AED"] as const;
export type PricingCurrency = typeof PRICING_CURRENCIES[number];
export type PricingRates = Record<PricingCurrency, number | null>;
export const INR_ONLY_RATES: PricingRates = { INR: 1, CAD: null, USD: null, AED: null };

export function isPricingCurrency(value: unknown): value is PricingCurrency {
  return typeof value === "string" && PRICING_CURRENCIES.includes(value as PricingCurrency);
}

export function currencyForCountry(country: string | null): PricingCurrency {
  return ({ CA: "CAD", US: "USD", AE: "AED" } as const)[country as "CA" | "US" | "AE"] || "INR";
}

export function formatPricingAmount(rupees: number, currency: PricingCurrency, rates: PricingRates) {
  const rate = rates[currency];
  if (!rate || !Number.isFinite(rate)) return null;
  if (currency === "INR") return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(rupees);
  const converted = rupees * rate;
  const cents = Math.round((converted + Number.EPSILON * Math.max(1, converted)) * 100) / 100;
  return new Intl.NumberFormat("en", { style: "currency", currency, currencyDisplay: "code", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents);
}

/** Reject incomplete, malformed, future or obsolete reference rates. */
export function parsePricingRates(value: unknown, now = new Date()) {
  if (!Array.isArray(value)) return null;
  const rates: PricingRates = { ...INR_ONLY_RATES };
  const dates: Partial<Record<PricingCurrency, string>> = {};
  for (const row of value) {
    if (!row || typeof row !== "object" || row.base !== "INR") continue;
    const quote: unknown = row.quote;
    if (!isPricingCurrency(quote) || quote === "INR") continue;
    if (typeof row.rate !== "number" || !Number.isFinite(row.rate) || row.rate <= 0 || row.rate > 100) return null;
    if (typeof row.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) return null;
    const date = new Date(`${row.date}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== row.date || date > now || now.getTime() - date.getTime() > 7 * 86400000) return null;
    rates[quote] = row.rate;
    dates[quote] = row.date;
  }
  return rates.CAD && rates.USD && rates.AED ? { rates, dates } : null;
}
