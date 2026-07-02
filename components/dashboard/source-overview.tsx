import type { ReactElement } from "react";
import { Card } from "@/components/ui/card";

type SourceSlice = {
  label: string;
  percent: number;
  color: string;
};

export function SourceOverview({
  sources,
  totalLeads
}: {
  sources: SourceSlice[];
  totalLeads: number;
}) {
  if (sources.length === 0) {
    return (
      <Card className="p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)]">
        <h3 className="text-lg font-black">Lead Sources Overview</h3>
        <div className="mt-4 rounded-2xl border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
          No source data yet. Once leads arrive, this card will show the live channel mix.
        </div>
      </Card>
    );
  }

  const segments = sources.reduce(
    (acc, source) => {
      const offset = acc.offset;
      acc.parts.push(
        <circle
          key={source.label}
          cx="60"
          cy="60"
          r="38"
          fill="transparent"
          stroke={source.color}
          strokeWidth="12"
          strokeDasharray={`${source.percent} ${100 - source.percent}`}
          strokeDashoffset={25 - offset}
        />
      );
      acc.offset += source.percent;
      return acc;
    },
    { offset: 0, parts: [] as ReactElement[] }
  );

  return (
    <Card className="border border-black/5 p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)]">
      <h3 className="mb-6 text-lg font-black">Lead Sources Overview</h3>
      <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          {segments.parts}
        </svg>
        <div className="absolute rounded-full border border-black/5 bg-white/90 px-6 py-5 text-center shadow-xl backdrop-blur-sm">
          <div className="text-3xl font-black">{totalLeads}</div>
          <div className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Live leads</div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {sources.map((source) => (
          <div
            key={source.label}
            className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white/70 px-3 py-2 text-sm text-[var(--text-muted)]"
          >
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: source.color }} />
            <span className="font-medium">
              {source.label} ({source.percent}%)
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
