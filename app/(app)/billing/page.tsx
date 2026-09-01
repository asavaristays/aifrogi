import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { BILLING_PLAN_CATALOGUE, formatMoney, getCustomerBillingDetail, usagePercent } from "@/lib/billing-super-admin";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { ActivatePlan } from "@/components/billing/activate-plan";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ plan?: string; checkout?: string }> }) {
  const query = await searchParams;
  const access = await getCurrentClientAccess();
  if (!access) redirect("/login");
  if (!canManageWorkspace(access.role)) redirect("/dashboard");
  const [billing, subscriptionAccess] = await Promise.all([
    getCustomerBillingDetail(access.organization.id),
    getOrganizationSubscriptionAccess(access.organization.id)
  ]);
  if (!billing || !subscriptionAccess) return null;

  const usage = [
    ["Contacts", billing.usage.contacts, billing.limits.contacts],
    ["Messages", billing.usage.messages, billing.limits.messages],
    ["Campaigns", billing.usage.campaigns, billing.limits.campaigns],
    ["AI replies", billing.usage.aiReplies, billing.limits.aiReplies],
    ["Team users", billing.usage.teamUsers, billing.limits.teamUsers]
  ] as const;

  return <div className="product-surface min-h-screen">
    <TopBar title="Billing and usage" subtitle="Trial, plan allowances, invoices, and renewal" />
    <div className="mx-auto max-w-[1400px] space-y-6 px-5 py-6 sm:px-8">
      <section className={`border p-6 ${subscriptionAccess.paused ? "border-[#e7bb70] bg-[#fff6e7]" : "border-black/7 bg-white"}`}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div><div className="flex flex-wrap items-center gap-2"><Badge tone={subscriptionAccess.paused ? "error" : "secondary"}>{subscriptionAccess.status}</Badge><span className="text-sm font-bold">{subscriptionAccess.planName}</span></div><h1 className="mt-4 text-3xl font-semibold">{subscriptionAccess.paused ? "Your workspace is paused." : subscriptionAccess.planCode === "TRIAL" ? `${subscriptionAccess.daysLeft} days remain.` : "Your plan is active."}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{subscriptionAccess.message}</p></div>
          <ActivatePlan activePlanCode={subscriptionAccess.planCode} initialPlanCode={query.plan} openOnLoad={query.checkout === "1"} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="p-6"><p className="product-eyebrow">Current period</p><h2 className="mt-2 text-2xl font-semibold">Usage remains visible when paused.</h2><div className="mt-6 space-y-5">{usage.map(([label, value, limit]) => { const percent = usagePercent(value, limit); return <div key={label}><div className="flex items-center justify-between gap-4 text-sm"><strong>{label}</strong><span className="text-[var(--text-muted)]">{value.toLocaleString("en-IN")} / {limit.toLocaleString("en-IN")}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-black/7"><div className={`h-full rounded-full ${percent >= 90 ? "bg-[#c84b42]" : "bg-[#8a6a16]"}`} style={{ width: `${Math.min(100, percent)}%` }} /></div></div>; })}</div></Card>
        <Card className="p-6"><p className="product-eyebrow">Plan choices</p><h2 className="mt-2 text-2xl font-semibold">Continue after the trial.</h2><div className="mt-5 divide-y divide-black/7">{BILLING_PLAN_CATALOGUE.filter((plan) => ["AI_STARTER_MONTHLY", "AI_STARTER_YEARLY", "CUSTOM"].includes(plan.code)).map((plan) => <div key={plan.code} className="flex items-start justify-between gap-4 py-4"><div><strong>{plan.name}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{plan.description}</p></div><span className="shrink-0 text-sm font-bold">{plan.amountPaisa ? `${formatMoney(plan.amountPaisa)} / ${plan.billingInterval === "YEARLY" ? "year" : "month"}` : "Contact us"}</span></div>)}</div><Link href="https://aifrogi.com/pricing" className="mt-5 inline-flex text-sm font-bold text-[#6d5310]">Compare full pricing →</Link></Card>
      </section>

      <section><p className="product-eyebrow">Payments and invoices</p><div className="mt-4 overflow-hidden border border-black/7 bg-white"><div className="divide-y divide-black/7">{billing.organization.invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm">{invoice.invoiceNumber}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{invoice.status.replaceAll("_", " ")} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(invoice.createdAt)}{invoice.paymentReference ? ` · Payment ${invoice.paymentReference}` : ""}</p></div><strong>{formatMoney(invoice.totalPaisa)}</strong></div>)}{!billing.organization.invoices.length ? <p className="px-5 py-10 text-sm text-[var(--text-muted)]">No payments or invoices have been recorded.</p> : null}</div></div></section>
    </div>
  </div>;
}
