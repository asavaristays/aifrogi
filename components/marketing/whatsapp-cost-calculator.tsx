"use client";

import { useMemo, useState } from "react";

type Market = "IN" | "AE";
type Category = "marketing" | "utility" | "authentication";
type Tier = { upTo: number; rate: number };

const markets: Record<Market, {
  name: string;
  flag: string;
  currency: string;
  locale: string;
  tiers: Record<Category, Tier[]>;
}> = {
  IN: {
    name: "India",
    flag: "🇮🇳",
    currency: "INR",
    locale: "en-IN",
    tiers: {
      marketing: [{ upTo: Infinity, rate: 0.8631 }],
      utility: [
        { upTo: 25_000_000, rate: 0.115 },
        { upTo: 50_000_000, rate: 0.1081 },
        { upTo: 100_000_000, rate: 0.1012 },
        { upTo: Infinity, rate: 0.0943 }
      ],
      authentication: [
        { upTo: 750_000, rate: 0.115 },
        { upTo: 15_000_000, rate: 0.1081 },
        { upTo: 20_000_000, rate: 0.1012 },
        { upTo: Infinity, rate: 0.0943 }
      ]
    }
  },
  AE: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    currency: "AED",
    locale: "en-AE",
    tiers: {
      marketing: [{ upTo: Infinity, rate: 0.1832 }],
      utility: [
        { upTo: 100_000, rate: 0.0576 },
        { upTo: 1_000_000, rate: 0.0547 },
        { upTo: 4_500_000, rate: 0.0518 },
        { upTo: Infinity, rate: 0.049 }
      ],
      authentication: [
        { upTo: 100_000, rate: 0.0576 },
        { upTo: 1_000_000, rate: 0.0547 },
        { upTo: 4_500_000, rate: 0.0518 },
        { upTo: Infinity, rate: 0.049 }
      ]
    }
  }
};

const categories: Array<{ key: Category; label: string; description: string }> = [
  { key: "marketing", label: "Marketing", description: "Offers, launches, reminders, and promotions" },
  { key: "utility", label: "Utility", description: "Orders, bookings, payments, and service updates" },
  { key: "authentication", label: "Authentication", description: "OTPs, login codes, and verification" }
];

function calculateTieredCost(volume: number, tiers: Tier[]) {
  let cost = 0;
  let previousLimit = 0;

  for (const tier of tiers) {
    const messagesInTier = Math.max(0, Math.min(volume, tier.upTo) - previousLimit);
    cost += messagesInTier * tier.rate;
    previousLimit = tier.upTo;
    if (volume <= tier.upTo) break;
  }

  return cost;
}

