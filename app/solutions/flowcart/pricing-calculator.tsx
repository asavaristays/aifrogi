"use client";

import { useMemo, useState } from "react";

const SETUP_FEE = 6500;
const MONTHLY_FEE = 1750;
const BILLING_MONTHS = 3;
const UTILITY_RATE = 0.115;
const MARKETING_RATE = 0.8631;

function rupees(value: number) {
  return `Rs. ${Math.round(value).toLocaleString("en-IN")}`;
}

export function FlowCartPricingCalculator() {
  const [orders, setOrders] = useState(120);
  const [avgOrder, setAvgOrder] = useState(950);
  const [utilityMessages, setUtilityMessages] = useState(900);
  const [marketingMessages, setMarketingMessages] = useState(200);

  const totals = useMemo(() => {
    const monthlyMeta = utilityMessages * UTILITY_RATE + marketingMessages * MARKETING_RATE;
    const monthlyRevenue = orders * avgOrder;
    const quarterlyPlatform = MONTHLY_FEE * BILLING_MONTHS;
    const quarterlyMeta = monthlyMeta * BILLING_MONTHS;
    return {
      monthlyMeta,
      monthlyRevenue,
      quarterlyPlatform,
      firstQuarter: SETUP_FEE + quarterlyPlatform + quarterlyMeta,
      laterQuarter: quarterlyPlatform + quarterlyMeta,
      platformShare: monthlyRevenue > 0 ? (MONTHLY_FEE / monthlyRevenue) * 100 : 0
    };
  }, [avgOrder, marketingMessages, orders, utilityMessages]);

  return (
    <div className="mt-4 rounded-lg border border-black/8 bg-[#21362f] p-5 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase text-[#f4b85a]">Quick calculator</p>
          <h3 className="mt-2 text-2xl font-black">Estimate a WhatsApp commerce launch.</h3>
        </div>
        <p className="rounded-md bg-white/10 px-3 py-2 text-xs font-black text-white/72">Before GST/provider fees</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <NumberInput label="Orders / mo" value={orders} step={10} onChange={setOrders} />
        <NumberInput label="Average order Rs." value={avgOrder} step={50} onChange={setAvgOrder} />
        <NumberInput label="Utility messages / mo" value={utilityMessages} step={50} helper="Rs. 0.115 each" onChange={setUtilityMessages} />
        <NumberInput label="Marketing messages / mo" value={marketingMessages} step={50} helper="Rs. 0.8631 each" onChange={setMarketingMessages} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <CalcResult label="Order value / mo" value={rupees(totals.monthlyRevenue)} />
        <CalcResult label="Meta estimate / mo" value={rupees(totals.monthlyMeta)} />
        <CalcResult label="First quarter" value={rupees(totals.firstQuarter)} />
        <CalcResult label="Platform share" value={`${totals.platformShare.toFixed(1)}%`} />
      </div>

      <p className="mt-4 text-xs leading-5 text-white/55">
        First quarter includes Rs. 6,500 setup plus Rs. 5,250 quarterly FlowCart fee. Message rates are planning assumptions for India and can change by category, country, taxes, and provider fees.
      </p>
    </div>
  );
}

function NumberInput({
  helper,
  label,
  onChange,
  step,
  value
}: {
  helper?: string;
  label: string;
  onChange: (value: number) => void;
  step: number;
  value: number;
}) {
  return (
    <label className="block rounded-md border border-white/10 bg-white/[.055] p-4">
      <span className="flex items-center justify-between gap-3 text-sm font-black">
        {label}
        {helper ? <span className="text-xs text-[#f4b85a]">{helper}</span> : null}
      </span>
      <input
        type="number"
        min="0"
        step={step}
        value={value}
        onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
        className="mt-3 h-11 w-full rounded-md border border-white/12 bg-white px-3 text-base font-black text-[#21362f] outline-none transition focus:border-[#f4b85a]"
      />
    </label>
  );
}

function CalcResult({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-4 text-[#21362f]">
      <p className="text-[10px] font-black uppercase text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}
