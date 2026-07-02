import { Card } from "@/components/ui/card";

export function LeaderboardCard() {
  return (
    <Card className="border border-black/5 p-6 shadow-[0_18px_55px_rgba(24,18,72,0.08)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-black">Agent Leaderboard</h3>
        <span className="text-sm font-semibold text-[var(--primary)]">Live data</span>
      </div>
      <div className="rounded-2xl border border-dashed border-black/10 bg-[var(--surface-soft)] p-6 text-sm text-[var(--text-muted)]">
        No agent performance data is connected yet. Once live agent tracking is available, this section will populate automatically.
      </div>
      <div className="mt-6 rounded-[22px] border border-black/5 bg-white p-4 text-center text-sm text-[var(--text-muted)] shadow-sm">
        Average response time: <span className="font-bold text-[var(--text)]">--</span>
      </div>
    </Card>
  );
}
