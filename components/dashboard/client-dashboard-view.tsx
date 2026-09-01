import Link from "next/link";
import { Icon } from "@/components/icons";
import type { Lead } from "@/types";
import type { BotReadinessCheck } from "@/lib/bot-readiness";
import type { HumanResponseItem } from "@/lib/human-response-sla";

export type DashboardAttention = {
  title: string;
  reason: string;
  action: string;
  href: string;
  tone: "urgent" | "waiting" | "ready";
  owner: "You" | "AiFrogi" | "Meta";
};

export type DashboardReadiness = { label: string; value: string; ok: boolean };

export type ClientDashboardViewProps = {
  ownerName: string;
  greeting: string;
  todayLabel: string;
  organizationName: string;
  workspaceName: string;
  displayPhoneNumber: string;
  connected: boolean;
  whatsappEnabled: boolean;
  metaStatus: string;
  accessRole: string;
  knowledgeReady: boolean;
  botName: string;
  botCategory: string;
  botReadiness: { checks: BotReadinessCheck[]; completed: number; total: number; percent: number; ready: boolean };
  humanResponse: { slaMinutes: number; reminderPercent: number; waiting: number; reminder: number; overdue: number; fallbackEligible: number; oldestWaitingMinutes: number; items: HumanResponseItem[] };
  attention: DashboardAttention[];
  readiness: DashboardReadiness[];
  recent: Lead[];
  metrics: {
    contacts: number;
    incoming: number;
    unanswered: number;
    averageResponseLabel: string;
    readRate: number;
    deliveryRate: number;
    failed: number;
  };
  openTicketCount: number;
};

