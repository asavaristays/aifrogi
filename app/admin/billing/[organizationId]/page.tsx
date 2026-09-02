import Link from "next/link";
import { notFound } from "next/navigation";
import { BillingControls } from "@/components/admin/billing-controls";
import { ensureBillingPlans, formatMoney, getCustomerBillingDetail, usagePercent } from "@/lib/billing-super-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const date = (value?: Date | null) => value
  ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(value)
  : "Not scheduled";

export default async function AdminCustomerBillingPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const [billing, plans] = await Promise.all([getCustomerBillingDetail(organizationId), ensureBillingPlans()]);
  if (!billing) notFound();

  const { organization, subscription, limits, usage } = billing;
  const expiry = subscription.status === "COMPLIMENTARY"
    ? subscription.complimentaryEndsAt
    : subscription.currentPeriodEnd || subscription.trialEndsAt;
  const outstanding = organization.invoices
    .filter((invoice) => !["PAID", "VOID"].includes(invoice.status))
    .reduce((sum, invoice) => sum + invoice.totalPaisa, 0);

  return <main className="mx-auto max-w-[1500px] space-y-7 px-4 py-8 sm:px-8 lg:px-10">
    <header className="flex flex-col gap-5 border-b border-black/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link href="/admin/billing" className="text-sm font-bold text-[#6d5310]">← Billing Operations</Link>
        <p className="product-eyebrow mt-5">Customer commercial record</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">{organization.name}</h1>
        <p className="mt-3 text-sm text-[#68645c]">{organization.ownerEmail} · All changes are audited</p>
      </div>
      <Link href={`/admin/customers/${organization.id}?onboarding=ai-bot`} className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-bold">Open customer review</Link>
    </header>

    <section className="grid overflow-hidden border border-white/70 bg-white sm:grid-cols-2 xl:grid-cols-6">
      <Metric label="Plan" value={subscription.plan.name} />
      <Metric label="Status" value={subscription.status.replaceAll("_", " ")} />
      <Metric label="Payment" value={subscription.paymentProvider || "Manual"} />
      <Metric label="Renewal / expiry" value={date(expiry)} />
      <Metric label="Outstanding" value={formatMoney(outstanding)} alert={outstanding > 0} />
      <Metric label="Add-ons" value={String(organization.billingAddons.length)} />
    </section>

    <section className="rounded-[26px] border border-white/70 bg-white p-6">
      <p className="product-eyebrow">Allowance position</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Allowance label="Messages" value={usage.messages} limit={limits.messages} />
        <Allowance label="AI replies" value={usage.aiReplies} limit={limits.aiReplies} />
        <Allowance label="Contacts" value={usage.contacts} limit={limits.contacts} />
        <Allowance label="Team users" value={usage.teamUsers} limit={limits.teamUsers} />
      </div>
    </section>

    <BillingControls
      organizationId={organization.id}
      plans={plans.map((plan) => ({ code: plan.code, name: plan.name, amountPaisa: plan.amountPaisa }))}
      initialPlan={subscription.plan.code}
      invoices={organization.invoices.map((invoice) => ({ id: invoice.id, invoiceNumber: invoice.invoiceNumber, status: invoice.status, totalPaisa: invoice.totalPaisa }))}
      addons={organization.billingAddons.map((addon) => ({ id: addon.id, name: addon.name, category: addon.category, provisioningStatus: addon.provisioningStatus, paymentStatus: addon.paymentStatus, setupFeePaisa: addon.setupFeePaisa, recurringFeePaisa: addon.recurringFeePaisa }))}
    />

    <div className="grid gap-6 xl:grid-cols-2">
      <Record title="Invoices and payments">
        {organization.invoices.map((invoice) => <div key={invoice.id} className="border-b border-black/6 py-4 last:border-0"><div className="flex items-start justify-between gap-4"><span><strong className="block text-sm">{invoice.invoiceNumber}</strong><small className="mt-1 block text-[#68645c]">{invoice.status.replaceAll("_", " ")} · {date(invoice.createdAt)}</small></span><strong>{formatMoney(invoice.totalPaisa)}</strong></div>{invoice.paymentReference ? <p className="mt-2 text-xs font-semibold text-[#17694f]">Payment reference: {invoice.paymentReference}</p> : null}</div>)}
        {!organization.invoices.length ? <p className="text-sm text-[#68645c]">No invoices issued.</p> : null}
      </Record>
      <Record title="Billing audit evidence">
        {organization.auditLogs.map((log) => <div key={log.id} className="border-l-2 border-[#6d5310] py-1 pl-4"><strong className="block text-sm">{log.summary}</strong><small className="mt-1 block text-[#68645c]">{log.actorEmail} · {date(log.createdAt)}</small></div>)}
        {!organization.auditLogs.length ? <p className="text-sm text-[#68645c]">No billing actions recorded.</p> : null}
      </Record>
    </div>
  </main>;
}

function Metric({ label, value, alert = false }: { label: string; value: string; alert?: boolean }) {
  return <div className="border-t border-black/6 p-5 first:border-0 sm:border-l sm:border-t-0"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-[#777168]">{label}</p><strong className={`mt-3 block text-lg ${alert ? "text-[#b53b33]" : ""}`}>{value}</strong></div>;
}

function Allowance({ label, value, limit }: { label: string; value: number; limit: number }) {
  const percent = usagePercent(value, limit);
  return <div className="rounded-2xl bg-[#f7f4ed] p-4"><div className="flex justify-between gap-3 text-sm"><span>{label}</span><strong>{value.toLocaleString("en-IN")} / {limit ? limit.toLocaleString("en-IN") : "Unlimited"}</strong></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/8"><div className="h-full rounded-full bg-[#8a6a16]" style={{ width: `${Math.min(percent, 100)}%` }} /></div></div>;
}

function Record({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-[26px] border border-white/70 bg-white p-6"><h2 className="text-xl font-semibold">{title}</h2><div className="mt-4 space-y-4">{children}</div></section>;
}
