import Link from "next/link";
import { notFound } from "next/navigation";
import { SupportTicketActions } from "@/components/admin/support-ticket-actions";
import { getCurrentUser } from "@/lib/auth-server";
import { getSupportTicket } from "@/lib/repositories/support-repository";
import { hasActiveSupportAccess, logSupportDataAccess } from "@/lib/support-access";

export const dynamic = "force-dynamic";

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const ticket = await getSupportTicket(id);
  if (!ticket) notFound();
  const canReadConversation = await hasActiveSupportAccess(ticket.organizationId, "CONVERSATIONS");
  if (user) {
    await logSupportDataAccess({
      organizationId: ticket.organizationId,
      actorEmail: user.username,
      scope: "CONVERSATIONS",
      targetType: "SUPPORT_TICKET",
      targetId: ticket.id,
      granted: canReadConversation,
      summary: canReadConversation ? "Support viewed a customer support conversation." : "Support conversation view blocked because customer access was not granted."
    });
  }
  return <main className="mx-auto max-w-6xl px-4 py-7 sm:px-8"><Link href="/admin/support" className="text-sm font-bold text-[#6d5310]">← Support queue</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="product-eyebrow">{ticket.reference}</p><h1 className="mt-2 text-3xl font-semibold">{ticket.subject}</h1><p className="mt-2 text-sm text-[var(--text-muted)]">{ticket.organization.name} · {ticket.category.replaceAll("_", " ")} · {ticket.priority}</p></div><span className="status-pill status-info">{ticket.status.replaceAll("_", " ")}</span></div><div className="mt-7 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-lg border border-black/7 bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-semibold">Conversation</h2><p className="mt-2 text-sm text-[var(--text-muted)]">{canReadConversation ? "Customer has granted temporary support access. This view is logged." : "Customer conversation is locked until the customer grants support access."}</p></div><span className={`status-pill ${canReadConversation ? "status-warning" : "status-success"}`}>{canReadConversation ? "Access granted" : "Locked"}</span></div><div className="mt-5 space-y-4">{canReadConversation ? ticket.messages.map((message) => <div key={message.id} className={`rounded-md p-4 ${message.authorRole === "ADMIN" ? "bg-[#eaf5f0]" : "bg-[#f5f7f6]"}`}><p className="text-sm leading-6">{message.body}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{message.authorRole === "ADMIN" ? "AiFrogi Support" : message.authorEmail}</p></div>) : <div className="rounded-md border border-dashed border-black/12 bg-[#fbfaf7] p-5 text-sm leading-6 text-[var(--text-muted)]">Message bodies are hidden. Ask the customer to open Support → Customer-controlled access and grant “Support conversations” for a limited time.</div>}</div></section><SupportTicketActions ticketId={ticket.id} initialStatus={ticket.status}/></div></main>;
}
