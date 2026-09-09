import { TopBar } from "@/components/layout/top-bar";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import type { ReportPeriod, WebsiteMonthlyReportRow } from "@/lib/website-reporting";

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
type WebsiteOutcomes = { qualified: number; captured: number; qualificationRate: number; captureRate: number };

export function AnalyticsWorkspaceView({ metrics, operations, outcomes, period, monthly }: { metrics: AnalyticsWorkspaceMetrics; operations?: OperationsReport | null; outcomes: WebsiteOutcomes; period: { period: ReportPeriod; label: string }; monthly?: WebsiteMonthlyReportRow[] }) {
  const answered = Math.max(metrics.contacts - metrics.unanswered, 0);
  const answerRate = metrics.contacts ? Math.round((answered / metrics.contacts) * 100) : 0;
  const replyScore = metrics.unanswered ? Math.max(18, Math.round((answered / Math.max(metrics.contacts, 1)) * 100)) : 100;
  const direction = metrics.unanswered
    ? "Reply to waiting website conversations first."
    : outcomes.qualified
      ? `Follow up with ${outcomes.qualified} qualified lead${outcomes.qualified === 1 ? "" : "s"}.`
      : metrics.contacts
        ? "Review visitor questions and strengthen bot intelligence."
        : "No website-bot conversation was recorded in this period.";

  return (
    <div className="min-h-screen bg-[#f6f7f6]">
      <TopBar title="Reports" subtitle="Website-bot conversations, qualified leads, follow-up actions, and verified outcomes" />
      <div className="mx-auto max-w-[1480px] space-y-6 px-5 py-7 sm:px-7 lg:px-9">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-1 overflow-x-auto" aria-label="Report period">
            {[["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["all", "All time"]].map(([value, label]) => <Link key={value} href={`/analytics?period=${value}`} aria-current={period.period === value ? "page" : undefined} className={`rounded-full px-4 py-2 text-xs font-semibold ${period.period === value ? "bg-[#17211e] !text-white" : "border border-black/8 bg-white text-[var(--text-muted)]"}`}>{label}</Link>)}
          </nav>
          <a href={`/api/reports/website/pdf?period=${period.period}`} download className="inline-flex min-h-10 items-center justify-center rounded-md bg-[#8a6a16] px-4 text-sm font-semibold text-white">↓ Download PDF</a>
        </div>
        <Card className="overflow-hidden border border-black/6 shadow-[0_16px_38px_-32px_rgba(17,39,32,0.5)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="p-6 sm:p-7">
              <p className="product-eyebrow">Direction</p>
              <h2 className="mt-2 max-w-3xl text-3xl font-semibold leading-tight text-[#17211e]">{direction}</h2>
              <div className="mt-7 grid gap-4 md:grid-cols-3">
                <SignalCard title="Response coverage" value={replyScore + "%"} helper={`${metrics.unanswered} waiting`} score={replyScore} tone="red" />
                <SignalCard title="Qualified leads" value={String(outcomes.qualified)} helper={`${outcomes.qualificationRate}% of conversations`} score={outcomes.qualificationRate} tone="green" />
                <SignalCard title="Contact capture" value={String(outcomes.captured)} helper={`${outcomes.captureRate}% consented`} score={outcomes.captureRate} tone="blue" />
              </div>
            </section>
            <aside className="border-t border-black/6 bg-[#17211e] p-6 text-white lg:border-l lg:border-t-0">
              <p className="text-sm font-semibold text-white/62">{period.label} operating picture</p>
              <div className="mt-6 space-y-5">
                <SummaryMetric label="Visitor messages" value={metrics.incoming} total={Math.max(metrics.incoming + metrics.outgoing, 1)} color="#52d28f" />
                <SummaryMetric label="Bot / team replies" value={metrics.outgoing} total={Math.max(metrics.incoming + metrics.outgoing, 1)} color="#7db7ff" />
                <SummaryMetric label="Conversations" value={metrics.contacts} total={Math.max(metrics.contacts, 1)} color="#f2b75d" />
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
            <h3 className="mt-2 text-xl font-semibold">{metrics.unanswered ? "Open Team Inbox" : outcomes.qualified ? "Follow qualified leads" : "Improve bot intelligence"}</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {metrics.unanswered
                ? "Reply to the waiting website conversation so no active lead is left unattended."
                : outcomes.qualified
                  ? "Review qualified conversations in Team Inbox and complete the approved follow-up."
                  : "Review real visitor questions and intelligence gaps before changing the bot."}
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

        {monthly?.length ? <Card className="overflow-hidden border border-black/6 shadow-[0_16px_38px_-32px_rgba(17,39,32,0.5)]">
          <div className="border-b border-black/6 p-6">
            <p className="product-eyebrow">Monthly history</p>
            <h2 className="mt-2 text-2xl font-semibold">Website-bot performance by month</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">A real-data operating record for the latest 12 calendar months.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-[#17211e] text-white"><tr>{["Month", "Conversations", "Visitor messages", "Bot / team replies", "Qualified leads", "Contacts captured", "Answer rate"].map((label) => <th key={label} scope="col" className="px-5 py-3 font-semibold">{label}</th>)}</tr></thead>
              <tbody>{monthly.map((row) => <tr key={row.key} className="border-t border-black/6 even:bg-[#f8faf9]"><th scope="row" className="whitespace-nowrap px-5 py-3 font-semibold text-[#17211e]">{row.label}</th><td className="px-5 py-3">{row.conversations}</td><td className="px-5 py-3">{row.incoming}</td><td className="px-5 py-3">{row.outgoing}</td><td className="px-5 py-3">{row.qualified}</td><td className="px-5 py-3">{row.captured}</td><td className="px-5 py-3 font-semibold">{row.answerRate}%</td></tr>)}</tbody>
            </table>
          </div>
        </Card> : null}
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
    green: { surface: "from-[#edf8f1] to-white", text: "text-[#6d5310]", bar: "bg-[#27aa78]" },
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