export function ClientDashboardView(props: ClientDashboardViewProps) {
  const firstName = props.ownerName.trim().split(/\s+/)[0] || "there";
  const primaryAttention = props.attention.filter((item) => item.tone !== "ready");
  const actionCount = primaryAttention.length;
  const healthy = (!props.whatsappEnabled || props.connected) && props.readiness.every((item) => item.ok);

  return (
    <div className="product-surface min-h-screen">
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/95 px-5 py-3.5 backdrop-blur sm:px-7 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="pl-12 lg:pl-0">
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span>{props.organizationName}</span>
              <span className="text-black/20">/</span>
              <span>{props.workspaceName}</span>
              <span className="text-black/20">/</span>
              <span>{props.accessRole === "OWNER" ? "Client Admin" : props.accessRole === "ADMIN" ? "Workspace Admin" : props.accessRole}</span>
            </div>
            <h1 className="mt-0.5 text-[22px] font-semibold leading-tight text-[var(--text)]">Today</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/whatsapp-bot" className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface-soft)]">
              <Icon name="message-circle" className="h-4 w-4" />
              Inbox
            </Link>
            <Link href={props.whatsappEnabled ? "/campaigns" : "/knowledge"} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[var(--primary-strong)] px-3 text-xs font-semibold text-white transition hover:bg-[var(--primary)]">
              <Icon name={props.whatsappEnabled ? "megaphone" : "file-text"} className="h-4 w-4" />
              {props.whatsappEnabled ? "New campaign" : "Manage intelligence"}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-7 lg:px-8 lg:py-7">
        <section className="mb-6 flex flex-col gap-4 border-b border-[var(--border)] pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">{props.todayLabel}</p>
            <h2 className="mt-1.5 text-2xl font-semibold leading-tight text-[var(--text)]">
              {props.greeting}, {firstName}.
            </h2>
            <p className="mt-1.5 max-w-2xl text-sm text-[var(--text-muted)]">
              {actionCount
                ? `${actionCount} item${actionCount === 1 ? "" : "s"} need your attention. Start with the action queue below.`
                : "Your messaging workspace is clear. No urgent action is waiting."}
            </p>
          </div>
          <div className="flex min-w-0 items-center gap-3 rounded-md border border-[var(--border)] bg-white px-3.5 py-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${props.connected ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--tertiary-soft)] text-[var(--tertiary)]"}`}>
              <Icon name={props.whatsappEnabled ? "smartphone" : "sparkles"} className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] text-[var(--text-muted)]">{props.whatsappEnabled ? "WhatsApp line" : "AI Business Bot"}</span>
              <strong className="block truncate text-xs font-semibold">{props.whatsappEnabled ? props.displayPhoneNumber || "Not connected" : props.botName}</strong>
            </span>
            <span className={`status-pill ${props.connected ? "status-success" : "status-warning"}`}>{props.connected ? "Live" : "Setup"}</span>
          </div>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Messaging overview">
          <SignalCard
            label="Needs reply"
            value={String(props.metrics.unanswered)}
            helper={props.metrics.unanswered ? "Open conversations" : "Queue is clear"}
            icon="message-circle"
            tone="coral"
            progress={props.metrics.unanswered ? 68 : 100}
          />
          <SignalCard
            label="Delivery"
            value={`${props.metrics.deliveryRate}%`}
            helper={props.metrics.failed ? `${props.metrics.failed} failed events` : "Sending normally"}
            icon="arrow-right"
            tone="blue"
            progress={props.metrics.deliveryRate}
          />
          <SignalCard
            label="Read rate"
            value={`${props.metrics.readRate}%`}
            helper={`${props.metrics.contacts} active contacts`}
            icon="inbox"
            tone="violet"
            progress={props.metrics.readRate}
          />
          <SignalCard
            label="First response"
            value={props.metrics.averageResponseLabel}
            helper={`${props.metrics.incoming} inbound messages`}
            icon="bar-chart-3"
            tone="green"
            progress={responseScore(props.metrics.averageResponseLabel)}
          />
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 space-y-5">
            <section id="human-response" className="soft-card overflow-hidden rounded-lg">
              <SectionHeader eyebrow="Human response SLA" title="Team response report" status={props.humanResponse.overdue ? `${props.humanResponse.overdue} overdue` : `${props.humanResponse.waiting} waiting`} warning={props.humanResponse.overdue > 0} />
              <div className="grid grid-cols-2 border-b border-[var(--border)] sm:grid-cols-4">{[["SLA", `${props.humanResponse.slaMinutes}m`], ["Reminder", String(props.humanResponse.reminder)], ["Overdue", String(props.humanResponse.overdue)], ["Fallback candidates", String(props.humanResponse.fallbackEligible)]].map(([label, value]) => <div key={label} className="border-r border-[var(--border)] p-4 last:border-r-0"><small className="block text-[10px] text-[var(--text-muted)]">{label}</small><strong className="mt-1 block text-lg">{value}</strong></div>)}</div>
              <div className="divide-y divide-[var(--border)]">{props.humanResponse.items.slice(0, 5).map((item) => <Link key={item.leadId} href="/whatsapp-bot" className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_110px_100px] sm:items-center"><span><strong className="block text-sm">{item.name}</strong><small className="mt-1 block truncate text-[11px] text-[var(--text-muted)]">{item.latestMessage}</small></span><span className={`status-pill ${item.state === "OVERDUE" ? "status-error" : item.state === "REMINDER" ? "status-warning" : "status-info"}`}>{item.state.toLowerCase()}</span><strong className="text-xs sm:text-right">{item.waitingMinutes}m waiting</strong></Link>)}{!props.humanResponse.items.length ? <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">No customer is waiting for a team response.</div> : null}</div>
              <div className="border-t border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3 text-[11px] leading-5 text-[var(--text-muted)]">Fallback candidates are reported only. No customer message is sent automatically in this release.</div>
            </section>
            <section className="soft-card overflow-hidden rounded-lg">
              <SectionHeader
                eyebrow="Priority"
                title="Action queue"
                status={actionCount ? `${actionCount} open` : "All clear"}
                warning={actionCount > 0}
              />
              <div className="divide-y divide-[var(--border)]">
                {props.attention.slice(0, 4).map((item, index) => (
                  <ActionItem key={item.title} item={item} rank={index + 1} />
                ))}
              </div>
            </section>

            <section className="soft-card overflow-hidden rounded-lg">
              <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">Live activity</p>
                  <h3 className="mt-0.5 text-base font-semibold">Recent conversations</h3>
                </div>
                <Link href="/whatsapp-bot" className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-strong)]">
                  View inbox
                  <Icon name="arrow-right" className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {props.recent.length ? props.recent.map((lead) => <ConversationRow key={lead.id} lead={lead} />) : <EmptyConversations whatsappEnabled={props.whatsappEnabled} />}
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-[88px]">
            <section className="soft-card overflow-hidden rounded-lg">
              <div className="border-b border-[var(--border)] px-5 py-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-medium text-[var(--text-muted)]">AI Business Bot</p><h3 className="mt-0.5 text-base font-semibold">{props.botName}</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-[.1em] text-[var(--primary-strong)]">{props.botCategory.replaceAll("_", " ")}</p></div><span className={`status-pill ${props.botReadiness.ready ? "status-success" : "status-warning"}`}>{props.botReadiness.percent}%</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f8f0d8]"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${props.botReadiness.percent}%` }} /></div></div>
              <div className="divide-y divide-[var(--border)] px-5">{props.botReadiness.checks.map((check) => <Link key={check.key} href={check.href} className="flex items-start justify-between gap-3 py-3"><span><strong className="block text-xs">{check.label}</strong><small className="mt-1 block text-[10px] leading-4 text-[var(--text-muted)]">{check.detail}</small></span><span className={check.complete ? "text-[var(--success)]" : "text-[#d98a2b]"}>{check.complete ? "✓" : "○"}</span></Link>)}</div>
            </section>
            <section className="soft-card overflow-hidden rounded-lg">
              <div className="border-b border-[var(--border)] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium text-[var(--text-muted)]">Account health</p>
                    <h3 className="mt-0.5 text-base font-semibold">{healthy ? "Ready to operate" : "Review required"}</h3>
                  </div>
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${healthy ? "bg-[var(--success)]" : "bg-[#d98a2b]"}`} />
                </div>
              </div>
              <div className="divide-y divide-[var(--border)] px-5">
                {props.readiness.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-4 py-3">
                    <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${item.ok ? "text-[var(--success)]" : "text-[var(--tertiary)]"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${item.ok ? "bg-[var(--success)]" : "bg-[#d98a2b]"}`} />
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/setup" className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3.5 text-xs font-semibold text-[var(--primary-strong)] transition hover:bg-[var(--surface-soft)]">
                Connection settings
                <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="soft-card rounded-lg p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">Approved bot activity</p>
                  <h3 className="mt-0.5 text-base font-semibold">Managed by AiFrogi</h3>
                </div>
                <span className="rounded-full bg-[var(--primary-soft)] px-2 py-1 text-[10px] font-semibold text-[var(--primary-strong)]">AiFrogi</span>
              </div>
              <div className="mt-4 space-y-3">
                <SystemTask label="Inbound capture" active={props.connected} />
                <SystemTask label="Knowledge replies" active={props.knowledgeReady} />
                <SystemTask label="Delivery monitoring" active={props.connected} />
              </div>
              <p className="mt-4 text-[11px] leading-5 text-[var(--text-muted)]">Connector-based actions appear only after your business rules, approvals and test evidence are complete.</p>
            </section>

            <section className="rounded-lg border border-[#dbe8ff] bg-[var(--info-soft)] p-5">
              <div className="flex items-center gap-2 text-[var(--info)]">
                <Icon name="help-circle" className="h-4 w-4" />
                <h3 className="text-sm font-semibold">Support context is ready</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#526278]">
                {props.openTicketCount
                  ? `${props.openTicketCount} support ticket${props.openTicketCount === 1 ? " is" : "s are"} currently open.`
                  : "No support ticket is open. Connection details are attached automatically when you create one."}
              </p>
              <Link href="/support" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--info)]">
                Open support
                <Icon name="arrow-right" className="h-3.5 w-3.5" />
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

