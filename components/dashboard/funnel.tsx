import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FunnelStage = {
  label: string;
  value: number;
  width: number;
};

export function FunnelCard({ stages }: { stages: FunnelStage[] }) {
  return (
    <Card className="border border-black/5 p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)] sm:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Lead Pipeline Funnel</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Live pipeline from current lead data.</p>
        </div>
        <div className="flex gap-2">
          <Badge tone="neutral">Live</Badge>
          <Badge tone="primary">All leads</Badge>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
          No funnel data yet. As soon as leads arrive, this view will reflect the live pipeline.
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map((stage, index) => (
            <div key={stage.label}>
              <div className="relative overflow-hidden rounded-[22px] border border-black/5 bg-[var(--primary-soft)]/45 px-5 py-4">
                <div
                  className="absolute inset-y-0 left-0 rounded-[22px] bg-gradient-to-r from-[var(--primary)] to-[#7b6ee8] opacity-80"
                  style={{ width: `${stage.width}%` }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-black text-white shadow-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-bold text-[var(--primary-strong)]">{stage.label}</span>
                  </div>
                  <span className="text-lg font-extrabold">{stage.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
