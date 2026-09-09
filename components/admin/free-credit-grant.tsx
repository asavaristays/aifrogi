"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FreeCreditGrant({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [credits, setCredits] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function grant() {
    setSaving(true); setMessage("");
    const response = await fetch(`/api/admin/message-matrix/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "GRANT_FREE_CREDITS", credits, reason, expiresAt: expiresAt || null }) });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    setMessage(response.ok ? "Free credits granted and available immediately." : payload?.error || "Credits could not be granted.");
    if (response.ok) { setCredits(""); setExpiresAt(""); setReason(""); router.refresh(); }
  }

  return <section className="rounded-lg border border-[#d8c278] bg-[#fff9e8] p-5">
    <p className="field-label text-[#6d5310]">Grant free AI reply credits</p>
    <p className="mt-2 text-xs leading-5 text-[#68645c]">Super Admin approval is required. The grant is immediate, immutable and audited.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2"><input className="product-input" inputMode="numeric" placeholder="Credits" value={credits} onChange={(event) => setCredits(event.target.value)} /><input className="product-input" type="date" aria-label="Optional expiry" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div>
    <textarea className="product-input mt-2 min-h-20" placeholder="Required business reason" value={reason} onChange={(event) => setReason(event.target.value)} />
    <button disabled={saving || !credits || reason.trim().length < 5} onClick={() => void grant()} className="mt-3 rounded-full bg-[#8a6a16] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Granting…" : "Grant free credits"}</button>
    {message ? <p className="mt-3 text-xs font-semibold text-[#6d5310]">{message}</p> : null}
  </section>;
}
