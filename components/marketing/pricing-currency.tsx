"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { formatPricingAmount, INR_ONLY_RATES, isPricingCurrency, PRICING_CURRENCIES, type PricingCurrency, type PricingRates } from "@/lib/pricing-currency";

const PricingContext = createContext<{ currency: PricingCurrency; rates: PricingRates; dates: Partial<Record<PricingCurrency, string>>; loading: boolean; select: (value: string) => void }>({ currency: "INR", rates: INR_ONLY_RATES, dates: {}, loading: true, select: () => {} });
const labels = { INR: "India · INR ₹", CAD: "Canada · CAD", USD: "USA · USD", AED: "UAE · AED" };

export function PricingCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<PricingCurrency>("INR");
  const [rates, setRates] = useState<PricingRates>(INR_ONLY_RATES);
  const [dates, setDates] = useState<Partial<Record<PricingCurrency, string>>>({});
  const [loading, setLoading] = useState(true);
  const manualSelection = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/public/pricing-context", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Pricing reference unavailable");
        const data = await response.json();
        const validRates = { ...INR_ONLY_RATES };
        for (const code of PRICING_CURRENCIES) {
          if (code !== "INR" && typeof data.rates?.[code] === "number" && Number.isFinite(data.rates[code]) && data.rates[code] > 0) validRates[code] = data.rates[code];
        }
        setRates(validRates);
        setDates(data.dates || {});
        let preferred: string | null = null;
        try { preferred = localStorage.getItem("aifrogi-pricing-currency"); } catch { /* Private browser modes can deny storage. */ }
        if (!manualSelection.current) {
          const suggested: PricingCurrency = isPricingCurrency(preferred) ? preferred : isPricingCurrency(data.currency) ? data.currency : "INR";
          setCurrency(validRates[suggested] ? suggested : "INR");
        }
      })
      .catch(() => { /* INR always remains a usable, truthful fallback. */ })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  function select(value: string) {
    if (!isPricingCurrency(value) || !rates[value]) return;
    manualSelection.current = true;
    setCurrency(value);
    try { localStorage.setItem("aifrogi-pricing-currency", value); } catch { /* The choice still works without persistence. */ }
  }

  return <PricingContext.Provider value={{ currency, rates, dates, loading, select }}>{children}</PricingContext.Provider>;
}

export function PricingCurrencySelector() {
  const { currency, rates, dates, loading, select } = useContext(PricingContext);
  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-5" aria-label="Pricing currency">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-6 text-[#666]" aria-live="polite">{loading ? "Selecting your local currency…" : currency === "INR" ? "Prices shown in INR. Choose CAD, USD or AED to see the equivalent local price." : `Approximate ${currency} equivalents at the reference rate for ${dates[currency] || "the latest available date"}. Checkout is charged in INR; your payment provider applies its conversion rate and fees.`}</p>
        <label className="flex shrink-0 items-center gap-3 text-sm font-semibold">Currency<select aria-label="Pricing currency" value={currency} onChange={event => select(event.target.value)} className="rounded-lg border border-black/15 bg-white px-3 py-2">{PRICING_CURRENCIES.map(code => <option key={code} value={code} disabled={!rates[code]}>{labels[code]}</option>)}</select></label>
      </div>
      <p className="mx-auto mt-3 max-w-7xl text-xs text-[#777]">Country detection uses <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer" className="underline">IP Geolocation by DB-IP</a>. Exchange rates: <a href="https://frankfurter.dev" target="_blank" rel="noopener noreferrer" className="underline">Frankfurter</a>.</p>
    </section>
  );
}

export function LocalPrice({ rupees }: { rupees: number }) {
  const { currency, rates } = useContext(PricingContext);
  return <>{formatPricingAmount(rupees, currency, rates) || formatPricingAmount(rupees, "INR", INR_ONLY_RATES)}</>;
}
