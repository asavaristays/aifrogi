import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportTicketActions } from "@/components/admin/support-ticket-actions";
import { getCurrentUser } from "@/lib/auth-server";
import { getSupportTicket } from "@/lib/repositories/support-repository";
import { logSupportDataAccess } from "@/lib/support-access";
import { supportSlaState } from "@/lib/support-policy";

export const dynamic = "force-dynamic";
export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const ticket = await getSupportTicket(id); if (!ticket) notFound();
  const sla = supportSlaState(ticket);
  if (user) await logSupportDataAccess({ organizationId: ticket.organizationId, actorEmail: user.username, scope: "CONVERSATIONS", targetType: "SUPPORT_TICKET", targetId: ticket.id, granted: true, summary: "Support viewed content explicitly submitted in this ticket; other client data remains access-controlled." });
  return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8"><Link href="/admin/support" className="text-sm font-bold text-[#6d5310]">← Support queue</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="product-eyebrow">{ticket.reference}</p><h1 className="mt-2 text-3xl font-semibold">{ticket.subject}</h1><p className="mt-2 text-sm text-[var(--text-muted)]">{ticket.organization.name} · {ticket.category.replaceAll("_", " ")} · {ticket.priority}</p><p className={`mt-2 text-xs font-bold ${sla.resolutionOverdue ? "text-[#b23a32]" : "text-[var(--text-muted)]"}`}>Resolution target: {sla.resolveDueAt.toLocaleString("en-IN")} {sla.resolutionOverdue ? "· OVERDUE" : ""}</p></div><span className="status-pill status-info">{ticket.status.replaceAll("_", " ")}</span></div><div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-lg border border-black/7 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Ticket conversation</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Customer-submitted ticket content is available for resolution. Every access and reply is audited.</p></div><span className="status-pill status-success">Audited</span></div><div className="mt-5 space-y-4">{ticket.messages.map((message) => <div key={message.id} className={`rounded-md p-4 ${message.authorRole === "ADMIN" ? "bg-[#eaf5f0]" : "bg-[#f5f7f6]"}`}><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{message.authorRole === "ADMIN" ? "AiFrogi Support" : message.authorEmail}</p></div>)}{ticket.resolution ? <div className="rounded-md border border-[#b9dfcf] bg-[#edf9f3] p-4"><strong className="text-sm">Resolution record</strong><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{ticket.resolution}</p></div> : null}</div></section><SupportTicketActions ticketId={ticket.id} initialStatus={ticket.status}/></div></main>;
}
