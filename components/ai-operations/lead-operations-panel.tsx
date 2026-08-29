"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Operation = {
  id: string;
  kind: string;
  status: string;
  title: string;
  assignedTo: string | null;
  dueAt: string | null;
  outcomeType: string | null;
  outcomeEvidence: string | null;
};

const kinds = ["FOLLOW_UP", "HUMAN_REVIEW", "APPOINTMENT", "QUOTE", "ORDER", "ESCALATION", "NOTE"];
const outcomes = ["QUALIFIED", "APPOINTMENT_CONFIRMED", "QUOTE_SENT", "ORDER_CREATED", "WON", "LOST", "ESCALATED", "RESOLVED"];

function label(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/^./, (character) => character.toUpperCase());
}

export function LeadOperationsPanel({ leadId }: { leadId: string }) {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("FOLLOW_UP");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!leadId) return;
    const response = await fetch(`/api/ai-operations/${leadId}`, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (response.ok) setOperations(payload?.operations || []);
  }, [leadId]);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    if (!title.trim()) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/ai-operations/${leadId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind, assignedTo, dueAt: dueAt || undefined })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { setError(payload?.error || "Could not create action."); return; }
    setTitle(""); setDueAt(""); await load();
  }

  async function complete(operation: Operation, outcomeType: string) {
    const evidence = window.prompt("Verification evidence or result note (required)", operation.outcomeEvidence || "");
    if (!evidence?.trim()) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/ai-operations/${leadId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operationId: operation.id, status: "COMPLETED", outcomeType, outcomeEvidence: evidence })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) { setError(payload?.error || "Could not record outcome."); return; }
    await load();
  }

  return <section className="rounded-lg border border-[var(--border)] bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-sm font-semibold text-[var(--text)]">Actions & verified outcomes</p><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Durable work owned by this business.</p></div>
      <span className="status-pill status-info">{operations.filter((item) => item.status !== "COMPLETED").length} open</span>
    </div>
    <div className="mt-4 grid gap-2">
      <input className="product-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Next action, e.g. review requirements" maxLength={180} />
      <div className="grid grid-cols-2 gap-2">
        <select className="product-input" value={kind} onChange={(event) => setKind(event.target.value)}>{kinds.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select>
        <input className="product-input" type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} />
      </div>
      <input className="product-input" type="email" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="Assign to email (optional)" />
      <Button disabled={saving || !title.trim()} onClick={() => void create()}>{saving ? "Saving…" : "Add action"}</Button>
    </div>
    {error ? <p className="mt-3 text-xs font-semibold text-[var(--error)]">{error}</p> : null}
    <div className="mt-4 space-y-2">
      {operations.slice(0, 8).map((operation) => <article key={operation.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-soft)] p-3">
        <div className="flex items-start justify-between gap-3"><div><strong className="text-sm">{operation.title}</strong><p className="mt-1 text-[11px] text-[var(--text-muted)]">{label(operation.kind)}{operation.assignedTo ? ` · ${operation.assignedTo}` : ""}{operation.dueAt ? ` · ${new Date(operation.dueAt).toLocaleString("en-IN")}` : ""}</p></div><span className={`status-pill ${operation.status === "COMPLETED" ? "status-success" : "status-warning"}`}>{label(operation.status)}</span></div>
        {operation.outcomeType ? <p className="mt-2 text-xs font-semibold text-[#16794a]">Outcome: {label(operation.outcomeType)}</p> : null}
        {operation.status !== "COMPLETED" ? <select aria-label={`Complete ${operation.title}`} className="product-input mt-3" defaultValue="" disabled={saving} onChange={(event) => event.target.value && void complete(operation, event.target.value)}><option value="">Record verified outcome…</option>{outcomes.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select> : null}
      </article>)}
      {!operations.length ? <p className="rounded-md border border-dashed border-[var(--border)] p-4 text-center text-xs text-[var(--text-muted)]">No action has been recorded for this conversation.</p> : null}
    </div>
  </section>;
}
