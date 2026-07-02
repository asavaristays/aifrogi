import Link from "next/link";
import { listSupportTickets } from "@/lib/repositories/support-repository";

export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  const tickets = await listSupportTickets({});
  const open = tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status));
  return <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8"><div className="flex items-end justify-between gap-4"><div><p className="product-eyebrow">Support operations</p><h1 className="mt-2 text-3xl font-semibold">Customer requests</h1><p className="mt-2 text-sm text-[var(--text-muted)]">Prioritized by service impact, with customer setup context attached.</p></div><span className="status-pill status-info">{open.length} open</span></div><div className="mt-7 overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm"><div className="divide-y divide-black/6">{tickets.length ? tickets.map((ticket) => <Link key={ticket.id} href={`/admin/support/${ticket.id}`} className="grid gap-3 px-5 py-4 hover:bg-[#f8faf9] sm:grid-cols-[1fr_180px_130px_90px] sm:items-center"><span><strong className="block text-sm">{ticket.subject}</strong><small className="mt-1 block text-[var(--text-muted)]">{ticket.organization.name} · {ticket.reference}</small></span><span className="text-sm text-[var(--text-muted)]">{ticket.category.replaceAll("_", " ")}</span><span className={`status-pill ${ticket.status === "RESOLVED" ? "status-success" : ticket.status === "WAITING_FOR_CUSTOMER" ? "status-warning" : "status-info"}`}>{ticket.status.replaceAll("_", " ")}</span><span className={`text-xs font-bold ${ticket.priority === "URGENT" ? "text-[#b23a32]" : "text-[var(--text-muted)]"}`}>{ticket.priority}</span></Link>) : <p className="p-10 text-center text-sm text-[var(--text-muted)]">No support requests.</p>}</div></div></main>;
}
