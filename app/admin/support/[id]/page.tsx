import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportTicketActions } from "@/components/admin/support-ticket-actions";
import { getSupportTicket } from "@/lib/repositories/support-repository";

export const dynamic = "force-dynamic";

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ticket = await getSupportTicket(id); if (!ticket) notFound();
  return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8"><Link href="/admin/support" className="text-sm font-bold text-[#b923ae]">← Support queue</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="product-eyebrow">{ticket.reference}</p><h1 className="mt-2 text-3xl font-semibold">{ticket.subject}</h1><p className="mt-2 text-sm text-[var(--text-muted)]">{ticket.organization.name} · {ticket.category.replaceAll("_", " ")} · {ticket.priority}</p></div><span className="status-pill status-info">{ticket.status.replaceAll("_", " ")}</span></div><div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-lg border border-black/7 bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Conversation</h2><div className="mt-5 space-y-4">{ticket.messages.map((message) => <div key={message.id} className={`rounded-md p-4 ${message.authorRole === "ADMIN" ? "bg-[#eaf5f0]" : "bg-[#f5f7f6]"}`}><p className="text-sm leading-6">{message.body}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{message.authorRole === "ADMIN" ? "AiFrogi Support" : message.authorEmail}</p></div>)}</div></section><SupportTicketActions ticketId={ticket.id} initialStatus={ticket.status}/></div></main>;
}
