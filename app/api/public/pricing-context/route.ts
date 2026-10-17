import { NextResponse } from "next/server";
import { pricingCountryForIp } from "@/lib/pricing-country";
import { currencyForCountry, INR_ONLY_RATES, parsePricingRates } from "@/lib/pricing-currency";
import savedRates from "@/data/pricing-reference-rates.json";

export const runtime = "nodejs";

export async function GET(request: Request) {
  // Nginx replaces this header with the connection's address. Ignore caller-supplied country/XFF headers.
  const country = pricingCountryForIp(request.headers.get("x-real-ip"));
  let reference = null;
  let source = "latest-reference";
  try {
    const response = await fetch("https://api.frankfurter.dev/v2/rates?base=INR&quotes=CAD,USD,AED", {
      next: { revalidate: 21600 }, signal: AbortSignal.timeout(4000)
    });
    if (response.ok) reference = parsePricingRates(await response.json());
  } catch { /* A fresh saved reference keeps display available during provider outages. */ }
  if (!reference) { reference = parsePricingRates(savedRates); source = "saved-reference"; }
  return NextResponse.json({
    country,
    currency: reference ? currencyForCountry(country) : "INR",
    rates: reference?.rates || INR_ONLY_RATES,
    dates: reference?.dates || {},
    source: reference ? source : "unavailable"
  }, { headers: { "Cache-Control": "private, no-store", Vary: "X-Real-IP" } });
}
