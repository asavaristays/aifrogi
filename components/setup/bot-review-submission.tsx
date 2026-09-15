"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BotReviewSubmission({ status, ready, tested, certified, canManage }: { status: string; ready: boolean; tested: boolean; certified: boolean; canManage: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const pending = status === "REVIEW_PENDING";
  const live = status === "LIVE";
  const blockers = [!ready ? "Approve the required business knowledge" : null, !tested ? "Test at least one customer question" : null, !certified ? "Run and pass the current tenant certification" : null].filter(Boolean) as string[];

  async function submit() {
    setSaving(true); setMessage("");
    const response = await fetch("/api/onboarding/bot-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "SUBMIT_FOR_REVIEW" }) });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Submitted successfully. AiFrogi Super Admin will review your bot and email you after approval." : payload?.error || "Bot could not be submitted for review.");
    if (response.ok) router.refresh();
  }

  return <section className={`rounded-2xl border p-5 sm:p-6 ${pending ? "border-[#d7c27d] bg-[#fff9e8]" : live ? "border-emerald-200 bg-emerald-50" : "border-[var(--border)] bg-white"}`}>
    <p className="product-eyebrow">Final client approval</p>
    <h2 className="mt-1 text-xl font-semibold">{live ? "Your bot is live" : pending ? "Submitted · awaiting AiFrogi review" : "Submit your bot for review"}</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">{live ? "Super Admin approved the bot and your live confirmation email was issued." : pending ? "No further action is required now. You will receive an email after approval or a clear correction request." : "Submit only after approving the required intelligence and testing a customer question. Submission does not make the bot public; Super Admin approval is mandatory."}</p>
    {!pending && !live && canManage ? <button type="button" disabled={saving || !ready || !tested || !certified} onClick={submit} className="mt-4 min-h-11 rounded-full bg-[#8a6a16] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{saving ? "Submitting…" : "Approve and submit for review"}</button> : null}
    {!pending && !live && blockers.length ? <div className="mt-4 rounded-xl border border-[#ead9a5] bg-[#fffaf0] p-4"><p className="text-xs font-black uppercase tracking-wide text-[#8a5d12]">Remaining before submission</p><ul className="mt-2 space-y-1">{blockers.map((blocker) => <li key={blocker} className="text-sm text-[#6b571e]">• {blocker}</li>)}</ul></div> : null}
    {message ? <p role="status" className="mt-3 text-sm font-semibold">{message}</p> : null}
  </section>;
}
