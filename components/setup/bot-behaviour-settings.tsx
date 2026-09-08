"use client";

import { useState } from "react";

type Profile = {
  businessObjective?: string | null;
  tone?: string | null;
  languages?: string[];
  prohibitedClaims?: string[];
  escalationTriggers?: string[];
  fallbackEnabled?: boolean;
  safeFallbackMessage?: string | null;
};

export function BotBehaviourSettings({ initialProfile, canManage }: { initialProfile: Profile; canManage: boolean }) {
  const [businessObjective, setBusinessObjective] = useState(initialProfile.businessObjective || "Answer approved business questions and help customers take the next safe step.");
  const [tone, setTone] = useState(initialProfile.tone || "Professional, clear and helpful");
  const [languages, setLanguages] = useState((initialProfile.languages?.length ? initialProfile.languages : ["English"]).join(", "));
  const [prohibitedClaims, setProhibitedClaims] = useState((initialProfile.prohibitedClaims || []).join("\n"));
  const [escalationTriggers, setEscalationTriggers] = useState((initialProfile.escalationTriggers || []).join("\n"));
  const [fallbackEnabled, setFallbackEnabled] = useState(initialProfile.fallbackEnabled === true);
  const [safeFallbackMessage, setSafeFallbackMessage] = useState(initialProfile.safeFallbackMessage || "Thank you. I do not have enough approved information to confirm that, so I will leave this for the business team to review.");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    setSaving(true); setNotice(null);
    try {
      const response = await fetch("/api/onboarding/bot-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessObjective,
          tone,
          languages: languages.split(",").map((item) => item.trim()).filter(Boolean),
          prohibitedClaims: prohibitedClaims.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          escalationTriggers: escalationTriggers.split(/\r?\n/).map((item) => item.trim()).filter(Boolean),
          fallbackEnabled,
          safeFallbackMessage
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "Could not save bot behaviour.");
      setNotice("Bot behaviour saved. New conversations will use these instructions.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save bot behaviour.");
    } finally { setSaving(false); }
  }

  const canSave = canManage && businessObjective.trim().length > 0 && tone.trim().length > 0 && languages.trim().length > 0 && (!fallbackEnabled || safeFallbackMessage.trim().length >= 20);

  return <section id="bot-behaviour" className="scroll-mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <div><p className="product-eyebrow">Setup · persona intelligence</p><h2 className="mt-1 text-xl font-semibold">Guide how your bot behaves</h2><p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">Set communication style and safety boundaries here. Approved facts, prices and service information remain in Intelligence.</p></div>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <label className="lg:col-span-2"><span className="field-label">Bot purpose</span><textarea className="product-input mt-2 min-h-24 resize-y" maxLength={1000} disabled={!canManage} value={businessObjective} onChange={(event) => setBusinessObjective(event.target.value)} /><small className="mt-2 block text-xs text-[var(--text-muted)]">Describe what the bot should help customers achieve.</small></label>
      <label><span className="field-label">Tone and response style</span><input className="product-input mt-2" maxLength={160} disabled={!canManage} value={tone} onChange={(event) => setTone(event.target.value)} placeholder="Professional, clear and helpful" /></label>
      <label><span className="field-label">Languages</span><input className="product-input mt-2" disabled={!canManage} value={languages} onChange={(event) => setLanguages(event.target.value)} placeholder="English, Hindi" /><small className="mt-2 block text-xs text-[var(--text-muted)]">Separate languages with commas.</small></label>
      <label><span className="field-label">Never claim</span><textarea className="product-input mt-2 min-h-32 resize-y" disabled={!canManage} value={prohibitedClaims} onChange={(event) => setProhibitedClaims(event.target.value)} placeholder="Do not invent prices or guarantees" /><small className="mt-2 block text-xs text-[var(--text-muted)]">One safety boundary per line.</small></label>
      <label><span className="field-label">Ask a human when</span><textarea className="product-input mt-2 min-h-32 resize-y" disabled={!canManage} value={escalationTriggers} onChange={(event) => setEscalationTriggers(event.target.value)} placeholder="Complaint&#10;Billing question&#10;Low-confidence answer" /><small className="mt-2 block text-xs text-[var(--text-muted)]">One escalation topic per line.</small></label>
      <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[#fbfaf7] p-4"><label className="flex items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={fallbackEnabled} disabled={!canManage} onChange={(event) => setFallbackEnabled(event.target.checked)} className="size-4 accent-[#8a6a16]" />Use an approved fallback when the bot cannot answer safely</label>{fallbackEnabled ? <textarea className="product-input mt-3 min-h-20 resize-y" maxLength={600} disabled={!canManage} value={safeFallbackMessage} onChange={(event) => setSafeFallbackMessage(event.target.value)} /> : null}</div>
      <div className="lg:col-span-2 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-[var(--text-muted)]">Knowledge approval still controls which business facts the bot may use.</p><button type="button" disabled={!canSave || saving} onClick={save} className="min-h-11 rounded-full bg-[#101010] px-5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save bot behaviour"}</button></div>
      {notice ? <p role="status" className="lg:col-span-2 rounded-lg bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</p> : null}
    </div>
  </section>;
}
