"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import type { DemandPoint } from "@/types";

function compactCurrency(value: number) {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(value % 10000000 === 0 ? 0 : 1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return currency(value);
}

export function DemandChart({ data }: { data: DemandPoint[] }) {
  return (
    <Card className="overflow-hidden border border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,247,255,0.94)_100%)] p-6 shadow-[0_20px_60px_rgba(24,18,72,0.08)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--primary)]">Demand Graph</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-[var(--text)]">Inquiry and revenue momentum</h3>
        </div>
        <div className="rounded-full border border-black/5 bg-white px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
          Last 7 days
        </div>
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="demandBar" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.95} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.25} />
              </linearGradient>
              <linearGradient id="demandArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.28} />
                <stop offset="100%" stopColor="var(--secondary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(40,28,96,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(71,78,112,0.78)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "rgba(71,78,112,0.78)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "rgba(71,78,112,0.78)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value: number) => compactCurrency(value)}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "18px",
                border: "1px solid rgba(41, 28, 96, 0.08)",
                boxShadow: "0 18px 50px rgba(24, 18, 72, 0.12)"
              }}
              formatter={((value: number | string | undefined, name: string | number | undefined) => {
                const amount = typeof value === "number" ? value : Number(value ?? 0);
                return name === "revenue" ? [currency(amount), "Revenue"] : [amount, "Leads"];
              }) as never}
              labelStyle={{ color: "rgba(24,18,72,0.72)", fontWeight: 700 }}
            />
            <Bar yAxisId="left" dataKey="leads" radius={[16, 16, 4, 4]} fill="url(#demandBar)" barSize={24} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="var(--secondary)"
              strokeWidth={3}
              fill="url(#demandArea)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
