import Link from "next/link";
import { listOrganizationsForAdmin } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = getDb();
  const [organizations, tickets, messageCount, failedMessages, campaignCount] = await Promise.all([
    listOrganizationsForAdmin(),
    listSupportTickets({}),
    db?.leadMessage.count() ?? 0,
    db?.leadMessage.count({ where: { deliveryStatus: { startsWith: "failed" } } }) ?? 0,
    db?.campaign.count() ?? 0
  ]);
  const live = organizations.filter((item) => item.onboarding?.metaStatus === "LIVE").length;
  const waiting = organizations.filter((item) => !["LIVE", "REJECTED"].includes(item.onboarding?.metaStatus || "")).length;
  const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const urgentTickets = openTickets.filter((ticket) => ticket.priority === "URGENT" || ticket.priority === "HIGH");
  const attention = [
    ...urgentTickets.slice(0, 3).map((ticket) => ({ title: ticket.subject, helper: `${ticket.organization.name} · ${ticket.reference}`, href: `/admin/support/${ticket.id}`, tone: "urgent" })),
    ...organizations.filter((item) => item.onboarding?.kycStatus === "SUBMITTED").slice(0, 3).map((item) => ({ title: "Business verification waiting", helper: `${item.name} submitted onboarding details`, href: `/admin/customers/${item.id}`, tone: "waiting" })),
    ...(failedMessages ? [{ title: "Message delivery failures detected", helper: `${failedMessages} stored message${failedMessages === 1 ? "" : "s"} need cause-level review`, href: "/admin/customers", tone: "urgent" }] : [])
  ];

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Super Admin</p><h1 className="mt-2 text-3xl font-semibold">Platform command center</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Customer readiness, delivery health, support, and the next operator action.</p></div><span className={`status-pill ${failedMessages || urgentTickets.length ? "status-warning" : "status-success"}`}>{failedMessages || urgentTickets.length ? "Attention needed" : "Operating normally"}</span></section>

    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><AdminMetric label="Customers live" value={String(live)} helper={`${waiting} waiting`} /><AdminMetric label="Open support" value={String(openTickets.length)} helper={`${urgentTickets.length} high priority`} /><AdminMetric label="Messages" value={String(messageCount)} helper={`${failedMessages} failures`} /><AdminMetric label="Campaign runs" value={String(campaignCount)} helper="Persisted and auditable" /><AdminMetric label="Meta access" value="Verified" helper="Embedded onboarding eligible" /></section>

    <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-black/6 px-5 py-4"><div><p className="product-eyebrow">Operator queue</p><h2 className="mt-1 text-xl font-semibold">What needs action</h2></div><span className="status-pill status-info">{attention.length}</span></div><div className="divide-y divide-black/6">{attention.length ? attention.map((item) => <Link key={`${item.title}-${item.helper}`} href={item.href} className="flex items-center gap-4 px-5 py-4 hover:bg-[#f8faf9]"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === "urgent" ? "bg-[#c84b42]" : "bg-[#d4842f]"}`}/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="mt-1 block truncate text-[var(--text-muted)]">{item.helper}</small></span><span className="text-[#b923ae]">→</span></Link>) : <p className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">No customer or platform blockers require action.</p>}</div></div>
      <div className="rounded-lg border border-black/7 bg-[#2c243b] p-6 text-white shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.08em] text-[#ff8af1]">Operating model</p><h2 className="mt-2 text-2xl font-semibold">Complexity stays here.</h2><p className="mt-3 text-sm leading-6 text-white/65">Clients see business readiness and one safe action. Super Admin sees Meta identifiers, KYC, webhook, token, billing, campaign, and support context.</p><div className="mt-6 space-y-3">{[["Client action","Business details, consent, billing approval"],["AiFrogi action","Configuration, monitoring, automation, audit trail"],["External wait","Meta review, template approval, message delivery"]].map(([label,value]) => <div key={label} className="rounded-md border border-white/8 bg-white/5 p-4"><small className="text-white/45">{label}</small><strong className="mt-1 block text-sm">{value}</strong></div>)}</div></div>
    </section>

    <section className="overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-black/6 px-5 py-4"><div><p className="product-eyebrow">Customer readiness</p><h2 className="mt-1 text-xl font-semibold">Onboarding and Meta status</h2></div><Link href="/admin/customers" className="text-sm font-bold text-[#b923ae]">All customers</Link></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-[#f7f9f8] text-xs text-[var(--text-muted)]"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">KYC</th><th className="px-5 py-3">Meta</th><th className="px-5 py-3">Webhook</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Next</th></tr></thead><tbody className="divide-y divide-black/6">{organizations.slice(0, 8).map((organization) => { const onboarding = organization.onboarding; const next = onboarding?.kycStatus === "SUBMITTED" ? "Review KYC" : onboarding?.metaStatus === "LIVE" ? "Monitor" : "Resume setup"; return <tr key={organization.id}><td className="px-5 py-4"><strong>{organization.name}</strong><small className="mt-1 block text-[var(--text-muted)]">{organization.ownerEmail}</small></td><td className="px-5 py-4"><Status value={onboarding?.kycStatus || "NOT_SUBMITTED"}/></td><td className="px-5 py-4"><Status value={onboarding?.metaStatus || "NOT_STARTED"}/></td><td className="px-5 py-4"><Status value={onboarding?.webhookStatus || "NOT_CONFIGURED"}/></td><td className="px-5 py-4">{organization.plan}</td><td className="px-5 py-4"><Link className="font-bold text-[#b923ae]" href={`/admin/customers/${organization.id}`}>{next} →</Link></td></tr>; })}</tbody></table></div></section>
  </main>;
}

function AdminMetric({ label, value, helper }: { label: string; value: string; helper: string }) { return <div className="rounded-lg border border-black/7 bg-white p-5 shadow-sm"><p className="product-eyebrow">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{helper}</p></div>; }
function Status({ value }: { value: string }) { const success = ["LIVE","APPROVED","CONFIGURED","CONNECTED"].includes(value); const warning = ["SUBMITTED","PENDING","IN_REVIEW","NOT_STARTED","NOT_CONFIGURED"].includes(value); return <span className={`status-pill ${success ? "status-success" : warning ? "status-warning" : "status-error"}`}>{value.replaceAll("_", " ")}</span>; }
