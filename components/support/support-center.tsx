"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type Ticket = {
  id: string;
  reference: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  description: string;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
  sla?: { acknowledgeDueAt: string; resolveDueAt: string; acknowledgmentOverdue: boolean; resolutionOverdue: boolean };
  messages: Array<{ id: string; authorEmail: string; authorRole: string; body: string; createdAt: string }>;
};

const resources = [
  { title: "Install the AI Bot", helper: "Widget, iframe and standalone link guidance", href: "/help/install-ai-bot" },
  { title: "Improve bot knowledge", helper: "Approved sources, preview approval and answer verification", href: "/help/govern-ai-answers" },
  { title: "Check a connector", helper: "Calendar, Sheets, commerce and business-action readiness", href: "/integrations" }
];

export function SupportCenter({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("ONBOARDING");
  const [priority, setPriority] = useState("NORMAL");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [replies, setReplies] = useState<Record<string, string>>({});
  const openCount = useMemo(() => tickets.filter((ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status)).length, [tickets]);

  async function createTicket() {
    setError("");
    setNotice("");
    if (!subject.trim() || !description.trim()) {
      setError("Add a short subject and explain what is blocking you.");
      return;
    }
    setSaving(true);
    const response = await fetch("/api/support/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, description, category, priority })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "We could not create the ticket. Please retry.");
      return;
    }
    setTickets((current) => [payload.ticket, ...current]);
    setSubject("");
    setDescription("");
    setNotice(`${payload.ticket.reference} was created. Support can now see your onboarding and integration context.`);
  }

  async function updateTicket(ticketId: string, body: Record<string, unknown>) {
    setSaving(true); setError(""); setNotice("");
    const response = await fetch("/api/support/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId, ...body }) });
    const payload = await response.json().catch(() => null); setSaving(false);
    if (!response.ok) { setError(payload?.error || "We could not update the ticket."); return; }
    setTickets((current) => current.map((ticket) => ticket.id === ticketId ? payload.ticket : ticket));
    setReplies((current) => ({ ...current, [ticketId]: "" })); setNotice(`${payload.ticket.reference} was updated.`);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-6">
        <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="product-eyebrow">Resolve it faster</p>
              <h2 className="mt-2 text-xl font-bold">Start with the relevant guide</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">Each guide takes you to the exact screen where the issue can be checked.</p>
            </div>
            <span className="status-pill status-info">{openCount} open</span>
          </div>
          <div className="mt-5 divide-y divide-black/6 border-y border-black/6">
            {resources.map((resource) => (
              <a key={resource.title} href={resource.href} className="group flex items-center justify-between gap-4 py-4">
                <span>
                  <strong className="block text-sm">{resource.title}</strong>
                  <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{resource.helper}</span>
                </span>
                <span className="text-lg text-[#6d5310] transition-transform group-hover:translate-x-1">→</span>
              </a>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
          <p className="product-eyebrow">My requests</p>
          <h2 className="mt-2 text-xl font-bold">Support history</h2>
          <div className="mt-5 space-y-3">
            {tickets.length ? tickets.map((ticket) => (
              <details key={ticket.id} className="rounded-lg border border-black/7 bg-[#fbfcfc] p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span><strong className="block text-sm">{ticket.subject}</strong><small className="mt-1 block text-[var(--text-muted)]">{ticket.reference} · {ticket.category.replaceAll("_", " ")}</small></span>
                    <span className={`status-pill ${["RESOLVED", "CLOSED"].includes(ticket.status) ? "status-success" : ticket.status === "WAITING_FOR_CLIENT" ? "status-warning" : "status-info"}`}>{ticket.status.replaceAll("_", " ")}</span>
                  </div>
                </summary>
                <div className="mt-4 space-y-3 border-t border-black/6 pt-4">
                  {ticket.messages.map((message) => (
                    <div key={message.id} className="rounded-md bg-white p-3 text-sm leading-6">
                      <p>{message.body}</p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">{message.authorRole === "ADMIN" ? "AiFrogi Support" : "You"}</p>
                    </div>
                  ))}
                  {ticket.resolution ? <div className="rounded-md border border-[#b9dfcf] bg-[#edf9f3] p-4"><strong className="text-sm">Resolution</strong><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{ticket.resolution}</p></div> : null}
                  {ticket.sla?.resolutionOverdue ? <p className="text-xs font-bold text-[#a8322d]">Resolution SLA requires attention.</p> : <p className="text-xs text-[var(--text-muted)]">Target resolution: {new Date(ticket.sla?.resolveDueAt || ticket.updatedAt).toLocaleString()}</p>}
                  <label><span className="field-label">Reply</span><textarea className="product-input mt-2 min-h-24" value={replies[ticket.id] || ""} onChange={(event) => setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Add new information or evidence ID. Never send credentials." /></label>
                  <div className="flex flex-wrap gap-2"><Button disabled={saving || !(replies[ticket.id] || "").trim()} onClick={() => updateTicket(ticket.id, { message: replies[ticket.id] })}>Send reply</Button>{ticket.status === "RESOLVED" ? <Button tone="surface" disabled={saving} onClick={() => updateTicket(ticket.id, { action: "CONFIRM_RESOLUTION" })}>Confirm and close</Button> : null}{ticket.status === "CLOSED" ? <Button tone="surface" disabled={saving} onClick={() => updateTicket(ticket.id, { action: "REOPEN" })}>Reopen</Button> : null}</div>
                </div>
              </details>
            )) : <p className="rounded-lg border border-dashed border-black/10 p-5 text-sm text-[var(--text-muted)]">No support requests yet.</p>}
          </div>
        </section>
      </div>

      <section className="h-fit rounded-lg border border-black/6 bg-white p-6 shadow-sm xl:sticky xl:top-24">
        <p className="product-eyebrow">Still blocked?</p>
        <h2 className="mt-2 text-xl font-bold">Create a support request</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">AiFrogi attaches your organization and connection context automatically. Never paste passwords, tokens, or OTPs.</p>
        <div className="mt-5 grid gap-4">
          <label><span className="field-label">Category</span><select className="product-input mt-2" value={category} onChange={(event) => setCategory(event.target.value)}><option value="AI_BOT">AI Bot answer or behaviour</option><option value="KNOWLEDGE">Knowledge and content</option><option value="CONNECTOR">Connector or action</option><option value="ONBOARDING">Onboarding and installation</option><option value="BILLING">Billing and plan</option><option value="ACCOUNT">Account access</option><option value="WHATSAPP">Optional WhatsApp channel</option><option value="OTHER">Other</option></select></label>
          <label><span className="field-label">Priority</span><select className="product-input mt-2" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="NORMAL">Normal · response within 8 hours</option><option value="HIGH">High · business journey blocked</option><option value="URGENT">Urgent · live bot stopped or unsafe</option><option value="LOW">Low · question or improvement</option></select></label>
          <label><span className="field-label">Subject</span><input className="product-input mt-2" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Example: Marketing template failed" /></label>
          <label><span className="field-label">What happened?</span><textarea className="product-input mt-2 min-h-32 resize-y" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What were you doing, what did you expect, and what did AiFrogi show?" /></label>
        </div>
        {error ? <p className="mt-4 rounded-md bg-[#fff2f0] px-4 py-3 text-sm font-semibold text-[#a8322d]">{error}</p> : null}
        {notice ? <p className="mt-4 rounded-md bg-[#edf9f3] px-4 py-3 text-sm font-semibold text-[#146b58]">{notice}</p> : null}
        <Button className="mt-5" onClick={createTicket} disabled={saving}>{saving ? "Creating request" : "Create request"}</Button>
      </section>
    </div>
  );
}
