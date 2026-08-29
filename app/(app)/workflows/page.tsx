import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { loadLeads } from "@/lib/services/lead-service";
import { buildAutomationWorkflows, getWorkflowReadiness, type AutomationWorkflow, type WorkflowTemplateStatus } from "@/lib/workflow-automation";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { BOT_ANSWER_CONSTITUTION, getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getDb } from "@/lib/db";
import { getAutomationQueueSummary, listAutomationJobs } from "@/lib/automation-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const statusTone: Record<WorkflowTemplateStatus, "secondary" | "tertiary" | "neutral"> = {
  approved: "secondary",
  pending: "tertiary",
  not_submitted: "neutral"
};

const statusLabel: Record<WorkflowTemplateStatus, string> = {
  approved: "Approved",
  pending: "Meta review",
  not_submitted: "Next approval"
};

export default async function WorkflowsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const [leads, knowledgeBase, integration] = await Promise.all([
    loadLeads(propertySlug),
    getWebsiteKnowledgeBase(propertySlug).catch(() => null),
    loadWhatsAppIntegration(propertySlug)
  ]);
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug: propertySlug }, select: { id: true } }) : null;
  const [queueSummary, recentJobs] = property
    ? await Promise.all([getAutomationQueueSummary(property.id), listAutomationJobs(property.id, 8)])
    : [null, []];
  const workflows = buildAutomationWorkflows(leads);
  const readiness = getWorkflowReadiness(workflows);
  const liveWorkflows = workflows.filter((workflow) => workflow.activeCount > 0).length;

  return (
    <div className="min-h-screen bg-[#f5f7f2]">
      <TopBar
        title="Automation Workflows"
        subtitle="Demo-ready WhatsApp, website and AI workflows for every client workspace"
        notificationCount={workflows.reduce((total, workflow) => total + workflow.activeCount, 0)}
      />

      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border border-black/6 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="product-eyebrow">Realtime automation</p><h2 className="mt-2 text-2xl font-semibold">How an inbound question is handled</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">This path is active on the connected WhatsApp webhook. Timed follow-ups remain separate and run only after the workflow and template are enabled.</p></div><span className={`status-pill ${integration.status === "CONNECTED" ? "status-success" : "status-warning"}`}>{integration.status === "CONNECTED" ? "Live" : "Connection needed"}</span></div>
            <div className="mt-6 grid gap-px overflow-hidden rounded-md border border-black/7 bg-black/7 md:grid-cols-4">
              {[
                ["1", "Welcome", "First inbound message receives the approved service menu."],
                ["2", "Understand", "Intent rules classify audit, trial, service, or human request."],
                ["3", "Answer", "OpenAI uses only relevant pages from the crawled website knowledge."],
                ["4", "Escalate", "Unknown, sensitive, or human-requested conversations reach the team."]
              ].map(([number, title, helper]) => <div key={number} className="bg-[#fbfcfb] p-4"><span className="text-xs font-bold text-[#6d5310]">{number}</span><strong className="mt-5 block text-sm">{title}</strong><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{helper}</p></div>)}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><InfoBlock label="Knowledge pages" value={String(knowledgeBase?.pages.length || 0)} /><InfoBlock label="Knowledge buckets" value={String(new Set(knowledgeBase?.pages.map((page) => page.bucket) || []).size)} /><InfoBlock label="Last crawl" value={knowledgeBase?.crawledAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(knowledgeBase.crawledAt)) : "Not available"} /></div>
          </Card>
          <Card className="border border-black/6 bg-[#101010] p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#e2c66d]">Answer constitution</p><h2 className="mt-2 text-2xl font-semibold">AI has explicit boundaries.</h2><div className="mt-5 max-h-80 space-y-3 overflow-auto pr-2">{BOT_ANSWER_CONSTITUTION.split("\n").map((rule, index) => <div key={rule} className="flex gap-3 border-t border-white/8 pt-3"><span className="text-xs font-bold text-[#e2c66d]">{String(index + 1).padStart(2, "0")}</span><p className="text-xs leading-5 text-white/68">{rule}</p></div>)}</div></Card>
        </section>
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border border-black/6 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="product-eyebrow">Section 05 executor</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#15131f]">Durable automation queue</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                  Timed and event-driven automations are now reserved as durable jobs before any action runs. Visual workflow design stays locked until this executor is reliable.
                </p>
              </div>
              <span className={`status-pill ${(queueSummary?.dead || 0) > 0 ? "status-warning" : "status-success"}`}>
                {(queueSummary?.dead || 0) > 0 ? "Needs review" : "Executor ready"}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              <QueueStat label="Due now" value={String(queueSummary?.dueNow ?? 0)} tone="pink" />
              <QueueStat label="Queued" value={String(queueSummary?.queued ?? 0)} tone="blue" />
              <QueueStat label="Retry" value={String(queueSummary?.retry ?? 0)} tone="amber" />
              <QueueStat label="Dead letter" value={String(queueSummary?.dead ?? 0)} tone="red" />
            </div>
            <div className="mt-5 rounded-lg border border-black/5 bg-[#f8fafc] p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Safety model</p>
              <div className="mt-3 grid gap-2 text-sm font-semibold leading-5 text-[#23312d] sm:grid-cols-2">
                <p>Idempotency blocks duplicate customer actions.</p>
                <p>Worker leases survive process restarts.</p>
                <p>Retries use backoff before dead-lettering.</p>
                <p>Current executor records safe internal outcomes only.</p>
              </div>
            </div>
          </Card>
          <Card className="border border-black/6 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="product-eyebrow">Operations timeline</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#15131f]">Recent automation jobs</h2>
              </div>
              <Badge tone="neutral">Next due {queueSummary?.nextDueAt ? formatWorkflowDate(queueSummary.nextDueAt) : "None"}</Badge>
            </div>
            <div className="mt-5 space-y-3">
              {recentJobs.length ? recentJobs.map((job) => (
                <div key={job.id} className="grid gap-3 rounded-lg border border-black/5 bg-[#fbfcfb] p-4 sm:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={job.status === "SUCCEEDED" ? "secondary" : job.status === "DEAD" ? "tertiary" : "primary"}>{job.status}</Badge>
                      <span className="text-xs font-bold uppercase tracking-[0.08em] text-[#8a6a16]">{job.actionType}</span>
                    </div>
                    <p className="mt-2 text-sm font-black text-[#111827]">{job.workflowId}</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{job.lastError || `Trigger: ${job.triggerType}`}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">Attempts</p>
                    <p className="mt-1 text-lg font-black text-[#15131f]">{job.attemptCount}/{job.maxAttempts}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{formatWorkflowDate(job.nextRunAt)}</p>
                  </div>
                </div>
              )) : (
                <div className="rounded-lg border border-dashed border-[#d9eadf] bg-[#f7fbf8] p-6 text-sm font-semibold text-[var(--text-muted)]">
                  No automation jobs yet. Create a safe demo digest from the API or wait for a scheduled workflow trigger.
                </div>
              )}
            </div>
          </Card>
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border border-black/5 bg-[#102f2a] text-white shadow-[0_18px_50px_rgba(16,47,42,0.18)]">
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_260px] lg:p-8">
              <div>
                <Badge tone="secondary" className="bg-white/12 text-[#8ff0bd]">AiFrogi operating layer</Badge>
                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                  Show clients a working revenue desk, not just a chatbot.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-white/70">
                  These workflows connect the website assistant, WhatsApp templates, AiFrogi inbox, AI qualification, human handoff, and follow-up discipline into one visible system.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <MetricPill label="Live workflows" value={String(liveWorkflows)} />
                  <MetricPill label="Templates" value={`${readiness.approved}/${readiness.total} approved`} />
                  <MetricPill label="Meta review" value={String(readiness.pending)} />
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/8 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">Template readiness</p>
                <p className="mt-4 text-5xl font-black">{readiness.completionPercent}%</p>
                <div className="mt-4 h-2 rounded-full bg-white/12">
                  <div className="h-2 rounded-full bg-[#25d366]" style={{ width: `${readiness.completionPercent}%` }} />
                </div>
                <div className="mt-5 grid gap-2 text-sm">
                  <ReadinessRow label="Approved" value={readiness.approved} />
                  <ReadinessRow label="Pending" value={readiness.pending} />
                  <ReadinessRow label="Need submit" value={readiness.notSubmitted} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="border border-black/5 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-black text-[#8a6a16]">Client demo script</p>
            <h3 className="mt-2 text-2xl font-black">The story to show</h3>
            <div className="mt-5 space-y-3">
              {[
                "Website visitor selects audit, trial, or WhatsApp automation.",
                "AiFrogi captures intent and asks only useful details.",
                "AI scores the lead and prepares the next action.",
                "Approved Meta templates keep follow-ups compliant.",
                "Owner sees the day’s priorities in one calm digest."
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-lg border border-black/5 bg-[#f8fafc] p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-xs font-black text-[#8a6a16]">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold leading-5 text-[#23312d]">{item}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </section>
      </div>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: AutomationWorkflow }) {
  const ready = workflow.templates.every((item) => item.status === "approved");
  const hasPending = workflow.templates.some((item) => item.status === "pending");

  return (
    <Card className="border border-black/5 bg-white p-6 shadow-[0_16px_44px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={workflow.audience === "Client business" ? "primary" : workflow.audience === "Both" ? "secondary" : "tertiary"}>
              {workflow.audience}
            </Badge>
            <Badge tone={ready ? "secondary" : hasPending ? "tertiary" : "neutral"}>
              {ready ? "Ready" : hasPending ? "Awaiting Meta" : "Needs template"}
            </Badge>
          </div>
          <h3 className="mt-3 text-2xl font-black tracking-tight text-[#111827]">{workflow.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{workflow.promise}</p>
        </div>
        <div className="rounded-lg border border-black/5 bg-[#f0fdf4] px-4 py-3 text-right">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6a16]">Live signal</p>
          <p className="mt-1 text-2xl font-black text-[#111827]">{workflow.activeCount}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <InfoBlock label="Trigger" value={workflow.trigger} />
        <InfoBlock label="Now showing" value={workflow.liveSignal} />
        <InfoBlock label="Business impact" value={workflow.impact} />
      </div>

      <div className="mt-5 rounded-lg border border-[#d9eadf] bg-[#f7fbf8] p-4">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#8a6a16]">Next action</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#23312d]">{workflow.nextAction}</p>
      </div>

      <div className="mt-6">
        <p className="text-sm font-black text-[#111827]">Automation journey</p>
        <div className="mt-3 grid gap-3">
          {workflow.steps.map((step, index) => (
            <div key={`${workflow.id}-${step.title}`} className="grid gap-3 rounded-lg border border-black/5 bg-[#fbfcfb] p-4 sm:grid-cols-[38px_1fr_auto] sm:items-start">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#102f2a] text-xs font-black text-white">{index + 1}</span>
              <span>
                <span className="block text-sm font-black text-[#111827]">{step.title}</span>
                <span className="mt-1 block text-sm leading-5 text-[var(--text-muted)]">{step.description}</span>
              </span>
              <span className="flex flex-wrap gap-2 sm:justify-end">
                <Badge tone="neutral">{step.owner}</Badge>
                <Badge tone="primary">{step.timing}</Badge>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-black text-[#111827]">Meta templates</p>
        <div className="mt-3 grid gap-2">
          {workflow.templates.map((item) => (
            <div key={`${workflow.id}-${item.name}`} className="flex flex-col gap-2 rounded-lg border border-black/5 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#111827]">{item.name}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{item.purpose}</p>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Badge tone="neutral">{item.category}</Badge>
                <Badge tone={statusTone[item.status]}>{statusLabel[item.status]}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/8 px-4 py-3">
      <span className="block text-xs font-black uppercase tracking-[0.14em] text-white/45">{label}</span>
      <span className="mt-1 block text-lg font-black text-white">{value}</span>
    </span>
  );
}

function ReadinessRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/8 px-3 py-2">
      <span className="text-white/65">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/5 bg-[#f8fafc] p-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-[#23312d]">{value}</p>
    </div>
  );
}

function QueueStat({ label, value, tone }: { label: string; value: string; tone: "pink" | "blue" | "amber" | "red" }) {
  const toneClass = {
    pink: "bg-[#f8f0d8] text-[#8a6a16] border-[#f8f0d8]",
    blue: "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]",
    amber: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
    red: "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]"
  }[tone];

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function formatWorkflowDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata"
  }).format(new Date(value));
}
