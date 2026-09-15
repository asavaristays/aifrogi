"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type KnowledgeEvidence = {
  pageCount: number;
  published: number;
  coveragePercent: number;
  freshnessRate: number;
  conflicts: number;
  unsigned: number;
  openFlags: number;
  previewPending: number;
  missingEssentials: string[];
};

const emptyEvidence: KnowledgeEvidence = { pageCount: 0, published: 0, coveragePercent: 0, freshnessRate: 0, conflicts: 0, unsigned: 0, openFlags: 0, previewPending: 0, missingEssentials: [] };

export function BotReviewSubmission({ status, ready, tested, certified, canManage, evidence = emptyEvidence }: { status: string; ready: boolean; tested: boolean; certified: boolean; canManage: boolean; evidence?: KnowledgeEvidence }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const pending = status === "REVIEW_PENDING";
  const live = status === "LIVE";
  const blockers = [
    evidence.pageCount === 0 ? "Connect and crawl the business website" : null,
    evidence.published === 0 ? "Review and publish business answers" : null,
    evidence.missingEssentials.length ? `Complete: ${evidence.missingEssentials.join(", ")}` : null,
    evidence.conflicts ? `Resolve ${evidence.conflicts} conflicting fact${evidence.conflicts === 1 ? "" : "s"}` : null,
    evidence.unsigned ? `Approve ${evidence.unsigned} unverified field${evidence.unsigned === 1 ? "" : "s"}` : null,
    evidence.openFlags ? `Resolve ${evidence.openFlags} reported answer${evidence.openFlags === 1 ? "" : "s"}` : null,
    evidence.previewPending ? `Review ${evidence.previewPending} answer preview${evidence.previewPending === 1 ? "" : "s"}` : null,
    !ready && !evidence.missingEssentials.length && !evidence.conflicts && !evidence.unsigned && !evidence.openFlags && !evidence.previewPending ? "Reach the required knowledge coverage and freshness" : null,
    !tested ? "Test a real customer question" : null,
    !certified ? "Run and pass the tenant question bank" : null
  ].filter(Boolean) as string[];
  const demoReady = ready && tested && certified && blockers.length === 0;

  async function submit() {
    setSaving(true); setMessage("");
    const response = await fetch("/api/onboarding/bot-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "SUBMIT_FOR_REVIEW" }) });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Submitted successfully. AiFrogi Super Admin will review your bot and email you after approval." : payload?.error || "Bot could not be submitted for review.");
    if (response.ok) router.refresh();
  }

  return <section className={`rounded-2xl border p-5 sm:p-6 ${pending ? "border-[#d7c27d] bg-[#fff9e8]" : live ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-white"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="product-eyebrow">Client demonstration gate</p><h2 className="mt-1 text-xl font-semibold">{live ? "Your bot is live" : pending ? "Submitted · awaiting AiFrogi review" : demoReady ? "Demo ready · submit for review" : "Not ready for a client demonstration"}</h2></div><span className={`status-pill ${demoReady || live ? "status-success" : pending ? "status-warning" : "status-error"}`}>{live ? "Live" : pending ? "Under review" : demoReady ? "Demo ready" : `${blockers.length} action${blockers.length === 1 ? "" : "s"} remaining`}</span></div>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{live ? "Super Admin approved the bot and your live confirmation email was issued." : pending ? "No further action is required now. You will receive an email after approval or a clear correction request." : "This gate checks source coverage, reviewed facts, answer testing and the tenant question bank. Do not present the bot to a client until it says Demo ready."}</p>
    <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {[['Website pages', evidence.pageCount, evidence.pageCount > 0], ['Published answers', evidence.published, evidence.published > 0], ['Topic coverage', `${evidence.coveragePercent}%`, ready], ['Knowledge freshness', `${evidence.freshnessRate}%`, evidence.freshnessRate >= 95], ['Conflicting facts', evidence.conflicts, evidence.conflicts === 0], ['Pending approvals', evidence.unsigned + evidence.previewPending, evidence.unsigned + evidence.previewPending === 0], ['Customer test', tested ? 'Completed' : 'Required', tested], ['Question bank', certified ? 'Passed' : 'Required', certified]].map(([label, value, ok]) => <div key={String(label)} className="rounded-xl border border-[var(--border)] bg-white/70 p-3"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className={`mt-1 text-sm font-bold ${ok ? "text-[#126452]" : "text-[#a23b32]"}`}>{String(value)}</p></div>)}
    </div>
    {!pending && !live && canManage ? <button type="button" disabled={saving || !demoReady} onClick={submit} className="mt-4 min-h-11 rounded-full bg-[#8a6a16] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Submitting…" : "Approve and submit for review"}</button> : null}
    {!pending && !live && blockers.length ? <div className="mt-4 rounded-xl border border-[#ead9a5] bg-[#fffaf0] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#8a5d12]">Remaining before submission</p><ul className="mt-2 space-y-1">{blockers.map((blocker) => <li key={blocker} className="text-sm text-[#6b571e]">• {blocker}</li>)}</ul></div> : null}
    {message ? <p role="status" className="mt-3 text-sm font-semibold">{message}</p> : null}
  </section>;
}
