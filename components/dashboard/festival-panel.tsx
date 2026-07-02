import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function FestivalPanel() {
  return (
    <Card className="border border-black/5 p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)] sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight">Campaign Readiness</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Seasonal planning will appear here once campaign data is connected.</p>
        </div>
        <Badge tone="neutral">No data</Badge>
      </div>

      <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
        No campaign items are connected yet. Connect your live campaign source to surface festival and season planning here.
      </div>
    </Card>
  );
}
