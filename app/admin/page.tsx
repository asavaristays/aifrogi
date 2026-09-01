import Link from "next/link";
import { Icon } from "@/components/icons";
import { listOrganizationsForAdmin } from "@/lib/repositories/onboarding-repository";
import { listSupportTickets } from "@/lib/repositories/support-repository";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = getDb();
  const [organizations, tickets, messageCount, failedMessages, trialRegistrations, ownerActivations] = await Promise.all([
    listOrganizationsForAdmin(), listSupportTickets({}), db?.leadMessage.count() ?? 0,
    db?.leadMessage.count({ where: { deliveryStatus: { startsWith: "failed" } } }) ?? 0,
    db?.onboardingActivity.count({ where: { action: "TRIAL_REGISTERED" } }) ?? 0,
    db?.onboardingActivity.count({ where: { action: "EMAIL_VERIFIED" } }) ?? 0
  ]);
  const aiLive = organizations.filter((item) => item.botProfile?.status === "LIVE").length;
  const aiInProgress = organizations.filter((item) => !["LIVE", "DELETED"].includes(item.botProfile?.status || "DRAFT")).length;
  const whatsappEnabled = organizations.filter((item) => item.botProfile?.channels?.includes("WHATSAPP")).length;
  const whatsappLive = organizations.filter((item) => item.botProfile?.channels?.includes("WHATSAPP") && item.onboarding?.metaStatus === "LIVE").length;
  const openTickets = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  const urgentTickets = openTickets.filter((ticket) => ["URGENT", "HIGH"].includes(ticket.priority));
  const attention = [
    ...urgentTickets.slice(0, 3).map((ticket) => ({ title: ticket.subject, helper: `${ticket.organization.name} · ${ticket.reference}`, href: `/admin/support/${ticket.id}`, urgent: true })),
    ...organizations.filter((item) => item.onboarding?.kycStatus === "SUBMITTED").slice(0, 3).map((item) => ({ title: "Business verification waiting", helper: item.name, href: `/admin/customers/${item.id}?onboarding=ai-bot`, urgent: false })),
    ...(failedMessages ? [{ title: "Message delivery needs review", helper: `${failedMessages} failed message${failedMessages === 1 ? "" : "s"}`, href: "/admin/customers", urgent: true }] : [])
  ];

  return <main className="mx-auto max-w-[1500px] space-y-7 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
    <section className="relative overflow-hidden border border-white/8 bg-[#090909] px-6 py-8 text-white sm:px-10 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-40 h-[460px] w-[460px] rounded-full bg-[#8a6a16]/30 blur-[110px]" />
      <div className="relative z-10 grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-[#e2c66d]"><span className={`h-2 w-2 rounded-full ${failedMessages || urgentTickets.length ? "bg-[#d4842f]" : "bg-[#36c99a]"}`} />{failedMessages || urgentTickets.length ? "Operator attention required" : "Platform operating normally"}</div><h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-.055em] text-white sm:text-6xl">Five pilots. One clear launch path.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-white/65">Create the client, prepare approved intelligence, install the AI Bot and release it with evidence. WhatsApp stays a separate optional track.</p></div><Link href="/admin/onboard" className="group flex min-h-14 items-center justify-between gap-8 rounded-full bg-[#d4af37] px-6 font-bold text-[#101010] shadow-[0_20px_50px_rgba(212,175,55,.2)] transition hover:-translate-y-1"><span className="flex items-center gap-3"><Icon name="sparkles" />Onboard a pilot</span><Icon name="arrow-right" className="transition group-hover:translate-x-1" /></Link></div>
      <div className="relative z-10 mt-10 flex flex-wrap gap-2.5"><Metric label="AI Bot live" value={aiLive} /><Metric label="AI Bot preparing" value={aiInProgress} /><Metric label="WhatsApp enabled" value={whatsappEnabled} /><Metric label="WhatsApp live" value={whatsappLive} /><Metric label="Owners activated" value={`${ownerActivations}/${trialRegistrations}`} /><Metric label="Open support" value={openTickets.length} /></div>
    </section>

    <section className="grid overflow-hidden border border-white/80 bg-white xl:grid-cols-[1.05fr_.95fr]">
      <div className="p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="product-eyebrow">Today’s queue</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Move what is blocked.</h2></div><span className="grid h-11 w-11 place-items-center rounded-full bg-[#f8f0d8] font-bold text-[#6d5310]">{attention.length}</span></div><div className="mt-7 space-y-2">{attention.length ? attention.map((item) => <Link key={`${item.title}-${item.helper}`} href={item.href} className="group flex items-center gap-4 rounded-[20px] px-4 py-4 transition hover:bg-[#f7f4ed]"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.urgent ? "bg-[#c84b42]" : "bg-[#d4af37]"}`} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="mt-1 block truncate text-[#68645c]">{item.helper}</small></span><Icon name="arrow-right" className="text-[#8a6a16] transition group-hover:translate-x-1" /></Link>) : <div className="rounded-[22px] bg-[#eff8f4] px-5 py-10 text-center"><strong className="text-[#17694f]">No blockers require action.</strong><p className="mt-2 text-sm text-[#68645c]">You can safely start the next pilot.</p></div>}</div></div>
      <div className="bg-[#f3f0e8] p-6 sm:p-8"><p className="product-eyebrow">Pilot launch rail</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">From client to live.</h2><ol className="mt-7 space-y-1">{[["01","Create owner","Secure activation email"],["02","Approve intelligence","Knowledge and answer preview"],["03","Install AI Bot","Script, iframe or standalone"],["04","Release live","Super Admin evidence check"]].map(([number,title,copy], index) => <li key={number} className="grid grid-cols-[42px_1fr] gap-4"><div className="flex flex-col items-center"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#101010] text-xs font-bold text-[#e2c66d]">{number}</span>{index < 3 ? <span className="h-8 w-px bg-[#cfc7b5]" /> : null}</div><div className="pb-5 pt-1"><strong className="text-sm">{title}</strong><p className="mt-1 text-xs text-[#68645c]">{copy}</p></div></li>)}</ol></div>
    </section>

    <section className="overflow-hidden border border-white/80 bg-white"><div className="flex flex-col gap-4 border-b border-black/5 px-6 py-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="product-eyebrow">Pilot portfolio</p><h2 className="mt-2 text-2xl font-semibold">Open the correct onboarding track.</h2></div><Link href="/admin/customers" className="text-sm font-bold text-[#6d5310]">All customers →</Link></div><div className="divide-y divide-black/5">{organizations.slice(0, 8).map((organization) => { const whatsapp = organization.botProfile?.channels?.includes("WHATSAPP") || false; return <div key={organization.id} className="grid gap-4 px-6 py-5 transition hover:bg-[#fbfaf7] md:grid-cols-[1fr_auto_auto] md:items-center"><div><strong>{organization.name}</strong><small className="mt-1 block text-[#68645c]">{organization.botProfile?.personaName || "Persona not designed"} · {organization.ownerEmail}</small></div><TrackStatus label="AI Bot" value={organization.botProfile?.status || "DRAFT"} /><div className="flex flex-wrap items-center gap-2"><Link href={`/admin/customers/${organization.id}?onboarding=ai-bot`} className="rounded-full bg-[#101010] px-4 py-2 text-xs font-bold text-white">Continue AI Bot</Link>{whatsapp ? <Link href={`/admin/customers/${organization.id}?onboarding=whatsapp`} className="rounded-full border border-black/10 px-4 py-2 text-xs font-bold">WhatsApp</Link> : null}</div></div>; })}{!organizations.length ? <div className="px-6 py-12 text-center text-sm text-[#68645c]">No pilots yet. Use “Onboard a pilot” to create the first workspace.</div> : null}</div></section>

    <p className="px-2 text-xs text-[#837e74]">Operational evidence: {messageCount.toLocaleString("en-IN")} messages recorded · {failedMessages} delivery failures · separate channel activation enforced.</p>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="min-w-[132px] rounded-full border border-white/10 bg-white/6 px-5 py-3 backdrop-blur"><span className="text-[10px] font-bold uppercase tracking-[.14em] text-white/42">{label}</span><strong className="ml-3 text-lg text-white">{value}</strong></div>; }
function TrackStatus({ label, value }: { label: string; value: string }) { const live = value === "LIVE"; return <div className="flex items-center gap-2 text-xs font-bold"><span className={`h-2 w-2 rounded-full ${live ? "bg-[#178665]" : "bg-[#d4af37]"}`} />{label} · {value.replaceAll("_", " ")}</div>; }
