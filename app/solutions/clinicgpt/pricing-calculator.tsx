"use client";

import { useMemo, useState } from "react";

const SETUP_FEE = 4500;
const MONTHLY_FEE = 1250;
const BILLING_MONTHS = 3;
const UTILITY_RATE = 0.115;
const MARKETING_RATE = 0.8631;

function rupees(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

export function ClinicGPTPricingCalculator() {
  const [utilityMessages, setUtilityMessages] = useState(500);
  const [marketingMessages, setMarketingMessages] = useState(0);

  const totals = useMemo(() => {
    const monthlyMeta = utilityMessages * UTILITY_RATE + marketingMessages * MARKETING_RATE;
    const quarterlyPlatform = MONTHLY_FEE * BILLING_MONTHS;
    const quarterlyMeta = monthlyMeta * BILLING_MONTHS;
    return {
      monthlyMeta,
      quarterlyPlatform,
      quarterlyMeta,
      firstQuarter: SETUP_FEE + quarterlyPlatform + quarterlyMeta,
      laterQuarter: quarterlyPlatform + quarterlyMeta
    };
  }, [marketingMessages, utilityMessages]);

  return (
    <div className="mt-4 rounded-lg border border-black/8 bg-[#101010] p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-[#e2c66d]">Quick calculator</p>
          <h3 className="mt-2 text-2xl font-black tracking-[-.03em]">Estimate first-quarter cost.</h3>
        </div>
        <p className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white/72">Before GST/provider fees</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <MessageInput
          label="Utility messages / mo"
          value={utilityMessages}
          rate="Rs. 0.115 each"
          onChange={setUtilityMessages}
        />
        <MessageInput
          label="Marketing messages / mo"
          value={marketingMessages}
          rate="Rs. 0.8631 each"
          onChange={setMarketingMessages}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <CalcResult label="Meta estimate / mo" value={rupees(totals.monthlyMeta)} />
        <CalcResult label="First quarter" value={rupees(totals.firstQuarter)} />
        <CalcResult label="Later quarters" value={rupees(totals.laterQuarter)} />
      </div>

      <p className="mt-4 text-xs leading-5 text-white/52">
        First quarter includes Rs. 4,500 setup plus Rs. 3,750 quarterly ClinicGPT fee. Message rates are planning assumptions for India and can change by category, country, taxes, and provider fees.
      </p>
    </div>
  );
}

function MessageInput({
  label,
  onChange,
  rate,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  rate: string;
  value: number;
}) {
  return (
    <label className="block rounded-md border border-white/10 bg-white/[.055] p-4">
      <span className="flex items-center justify-between gap-3 text-sm font-black">
        {label}
        <span className="text-xs text-[#e2c66d]">{rate}</span>
      </span>
      <input
        type="number"
        min="0"
        step="50"
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-3 h-11 w-full rounded-md border border-white/12 bg-white px-3 text-base font-black text-[#101010] outline-none transition focus:border-[#e2c66d]"
      />
    </label>
  );
}

function CalcResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-4 text-[#101010]">
      <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-.03em]">{value}</p>
    </div>
  );
}