type SignalTone = "coral" | "blue" | "violet" | "green";

function SignalCard({
  label,
  value,
  helper,
  icon,
  tone,
  progress
}: {
  label: string;
  value: string;
  helper: string;
  icon: "message-circle" | "arrow-right" | "inbox" | "bar-chart-3";
  tone: SignalTone;
  progress: number;
}) {
  const styles: Record<SignalTone, { icon: string; bar: string }> = {
    coral: { icon: "bg-[#fff0eb] text-[#c75c38]", bar: "bg-[#e87855]" },
    blue: { icon: "bg-[var(--info-soft)] text-[var(--info)]", bar: "bg-[#4a8fe7]" },
    violet: { icon: "bg-[var(--primary-soft)] text-[var(--primary-strong)]", bar: "bg-[var(--primary)]" },
    green: { icon: "bg-[var(--success-soft)] text-[var(--success)]", bar: "bg-[#28a77f]" }
  };
  const style = styles[tone];
  const width = Math.min(100, Math.max(4, Number.isFinite(progress) ? progress : 0));

  return (
    <article className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 text-[26px] font-semibold leading-none text-[var(--text)]">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-md ${style.icon}`}>
          <Icon name={icon} className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f8f0d8]">
        <span className={`block h-full rounded-full ${style.bar}`} style={{ width: `${width}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">{helper}</p>
    </article>
  );
}

function SectionHeader({
  eyebrow,
  title,
  status,
  warning
}: {
  eyebrow: string;
  title: string;
  status: string;
  warning: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4">
      <div>
        <p className="text-[11px] font-medium text-[var(--text-muted)]">{eyebrow}</p>
        <h3 className="mt-0.5 text-base font-semibold">{title}</h3>
      </div>
      <span className={`status-pill ${warning ? "status-warning" : "status-success"}`}>{status}</span>
    </div>
  );
}

function ActionItem({ item, rank }: { item: DashboardAttention; rank: number }) {
  const rankStyle = item.tone === "urgent"
    ? "bg-[var(--error-soft)] text-[var(--error)]"
    : item.tone === "waiting"
      ? "bg-[var(--tertiary-soft)] text-[var(--tertiary)]"
      : "bg-[var(--success-soft)] text-[var(--success)]";

  return (
    <div className="grid gap-3 px-5 py-4 transition hover:bg-[var(--surface-soft)] sm:grid-cols-[32px_minmax(0,1fr)_auto] sm:items-center">
      <span className={`flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold ${rankStyle}`}>{rank}</span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-semibold">{item.title}</strong>
          <small className="rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">{item.owner}</small>
        </span>
        <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{item.reason}</span>
      </span>
      <Link href={item.href} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary-strong)]">
        {item.action}
        <Icon name="arrow-right" className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function ConversationRow({ lead }: { lead: Lead }) {
  const message = lead.transcript.at(-1);
  const needsReply = message?.from === "guest";

  return (
    <Link href="/whatsapp-bot" className="grid gap-3 px-5 py-3.5 transition hover:bg-[var(--surface-soft)] sm:grid-cols-[36px_minmax(0,1fr)_112px] sm:items-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--secondary-soft)] text-xs font-semibold text-[var(--secondary)]">{lead.initials}</span>
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <strong className="truncate text-sm font-semibold">{lead.name}</strong>
          {lead.isHighPriority ? <span className="h-1.5 w-1.5 rounded-full bg-[#e87855]" title="Priority conversation" /> : null}
        </span>
        <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{message?.text || "No message yet"}</span>
      </span>
      <span className="sm:text-right">
        <span className={`status-pill ${needsReply ? "status-warning" : "status-success"}`}>{needsReply ? "Reply" : "Answered"}</span>
        <small className="mt-1 block text-[10px] text-[var(--text-muted)]">{lead.updatedAtLabel}</small>
      </span>
    </Link>
  );
}

function EmptyConversations({ whatsappEnabled }: { whatsappEnabled: boolean }) {
  return (
    <div className="px-6 py-9 text-center">
      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-md bg-[var(--secondary-soft)] text-[var(--text-muted)]">
        <Icon name="message-circle" className="h-4 w-4" />
      </span>
      <h4 className="mt-3 text-sm font-semibold">No conversations yet</h4>
      <p className="mx-auto mt-1.5 max-w-sm text-xs leading-5 text-[var(--text-muted)]">New {whatsappEnabled ? "WhatsApp" : "website AI Bot"} conversations will appear here with a clear reply state.</p>
    </div>
  );
}

function SystemTask({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-[var(--text-muted)]">{label}</span>
      <span className={`inline-flex items-center gap-1.5 font-semibold ${active ? "text-[var(--success)]" : "text-[var(--tertiary)]"}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[var(--success)]" : "bg-[#d98a2b]"}`} />
        {active ? "Active" : "Waiting"}
      </span>
    </div>
  );
}

function responseScore(label: string) {
  const numeric = Number.parseInt(label, 10);
  if (!Number.isFinite(numeric)) return 100;
  if (label.toLowerCase().includes("h")) return 20;
  return Math.max(8, Math.min(100, 100 - numeric * 4));
}
