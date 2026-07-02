import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Metric } from "@/types";
import { cn } from "@/lib/utils";

const toneMap = {
  primary: "text-[var(--primary)]",
  secondary: "text-[var(--secondary)]",
  tertiary: "text-[var(--tertiary)]",
  neutral: "text-[var(--text-muted)]",
  error: "text-[var(--error)]"
} as const;

export function StatCard({ metric }: { metric: Metric }) {
  const tone = toneMap[metric.tone ?? "neutral"];

  return (
    <Card className="relative overflow-hidden border border-black/5 p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)] sm:p-7">
      <div className="absolute right-0 top-0 h-28 w-28 translate-x-8 -translate-y-8 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.95)_0%,rgba(255,255,255,0.12)_35%,rgba(255,255,255,0)_70%)] opacity-70" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {metric.label}
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight sm:text-[2.15rem]">{metric.value}</h3>
          {metric.helper ? <p className="mt-2 text-sm text-[var(--text-muted)]">{metric.helper}</p> : null}
        </div>
        {metric.delta ? (
          <Badge tone={metric.tone === "neutral" ? "primary" : metric.tone} className="relative z-10">
            {metric.delta}
          </Badge>
        ) : null}
      </div>

      {metric.trend ? (
        <div className="mt-6 flex h-14 items-end gap-1.5">
          {metric.trend.map((point, index) => (
            <div
              key={`${metric.label}-${index}`}
              className={cn("flex-1 rounded-t-full opacity-85 shadow-sm", tone, "bg-current")}
              style={{ height: `${Math.max(20, point)}%` }}
            />
          ))}
        </div>
      ) : null}
    </Card>
  );
}
