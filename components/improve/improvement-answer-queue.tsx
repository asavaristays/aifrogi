"use client";

import { useState } from "react";

export type ImprovementItem = {
  id: string;
  sourceType: "FEEDBACK" | "GAP";
  question: string;
  botAnswer?: string | null;
  detail: string;
  badge: string;
  context?: string[];
  entryId?: string | null;
  savedAnswer?: string | null;
  category?: string | null;
};

export function ImprovementAnswerQueue({ items }: { items: ImprovementItem[] }) {
  const [visible, setVisible] = useState(items);
  return <div className="divide-y divide-[var(--border)]">{visible.map((item) => <ImprovementEditor key={`${item.sourceType}:${item.id}`} item={item} onRemove={() => setVisible((current) => current.filter((candidate) => candidate !== item))} />)}</div>;
}

function ImprovementEditor({ item, onRemove }: { item: ImprovementItem; onRemove: () => void }) {
  const [answer, setAnswer] = useState(item.savedAnswer || "");
  const [category, setCategory] = useState(item.category || "General");
  const [entryId, setEntryId] = useState(item.entryId || null);
  const [editing, setEditing] = useState(!item.savedAnswer);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    setSaving(true); setNotice(null);
    try {
      const response = await fetch("/api/improve/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceType: item.sourceType, sourceId: item.id, question: item.question, answer, category }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save this answer.");
      setEntryId(payload.result.entryId); setEditing(false); setNotice("Saved, approved and available to your bot.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this answer."); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!window.confirm(entryId ? "Remove this answer from bot use and this improvement list? Audit history will be retained." : "Remove this item from the improvement list?")) return;
    setSaving(true); setNotice(null);
    try {
      const response = await fetch("/api/improve/answers", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceType: item.sourceType, sourceId: item.id, entryId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not remove this item.");
      onRemove();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not remove this item."); setSaving(false); }
  }

  return <details className="group px-6 py-5" open={false}>
    <summary className="flex cursor-pointer list-none items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.question}</strong><span className={`status-pill ${entryId ? "status-success" : "status-warning"}`}>{entryId ? "Answered" : item.badge}</span></div><p className="mt-2 text-xs font-medium text-[#6d5310]">{item.detail}</p></div><span className="text-[var(--primary-strong)] transition group-open:rotate-90">→</span></summary>
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
      {item.context?.length ? <div className="mb-3"><span className="field-label">Conversation context</span>{item.context.map((turn, index) => <p key={index} className="mt-1 text-xs text-[var(--text-muted)]">{turn}</p>)}</div> : null}
      {item.botAnswer ? <div className="mb-4"><span className="field-label">Bot answered</span><p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{item.botAnswer}</p></div> : null}
      {editing ? <><label className="block"><span className="field-label">Correct answer</span><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} className="product-input mt-2 min-h-28 resize-y" placeholder="Enter the answer your bot should give." /></label><label className="mt-3 block"><span className="field-label">Topic</span><input value={category} onChange={(event) => setCategory(event.target.value)} className="product-input mt-2" /></label></> : <div><span className="field-label">Approved answer</span><p className="mt-2 text-sm leading-6">{answer}</p></div>}
      {notice ? <p role="status" className={`mt-3 text-xs font-semibold ${notice.startsWith("Saved") ? "text-[var(--success)]" : "text-[var(--error)]"}`}>{notice}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">{editing ? <button type="button" disabled={saving || answer.trim().length < 8} onClick={save} className="min-h-10 rounded-full bg-[#0c7658] px-5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving..." : "Save and approve"}</button> : <button type="button" onClick={() => setEditing(true)} className="min-h-10 rounded-full border border-[var(--border)] bg-white px-5 text-xs font-bold">Edit</button>}<button type="button" disabled={saving} onClick={remove} className="min-h-10 px-2 text-xs font-bold text-[var(--error)] disabled:opacity-50">Delete</button></div>
    </div>
  </details>;
}
