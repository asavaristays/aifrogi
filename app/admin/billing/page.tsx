import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatMoney, getBillingCommandCenter, usagePercent } from "@/lib/billing-super-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminBillingPage() {
  const { plans, customers, incidents, auditLogs } = await getBillingCommandCenter();
  const activeCustomers = customers.filter((item) => ["ACTIVE", "TRIALING"].includes(item.subscription?.status || "")).length;
  const atRisk = customers.filter((item) => item.health.status === "AT_RISK").length;
  const pastDue = customers.reduce((sum, item) => sum + item.organization.invoices.filter((invoice) => invoice.status === "PAST_DUE" || (invoice.status === "ISSUED" && invoice.dueAt && invoice.dueAt < new Date())).length, 0);
  const outstandingPaisa = customers.reduce((sum, item) => sum + item.organization.invoices.filter((invoice) => invoice.status !== "PAID" && invoice.status !== "VOID").reduce((invoiceSum, invoice) => invoiceSum + invoice.totalPaisa, 0), 0);
  const openIncidents = incidents.filter((incident) => incident.status !== "RESOLVED");

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="product-eyebrow">Section 06</p>
          <h1 className="mt-2 text-3xl font-semibold">Billing and customer health</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            Server-owned plans, verified Razorpay payments, invoices, usage limits, incidents, and audited operator intervention.
          </p>
        </div>
        <Badge tone={atRisk || openIncidents.length ? "tertiary" : "secondary"}>
          {atRisk || openIncidents.length ? "Operator review required" : "Platform healthy"}
        </Badge>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Metric label="Customers" value={String(customers.length)} helper={`${activeCustomers} active or trialing`} tone="pink" />
        <Metric label="At risk" value={String(atRisk)} helper="Health score below 60" tone="red" />
        <Metric label="Past due" value={String(pastDue)} helper="Manual recovery queue" tone="amber" />
        <Metric label="Outstanding" value={formatMoney(outstandingPaisa)} helper="Issued and unpaid invoices" tone="blue" />
        <Metric label="Open incidents" value={String(openIncidents.length)} helper="Customer or platform scope" tone="purple" />
      </section>

      <section className="overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/6 px-5 py-4">
          <div>
            <p className="product-eyebrow">Customer control</p>
            <h2 className="mt-1 text-xl font-semibold">Health, subscription and usage</h2>
          </div>
          <Badge tone="neutral">Razorpay + manual reconciliation</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-[#f7f9f8] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Health</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Messages</th>
                <th className="px-5 py-3">AI replies</th>
                <th className="px-5 py-3">Campaigns</th>
                <th className="px-5 py-3">Billing</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/6">
              {customers.map(({ organization, subscription, usage, limits, health }) => {
                const latestInvoice = organization.invoices[0];
                return (
                  <tr key={organization.id} className="align-top hover:bg-[#fbfcfb]">
                    <td className="px-5 py-4">
                      <strong className="block">{organization.name}</strong>
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">{organization.ownerEmail}</span>
                    </td>
                    <td className="px-5 py-4">
                      <HealthBadge status={health.status} score={health.score} />
                      <span className="mt-2 block max-w-48 text-xs leading-5 text-[var(--text-muted)]">{health.reasons[0]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <strong>{subscription?.plan.name || organization.plan}</strong>
                      <span className="mt-1 block text-xs text-[var(--text-muted)]">{subscription?.status || "NOT SET"}</span>
                    </td>
                    <td className="px-5 py-4"><Usage value={usage.messages} limit={limits.messages} /></td>
                    <td className="px-5 py-4"><Usage value={usage.aiReplies} limit={limits.aiReplies} /></td>
                    <td className="px-5 py-4"><Usage value={usage.campaigns} limit={limits.campaigns} /></td>
                    <td className="px-5 py-4">
                      {latestInvoice ? <><InvoiceStatus value={latestInvoice.status} /><span className="mt-2 block text-xs text-[var(--text-muted)]">{formatMoney(latestInvoice.totalPaisa)}</span>{latestInvoice.paymentReference ? <span className="mt-1 block max-w-44 truncate text-[11px] text-[var(--text-muted)]" title={latestInvoice.paymentReference}>Razorpay: {latestInvoice.paymentReference}</span> : null}</> : <span className="text-xs text-[var(--text-muted)]">No invoice</span>}
                    </td>
                    <td className="px-5 py-4 text-right"><Link className="font-bold text-[#6d5310]" href={`/admin/customers/${organization.id}`}>Manage</Link></td>
                  </tr>
                );
              })}
              {!customers.length ? <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">No customer organizations found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-black/7 bg-white p-5 shadow-sm">
          <div>
            <p className="product-eyebrow">Plan catalogue</p>
            <h2 className="mt-1 text-xl font-semibold">Server-side entitlements</h2>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {plans.map((plan) => {
              const limits = plan.limits && typeof plan.limits === "object" && !Array.isArray(plan.limits) ? plan.limits as Record<string, number> : {};
              return (
                <div key={plan.id} className="rounded-lg border border-black/6 bg-[#fbfcfb] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div><strong>{plan.name}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{plan.billingInterval}</p></div>
                    <Badge tone={plan.code === "TRIAL" ? "primary" : "secondary"}>{plan.amountPaisa ? formatMoney(plan.amountPaisa) : plan.code === "CUSTOM" ? "Contract" : "15 days"}</Badge>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{plan.description}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <PlanLimit label="Messages" value={limits.messages} />
                    <PlanLimit label="Campaigns" value={limits.campaigns} />
                    <PlanLimit label="AI replies" value={limits.aiReplies} />
                    <PlanLimit label="Users" value={limits.teamUsers} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-black/7 bg-[#101010] p-6 text-white shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#e2c66d]">Payment architecture</p>
          <h2 className="mt-2 text-2xl font-semibold">Verified payment activation.</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Razorpay Checkout collects payment details. AiFrogi verifies the signed payment, activates the selected plan, records the invoice and keeps the gateway reference for reconciliation.
          </p>
          <div className="mt-6 space-y-3">
            {[
              ["AiFrogi fee", "Plan and platform subscription"],
              ["Meta charges", "WhatsApp conversation/template charges"],
              ["AI overage", "Usage above included allowance"],
              ["Services", "Setup, creative, integration or managed work"],
              ["Tax", "Recorded separately for reconciliation"]
            ].map(([label, helper]) => (
              <div key={label} className="rounded-md border border-white/8 bg-white/5 p-4">
                <strong className="text-sm">{label}</strong>
                <span className="mt-1 block text-xs text-white/50">{helper}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Timeline title="Platform incidents" eyebrow="Reliability queue" empty="No incidents recorded.">
          {incidents.slice(0, 12).map((incident) => (
            <TimelineItem
              key={incident.id}
              title={incident.title}
              helper={`${incident.organization?.name || "Platform-wide"} · ${incident.category} · ${incident.severity}`}
              status={incident.status}
              date={incident.startedAt}
            />
          ))}
        </Timeline>
        <Timeline title="Audit trail" eyebrow="Operator accountability" empty="No audited billing actions yet.">
          {auditLogs.slice(0, 12).map((log) => (
            <TimelineItem
              key={log.id}
              title={log.summary}
              helper={`${log.organization?.name || "Platform"} · ${log.actorEmail}`}
              status={log.action}
              date={log.createdAt}
            />
          ))}
        </Timeline>
      </section>
    </main>
  );
}

function Metric({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "pink" | "red" | "amber" | "blue" | "purple" }) {
  const classes = {
    pink: "border-[#f8f0d8] bg-[#f8f0d8] text-[#6d5310]",
    red: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
    amber: "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
    blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
    purple: "border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9]"
  }[tone];
  return <div className={`rounded-lg border p-5 ${classes}`}><p className="text-xs font-bold uppercase tracking-[0.08em] opacity-70">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs opacity-70">{helper}</p></div>;
}

function HealthBadge({ status, score }: { status: string; score: number }) {
  const tone = status === "HEALTHY" ? "secondary" : status === "WATCH" ? "tertiary" : "error";
  return <Badge tone={tone}>{status.replaceAll("_", " ")} · {score}</Badge>;
}

function InvoiceStatus({ value }: { value: string }) {
  const tone = value === "PAID" ? "secondary" : value === "PAST_DUE" ? "error" : value === "ISSUED" ? "tertiary" : "neutral";
  return <Badge tone={tone}>{value.replaceAll("_", " ")}</Badge>;
}

function Usage({ value, limit }: { value: number; limit: number }) {
  const percent = usagePercent(value, limit);
  const color = percent >= 100 ? "bg-[#b91c1c]" : percent >= 80 ? "bg-[#d97706]" : "bg-[#6d5310]";
  return <div className="w-32"><div className="flex justify-between text-xs"><strong>{value.toLocaleString("en-IN")}</strong><span className="text-[var(--text-muted)]">{percent}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/7"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(percent, 100)}%` }} /></div><span className="mt-1 block text-[11px] text-[var(--text-muted)]">of {limit.toLocaleString("en-IN")}</span></div>;
}

function PlanLimit({ label, value }: { label: string; value?: number }) {
  return <div className="rounded-md bg-white px-3 py-2"><span className="text-[var(--text-muted)]">{label}</span><strong className="mt-1 block">{Number(value || 0).toLocaleString("en-IN")}</strong></div>;
}

function Timeline({ title, eyebrow, empty, children }: { title: string; eyebrow: string; empty: string; children: React.ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return <div className="rounded-lg border border-black/7 bg-white p-5 shadow-sm"><p className="product-eyebrow">{eyebrow}</p><h2 className="mt-1 text-xl font-semibold">{title}</h2><div className="mt-5 space-y-3">{hasChildren ? children : <p className="rounded-md bg-[#f7f9f8] p-5 text-center text-sm text-[var(--text-muted)]">{empty}</p>}</div></div>;
}

function TimelineItem({ title, helper, status, date }: { title: string; helper: string; status: string; date: Date }) {
  return <div className="border-l-2 border-[#6d5310] pl-4"><div className="flex flex-wrap items-start justify-between gap-2"><strong className="text-sm">{title}</strong><Badge tone="neutral">{status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{helper}</p><p className="mt-1 text-[11px] text-[#9aa39f]">{formatDate(date)}</p></div>;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(value);
}
