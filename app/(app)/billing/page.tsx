import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { BILLING_PLAN_CATALOGUE, formatMoney, getCustomerBillingDetail } from "@/lib/billing-super-admin";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { ActivatePlan } from "@/components/billing/activate-plan";
import { BuyAiCredits } from "@/components/billing/buy-ai-credits";
import { CreditHistoryTable } from "@/components/billing/credit-history-table";
import { aiReplyAllowancePosition } from "@/lib/ai-credits";

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

  const replies = aiReplyAllowancePosition({ included: billing.limits.aiReplies, added: billing.aiCredits.granted, used: billing.usage.aiReplies });

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
        <Card className="p-6">
          <p className="product-eyebrow">Current period</p>
          <h2 className="mt-2 text-2xl font-semibold">Your available usage.</h2>
          <div className="mt-6 space-y-5">
            <div>
              <div className="flex items-start justify-between gap-4 text-sm">
                <span><strong className="block">AI replies</strong><small className={replies.available ? "text-[#17694f]" : "text-[#b53b33]"}>{replies.available ? "Bot replies are active" : "Credits exhausted · add credits to resume"}</small></span>
                <span className="text-right text-[var(--text-muted)]"><strong className="block text-[#17211e]">{replies.remaining.toLocaleString("en-IN")} remaining</strong>{replies.used.toLocaleString("en-IN")} used of {replies.total.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/7"><div className={`h-full rounded-full ${replies.available ? "bg-[#17694f]" : "bg-[#c84b42]"}`} style={{ width: `${replies.percent}%` }} /></div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{replies.included.toLocaleString("en-IN")} plan replies + {replies.added.toLocaleString("en-IN")} purchased or free credits. New credits increase this balance immediately.</p>
            </div>
          </div>
        </Card>
        <Card className="p-6"><p className="product-eyebrow">Plan choices</p><h2 className="mt-2 text-2xl font-semibold">Continue after the trial.</h2><div className="mt-5 divide-y divide-black/7">{BILLING_PLAN_CATALOGUE.filter((plan) => ["AI_STARTER_MONTHLY", "AI_STARTER_YEARLY", "CUSTOM"].includes(plan.code)).map((plan) => <div key={plan.code} className="flex items-start justify-between gap-4 py-4"><div><strong>{plan.name}</strong><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{plan.description}</p></div><span className="shrink-0 text-sm font-bold">{plan.amountPaisa ? `${formatMoney(plan.amountPaisa)} / ${plan.billingInterval === "YEARLY" ? "year" : "month"}` : "Contact us"}</span></div>)}</div><Link href="https://aifrogi.com/pricing" className="mt-5 inline-flex text-sm font-bold text-[#6d5310]">Compare full pricing →</Link></Card>
      </section>

      <Card className="p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="product-eyebrow">AI reply credits</p><h2 className="mt-2 text-2xl font-semibold">{billing.aiCredits.remaining.toLocaleString("en-IN")} extra credits available</h2><div className="mt-4 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-[#f4ecd5] px-3 py-1.5"><strong>{billing.aiCredits.purchasedRemaining.toLocaleString("en-IN")}</strong> purchased</span><span className="rounded-full bg-[#eaf7f1] px-3 py-1.5"><strong>{billing.aiCredits.promotionalRemaining.toLocaleString("en-IN")}</strong> promotional</span><span className="rounded-full bg-black/5 px-3 py-1.5"><strong>{billing.aiCredits.used.toLocaleString("en-IN")}</strong> extra used</span></div><p className="mt-3 text-sm text-[var(--text-muted)]">Included plan replies are used first, followed by promotional and purchased credits. The bot stops safely when all allowances are exhausted.</p></div><BuyAiCredits /></div></Card>

      <section><p className="product-eyebrow">Credit and usage history</p><h2 className="mt-2 text-2xl font-semibold">Every allocation and payment.</h2><p className="mb-4 mt-2 text-sm text-[var(--text-muted)]">Verified purchases and Super Admin grants appear immediately in this account.</p><CreditHistoryTable entries={billing.organization.aiCreditTransactions} included={billing.limits.aiReplies} used={billing.usage.aiReplies} extraUsed={billing.aiCredits.used} remaining={billing.aiCredits.remaining} /></section>

      <section><p className="product-eyebrow">Payments and invoices</p><div className="mt-4 overflow-hidden border border-black/7 bg-white"><div className="divide-y divide-black/7">{billing.organization.invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm">{invoice.invoiceNumber}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{invoice.status.replaceAll("_", " ")} · {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(invoice.createdAt)}{invoice.paymentReference ? ` · Payment ${invoice.paymentReference}` : ""}</p></div><strong>{formatMoney(invoice.totalPaisa)}</strong></div>)}{!billing.organization.invoices.length ? <p className="px-5 py-10 text-sm text-[var(--text-muted)]">No payments or invoices have been recorded.</p> : null}</div></div></section>
    </div>
  </div>;
}
