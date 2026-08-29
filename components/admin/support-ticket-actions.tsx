"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SupportTicketActions({ ticketId, initialStatus }: { ticketId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [resolution, setResolution] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  async function update(payload: Record<string, unknown>) { setSaving(true); setError(""); setNotice(""); const response = await fetch("/api/support/tickets", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticketId, ...payload }) }); const data = await response.json().catch(() => null); setSaving(false); if (!response.ok) { setError(data?.error || "Update failed"); return; } setStatus(data.ticket.status); setMessage(""); setNotice("Support request updated."); window.location.reload(); }
  return <section className="rounded-lg border border-black/7 bg-white p-6 shadow-sm"><p className="product-eyebrow">Operator action</p><h2 className="mt-2 text-xl font-semibold">Reply or resolve</h2><div className="mt-5 grid gap-4"><label><span className="field-label">Reply to customer</span><textarea className="product-input mt-2 min-h-28" value={message} onChange={(event) => setMessage(event.target.value)} /></label><Button disabled={saving || !message.trim()} onClick={() => update({ message })}>Send reply</Button><div className="border-t border-black/6 pt-4"><label><span className="field-label">Status</span><select className="product-input mt-2" value={status} onChange={(event) => setStatus(event.target.value)}><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="WAITING_FOR_CUSTOMER">Waiting for customer</option><option value="RESOLVED">Resolved</option><option value="CLOSED">Closed</option></select></label><label className="mt-4 block"><span className="field-label">Resolution note</span><textarea className="product-input mt-2 min-h-24" value={resolution} onChange={(event) => setResolution(event.target.value)} /></label><Button tone="surface" className="mt-4" disabled={saving} onClick={() => update({ status, resolution })}>Update status</Button></div></div>{notice ? <p className="mt-4 text-sm font-semibold text-[#6d5310]">{notice}</p> : null}{error ? <p className="mt-4 text-sm font-semibold text-[#b23a32]">{error}</p> : null}</section>;
}
