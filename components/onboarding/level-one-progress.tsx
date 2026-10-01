"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Preparation = { stage: string; status: string; botLive: boolean; previewReady?: boolean; propertySlug?: string; totalChecks: number; canRetry: boolean; durationMs?: number; slaMs?: number; slaMet?: boolean; blockers?: string[]; manifest?: { pages: number; topics: Array<{ name: string; present: boolean }> }; rows: Array<{ id: string; question: string; answer: string; passed: boolean; issues: string[]; latencyMs: number }> };
const labels: Record<string, string> = { QUEUED: "Your branded bot preview is queued", CRAWLING: "Reading your approved website", TESTING: "Checking the first answers", READY: "Your branded bot preview is ready", NEEDS_ATTENTION: "Your preview needs a little more information" };

export function LevelOneProgress() {
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [error, setError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/onboarding/intelligence", { cache: "no-store", signal });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load preparation progress.");
      setPreparation(payload.preparation); setError("");
    } catch (reason) { if (!signal?.aborted) setError(reason instanceof Error ? reason.message : "Progress is temporarily unavailable."); }
  }, []);
  const terminal = preparation && ["SUCCEEDED", "DEAD", "CANCELED"].includes(preparation.status);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    if (terminal) return () => controller.abort();
    const timer = setInterval(() => { if (!document.hidden) void load(controller.signal); }, 10000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [load, terminal]);
  async function retry() {
    setRetrying(true); setError("");
    try {
      const response = await fetch("/api/onboarding/intelligence", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not restart preparation.");
      setPreparation(payload.preparation);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not restart preparation."); }
    finally { setRetrying(false); }
  }
  if (!preparation && !error) return null;
  return <section className="mb-6 rounded-lg border border-[var(--border)] bg-white p-6" aria-label="Branded bot preview preparation">
    <p className="product-eyebrow">Your website assistant</p>
    <h2 className="mt-2 text-2xl font-semibold" aria-live="polite">{preparation ? labels[preparation.stage] || "Preparing your assistant" : "Preparation progress"}</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">AiFrogi reads approved public business information, applies your brand profile, and checks the first answers. The preview remains private until production approval.</p>
    {preparation?.stage === "READY" && typeof preparation.durationMs === "number" ? <p className="mt-3 text-sm font-semibold">Preview prepared in {(preparation.durationMs / 1000).toFixed(1)}s · Four-minute target {preparation.slaMet ? "met" : "missed"}</p> : null}
    {preparation?.status === "RETRY" ? <p className="mt-3 text-sm">A website or answer check was interrupted. An automatic retry is scheduled.</p> : null}
    {preparation?.manifest ? <div className="mt-4"><p className="text-sm">Read {preparation.manifest.pages} pages · Checked {preparation.rows.length}/{preparation.totalChecks} customer questions</p><ul className="mt-2 space-y-1 text-sm">{preparation.manifest.topics.map(topic => <li key={topic.name}>{topic.present ? "Found" : "Needed"}: {topic.name}</li>)}</ul></div> : null}
    {preparation?.blockers?.length ? <ul className="mt-4 space-y-1 text-sm text-amber-800">{preparation.blockers.map(item => <li key={item}>{item}</li>)}</ul> : null}
    {preparation?.rows.length ? <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">Review the first answers</summary><div className="mt-3 space-y-4">{preparation.rows.map(row => <article key={row.id} className="border-t pt-3 text-sm"><p className="font-semibold">{row.question}</p><p className="mt-1 whitespace-pre-wrap">{row.answer || "An answer could not be checked."}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{row.passed ? "Passed the automatic check" : "Needs attention"} · {(row.latencyMs / 1000).toFixed(1)}s</p></article>)}</div><p className="mt-3 text-xs text-[var(--text-muted)]">Automatic checks help prepare the bot. Please test the answers yourself; this is not a customer satisfaction rating.</p></details> : null}
    <div className="mt-5 flex flex-wrap gap-4 text-sm font-semibold">
      {preparation?.previewReady ? <Link className="underline" href="/knowledge#test-your-bot">Test your preview</Link> : null}
      {preparation?.botLive && preparation.propertySlug ? <Link className="underline" href={`/bot/${encodeURIComponent(preparation.propertySlug)}`} target="_blank">Talk to your bot</Link> : null}
      <Link className="underline" href="/knowledge">Add or correct information</Link>
      {preparation?.botLive ? <Link className="underline" href="/setup">Get installation code and QR</Link> : null}
      {preparation?.canRetry ? <button className="underline disabled:opacity-50" disabled={retrying} onClick={() => void retry()}>{retrying ? "Queuing…" : "Retry preparation"}</button> : null}
    </div>
    {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
  </section>;
}