export function WhatsAppCostCalculator() {
  const [marketKey, setMarketKey] = useState<Market>("IN");
  const [volumes, setVolumes] = useState<Record<Category, number>>({
    marketing: 10_000,
    utility: 5_000,
    authentication: 1_000
  });

  const market = markets[marketKey];
  const money = useMemo(() => new Intl.NumberFormat(market.locale, {
    style: "currency",
    currency: market.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }), [market]);
  const number = useMemo(() => new Intl.NumberFormat(market.locale), [market]);

  const costs = Object.fromEntries(categories.map(({ key }) => [
    key,
    calculateTieredCost(volumes[key], market.tiers[key])
  ])) as Record<Category, number>;
  const totalMessages = categories.reduce((sum, { key }) => sum + volumes[key], 0);
  const metaTotal = categories.reduce((sum, { key }) => sum + costs[key], 0);
  const average = totalMessages ? metaTotal / totalMessages : 0;

  function updateVolume(category: Category, value: number) {
    setVolumes((current) => ({ ...current, [category]: Math.max(0, Math.min(100_000_000, value || 0)) }));
  }

  return (
    <section id="calculator" className="border-y border-[#f8f0d8] bg-white px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="product-eyebrow">WhatsApp cost calculator</p>
          <h2 className="mt-3 text-3xl font-semibold sm:text-4xl">Calculate your WhatsApp Business API costs.</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--text-muted)]">Choose your customer market and estimate how many template messages you expect to send each month. Meta usage and the AiFrogi platform fee remain separate.</p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-xl border border-[#ded8cb] bg-[#ded8cb] shadow-[0_24px_70px_rgba(16,16,16,.08)] lg:grid-cols-[1.25fr_.75fr]">
          <div className="bg-[#fbfaf7] p-5 sm:p-8">
            <fieldset>
              <legend className="text-sm font-bold text-[#101010]">Customer market</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(Object.keys(markets) as Market[]).map((key) => {
                  const item = markets[key];
                  const selected = key === marketKey;
                  return <button key={key} type="button" onClick={() => setMarketKey(key)} aria-pressed={selected} className={`flex min-h-14 items-center gap-3 rounded-lg border px-4 text-left transition ${selected ? "border-[#8a6a16] bg-white shadow-sm" : "border-[#ded8cb] bg-white/60 hover:bg-white"}`}><span className="text-xl" aria-hidden="true">{item.flag}</span><span><strong className="block text-sm text-[#101010]">{item.name}</strong><small className="text-[#68645c]">Rates in {item.currency}</small></span>{selected ? <span className="ml-auto grid h-5 w-5 place-items-center rounded-full bg-[#8a6a16] text-[11px] text-white">✓</span> : null}</button>;
                })}
              </div>
            </fieldset>

            <div className="mt-8 space-y-4">
              {categories.map(({ key, label, description }) => {
                const baseRate = market.tiers[key][0].rate;
                return <div key={key} className="rounded-lg border border-[#ded8cb] bg-white p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><label htmlFor={`${key}-messages`} className="text-sm font-bold text-[#101010]">{label} templates</label><p className="mt-1 text-xs text-[#68645c]">{description}</p></div><div className="text-right"><strong className="block text-sm text-[#6d5310]">{money.format(baseRate)}</strong><small className="text-[11px] text-[#68645c]">base rate / message</small></div></div>
                  <div className="mt-4 grid items-center gap-3 sm:grid-cols-[1fr_130px]"><input aria-label={`${label} template message volume`} type="range" min="0" max="1000000" step="100" value={Math.min(volumes[key], 1_000_000)} onChange={(event) => updateVolume(key, Number(event.target.value))} className="w-full accent-[#8a6a16]"/><input id={`${key}-messages`} type="number" min="0" max="100000000" step="100" value={volumes[key]} onChange={(event) => updateVolume(key, Number(event.target.value))} className="h-11 rounded-md border border-[#ded8cb] bg-white px-3 text-right text-sm font-semibold text-[#101010] outline-none focus:border-[#8a6a16]"/></div>
                  <div className="mt-3 flex items-center justify-between border-t border-[#ded8cb] pt-3 text-xs"><span className="text-[#68645c]">{number.format(volumes[key])} messages</span><strong className="text-[#101010]">{money.format(costs[key])}</strong></div>
                </div>;
              })}
            </div>
          </div>

          <aside className="flex flex-col bg-[#101010] p-6 text-white sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#e2c66d]">Estimated monthly Meta cost</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">{money.format(metaTotal)}</p>
            <p className="mt-2 text-sm text-white/50">for {number.format(totalMessages)} template messages</p>

            <div className="mt-8 space-y-3 border-y border-white/10 py-5 text-sm">
              {categories.map(({ key, label }) => <div key={key} className="flex items-center justify-between gap-4"><span className="text-white/58">{label}</span><strong>{money.format(costs[key])}</strong></div>)}
              <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3"><span className="text-white/58">Average per message</span><strong className="text-[#e2c66d]">{money.format(average)}</strong></div>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-xs leading-5 text-white/52"><strong className="block text-white/82">Good to know</strong>Utility templates sent inside an open 24-hour customer service window may be free. International authentication and taxes can change the final charge.</div>
            <a href="https://app.aifrogi.com/register" className="mt-6 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#8a6a16] px-5 text-sm font-bold text-white transition hover:bg-[#b28728]">Start 30-day trial</a>
            <a href="https://business.whatsapp.com/products/platform-pricing#rates" target="_blank" rel="noreferrer" className="mt-4 text-center text-xs font-semibold text-white/45 underline decoration-white/20 underline-offset-4 hover:text-white">View official Meta pricing</a>
          </aside>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#68645c]">Indicative Meta rates effective January 1, 2026. Volume tiers are applied progressively. This estimate excludes the AiFrogi subscription, taxes, and optional services.</p>
      </div>
    </section>
  );
}
