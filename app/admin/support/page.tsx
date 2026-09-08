import Link from "next/link";
import { listSupportTickets } from "@/lib/repositories/support-repository";

export const dynamic = "force-dynamic";

const filters = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "waiting", label: "Waiting on client" },
  { value: "resolved", label: "Resolved" }
];

function statusTone(status: string) {
  if (["RESOLVED", "CLOSED"].includes(status)) return "status-success";
  if (status === "WAITING_FOR_CLIENT") return "status-warning";
  return "status-info";
}

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const [tickets, query] = await Promise.all([listSupportTickets({}), searchParams]);
  const view = filters.some((item) => item.value === query.view) ? query.view! : "open";
  const matches = tickets.filter((ticket) => {
    if (view === "all") return true;
    if (view === "waiting") return ticket.status === "WAITING_FOR_CLIENT";
    if (view === "resolved") return ["RESOLVED", "CLOSED"].includes(ticket.status);
    return !["RESOLVED", "CLOSED"].includes(ticket.status);
  }).sort((a, b) => {
    const priority = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as Record<string, number>;
    return (priority[a.priority] ?? 4) - (priority[b.priority] ?? 4) || b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  const counts = {
    open: tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length,
    urgent: tickets.filter((ticket) => ticket.priority === "URGENT" && !["RESOLVED", "CLOSED"].includes(ticket.status)).length,
    waiting: tickets.filter((ticket) => ticket.status === "WAITING_FOR_CLIENT").length,
    resolved: tickets.filter((ticket) => ["RESOLVED", "CLOSED"].includes(ticket.status)).length
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="product-eyebrow">Support desk</p><h1 className="mt-2 text-3xl font-semibold">Ticket queue</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Work urgent requests first, then follow the queue by last activity.</p></div>
        <span className="status-pill status-info">{counts.open} open</span>
      </div>

      <section className="mt-6 grid overflow-hidden rounded-lg border border-black/7 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {[["Open", counts.open], ["Urgent", counts.urgent], ["Waiting", counts.waiting], ["Resolved", counts.resolved]].map(([label, value], index) => <div key={label} className={`p-5 ${index ? "border-t border-black/6 sm:border-l sm:border-t-0" : ""}`}><p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">{label}</p><strong className={`mt-2 block text-2xl ${label === "Urgent" && value ? "text-[#b23a32]" : ""}`}>{value}</strong></div>)}
      </section>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-black/10" aria-label="Ticket filters">
        {filters.map((filter) => <Link key={filter.value} href={`/admin/support?view=${filter.value}`} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold ${view === filter.value ? "border-[#8a6a16] text-[#6d5310]" : "border-transparent text-[var(--text-muted)]"}`}>{filter.label}</Link>)}
      </nav>

      <section className="mt-4 overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm">
        <div className="hidden grid-cols-[1fr_170px_150px_100px_140px] gap-3 border-b border-black/7 bg-[#f8f8f6] px-5 py-3 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--text-muted)] sm:grid"><span>Request</span><span>Category</span><span>Status</span><span>Priority</span><span>Last activity</span></div>
        <div className="divide-y divide-black/6">
          {matches.length ? matches.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="grid gap-3 px-5 py-4 hover:bg-[#f8faf9] sm:grid-cols-[1fr_170px_150px_100px_140px] sm:items-center"><span><strong className="block text-sm">{ticket.subject}</strong><small className="mt-1 block text-[var(--text-muted)]">{ticket.organization.name} · {ticket.reference}</small></span><span className="text-sm text-[var(--text-muted)]">{ticket.category.replaceAll("_", " ")}</span><span><span className={`status-pill ${statusTone(ticket.status)}`}>{ticket.status.replaceAll("_", " ")}</span></span><span className={`text-xs font-bold ${ticket.priority === "URGENT" ? "text-[#b23a32]" : "text-[var(--text-muted)]"}`}>{ticket.priority}</span><span className="text-xs text-[var(--text-muted)]">{ticket.updatedAt.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}</span></Link>) : <div className="p-12 text-center"><strong className="block text-sm">No tickets in this view</strong><p className="mt-2 text-sm text-[var(--text-muted)]">Choose another filter to review the rest of the queue.</p></div>}
        </div>
      </section>
    </main>
  );
}
