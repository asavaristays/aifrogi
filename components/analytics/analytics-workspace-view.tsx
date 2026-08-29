import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";

export type AnalyticsWorkspaceMetrics = {
  contacts: number;
  incoming: number;
  outgoing: number;
  unanswered: number;
  averageResponseLabel: string;
  deliveryRate: number;
  readRate: number;
  failed: number;
};

type OperationsReport = { open: number; overdue: number; completed: number; verifiedOutcomes: number; valuePaisa: number; byOutcome: Array<{ outcomeType: string | null; _count: { _all: number } }> };

export function AnalyticsWorkspaceView({ metrics, operations }: { metrics: AnalyticsWorkspaceMetrics; operations?: OperationsReport | null }) {
  const answered = Math.max(metrics.contacts - metrics.unanswered, 0);
  const answerRate = metrics.contacts ? Math.round((answered / metrics.contacts) * 100) : 0;
  const replyScore = metrics.unanswered ? Math.max(18, Math.round((answered / Math.max(metrics.contacts, 1)) * 100)) : 100;
  const direction = metrics.unanswered
    ? "Reply to waiting conversations before sending a new campaign."
    : metrics.deliveryRate < 80
      ? "Review delivery before scaling broadcast volume."
      : metrics.readRate < 50
        ? "Improve template copy and audience quality before scaling."
        : "Workspace is stable. You can plan the next campaign.";

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <TopBar title="Reports" subtitle="Cross-channel conversations, operational actions, verified outcomes, and measurable business value" />
      <div className="mx-auto max-w-[1480px] space-y-6 px-5 py-7 sm:px-7 lg:px-9">
        <Card className="overflow-hidden border border-black/6 shadow-[0_16px_38px_-32px_rgba(17,39,32,0.5)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="p-6 sm:p-7">
              <p className="product-eyebrow">Direction</p>
              <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[#17211e]">{direction}</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <SignalCard title="Reply health" value={replyScore + "%"} helper={`${metrics.unanswered} waiting`} score={replyScore} tone="red" />
                <SignalCard title="Delivery health" value={metrics.deliveryRate + "%"} helper={`${metrics.failed} failed events`} score={metrics.deliveryRate} tone="green" />
                <SignalCard title="Audience signal" value={metrics.readRate + "%"} helper="Read rate" score={metrics.readRate} tone="blue" />
              </div>
            </section>
            <aside className="border-t border-black/6 bg-[#17211e] p-6 text-white lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold text-white/62">Today&apos;s operating picture</p>
              <div className="mt-6 space-y-5">
                <SummaryMetric label="Inbound" value={metrics.incoming} total={Math.max(metrics.incoming + metrics.outgoing, 1)} color="#52d28f" />
                <SummaryMetric label="Outbound" value={metrics.outgoing} total={Math.max(metrics.incoming + metrics.outgoing, 1)} color="#7db7ff" />
                <SummaryMetric label="Answered contacts" value={answered} total={Math.max(metrics.contacts, 1)} color="#f2b75d" />
              </div>
            </aside>
          </div>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border border-black/6 p-6 shadow-[0_16px_38px_-32px_rgba(17,39,32,0.5)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="product-eyebrow">Response queue</p>
                <h2 className="mt-2 text-2xl font-semibold">{metrics.unanswered} conversations awaiting reply</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">These contacts have an inbound message as the latest event.</p>
              </div>
              <span className={metrics.unanswered ? "status-pill status-error" : "status-pill status-success"}>
                {metrics.unanswered ? "Action required" : "Queue clear"}
              </span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Average response" value={metrics.averageResponseLabel} />
              <MiniMetric label="Answer rate" value={answerRate + "%"} />
              <MiniMetric label="Contacts" value={String(metrics.contacts)} />
            </div>
          </Card>

          <Card className="border border-black/6 p-6 shadow-[0_16px_38px_-32px_rgba(17,39,32,0.5)]">
            <p className="product-eyebrow">Recommended next action</p>
            <h3 className="mt-2 text-xl font-semibold">{metrics.unanswered ? "Open inbox" : "Prepare next audience"}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {metrics.unanswered
                ? "Reply backlog should be cleared before campaign activity so no active lead is left cold."
                : "The queue is clear. Use campaign history and read rate to pick the next focused test batch."}
            </p>
          </Card>
        </section>

        {operations ? <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MiniMetric label="Open actions" value={String(operations.open)} />
          <MiniMetric label="Overdue" value={String(operations.overdue)} />
          <MiniMetric label="Completed actions" value={String(operations.completed)} />
          <MiniMetric label="Verified outcomes" value={String(operations.verifiedOutcomes)} />
          <MiniMetric label="Recorded value" value={new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(operations.valuePaisa / 100)} />
        </section> : null}
      </div>
    </div>
  );
}

function SignalCard({
  title,
  value,
  helper,
  score,
  tone
}: {
  title: string;
  value: string;
  helper: string;
  score: number;
  tone: "red" | "green" | "blue";
}) {
  const colors = {
    red: { surface: "from-[#fff4ef] to-white", text: "text-[#a5482d]", bar: "bg-[#f06f45]" },
    green: { surface: "from-[#edf8f1] to-white", text: "text-[#b923ae]", bar: "bg-[#27aa78]" },
    blue: { surface: "from-[#eff7ff] to-white", text: "text-[#1b62a5]", bar: "bg-[#3d8be3]" }
  }[tone];

  return (
    <article className={`rounded-lg border border-black/6 bg-gradient-to-br ${colors.surface} p-5`}>
      <p className={`text-sm font-semibold ${colors.text}`}>{title}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <strong className="text-3xl font-semibold text-[#17211e]">{value}</strong>
        <span className={`h-12 w-12 rounded-full border-[6px] border-white ${colors.bar}`} style={{ opacity: 0.78 }} />
      </div>
      <div className="mt-5 h-2 rounded-full bg-white">
        <span className={`block h-2 rounded-full ${colors.bar}`} style={{ width: `${Math.max(3, Math.min(score, 100))}%` }} />
      </div>
      <p className="mt-3 text-sm text-[var(--text-muted)]">{helper}</p>
    </article>
  );
}

function SummaryMetric({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const width = Math.max(4, Math.min(100, Math.round((value / total) * 100)));
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-white/66">{label}</span>
        <strong className="font-semibold text-white">{value}</strong>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/12">
        <span className="block h-2 rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/6 bg-[#f8faf9] p-4">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#17211e]">{value}</p>
    </div>
  );
}
