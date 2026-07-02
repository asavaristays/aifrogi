"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/icons";
import type { KnowledgeSettings } from "@/lib/repositories/knowledge-repository";

type KnowledgePageSummary = { url: string; title: string; bucket: string; crawledAt: string };
type Summary = { settings: KnowledgeSettings; pages: KnowledgePageSummary[] };

export function KnowledgeWorkspace({
  initialSummary,
  propertySlug,
  canManage
}: {
  initialSummary: Summary;
  propertySlug: string;
  canManage: boolean;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [sourceUrl, setSourceUrl] = useState(initialSummary.settings.sourceUrl);
  const [instructions, setInstructions] = useState(initialSummary.settings.customInstructions);
  const [approvedForAi, setApprovedForAi] = useState(initialSummary.settings.approvedForAi);
  const [handoffText, setHandoffText] = useState(initialSummary.settings.handoffTopics.join("\n"));
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ text: string; mode: string; sources: string[] } | null>(null);
  const [testing, setTesting] = useState(false);

  const groupedPages = useMemo(() => {
    const groups = new Map<string, KnowledgePageSummary[]>();
    for (const page of summary.pages) groups.set(page.bucket, [...(groups.get(page.bucket) || []), page]);
    return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right));
  }, [summary.pages]);

  async function save() {
    setSaving(true);
    setNotice(null);
    try {
      const response = await fetch("/api/knowledge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceUrl,
          approvedForAi,
          customInstructions: instructions,
          handoffTopics: handoffText.split("\n").map((item) => item.trim()).filter(Boolean)
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save knowledge settings.");
      setSummary((current) => ({ ...current, settings: payload.settings }));
      setNotice("Knowledge settings saved. Sync the website to publish the latest source.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save knowledge settings.");
    } finally {
      setSaving(false);
    }
  }

  async function syncWebsite() {
    setSyncing(true);
    setNotice("Reading and classifying approved website pages...");
    try {
      const response = await fetch("/api/knowledge", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Knowledge sync failed.");
      setSummary({ settings: payload.settings, pages: payload.pages });
      setNotice(`${payload.pagesSynced} pages are ready for approved AI answers.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Knowledge sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function testAnswer() {
    if (!question.trim()) return;
    setTesting(true);
    setAnswer(null);
    try {
      const response = await fetch("/api/integrations/whatsapp/kb/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, propertySlug })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not test this answer.");
      setAnswer({ text: payload.answer, mode: payload.mode, sources: payload.sourceUrls || [] });
    } catch (error) {
      setAnswer({ text: error instanceof Error ? error.message : "Could not test this answer.", mode: "error", sources: [] });
    } finally {
      setTesting(false);
    }
  }

  const ready = summary.settings.status === "READY" && summary.pages.length > 0;

  return <div className="product-surface min-h-screen">
    <header className="border-b border-[var(--border)] bg-white px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 pl-12 lg:pl-0 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="product-eyebrow">Business intelligence</p><h1 className="mt-1 text-2xl font-semibold">Knowledge</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Control what AI can answer, where information comes from, and when a human takes over.</p></div>
        <div className="flex items-center gap-2"><span className={`status-pill ${ready ? "status-success" : summary.settings.status === "ERROR" ? "status-error" : "status-warning"}`}>{ready ? "Ready" : summary.settings.status.toLowerCase()}</span>{canManage ? <button onClick={syncWebsite} disabled={syncing} className="inline-flex min-h-9 items-center gap-2 rounded-md bg-[var(--primary-strong)] px-3 text-xs font-semibold text-white disabled:opacity-55"><Icon name="refresh-cw" className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing" : "Sync website"}</button> : null}</div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 sm:px-8">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Approved pages" value={String(summary.pages.length)} helper={ready ? "Available to the assistant" : "Sync required"} tone="blue" />
        <Metric label="Knowledge topics" value={String(groupedPages.length)} helper="Automatically classified" tone="violet" />
        <Metric label="AI answers" value={approvedForAi ? "Enabled" : "Paused"} helper="Human control remains active" tone="green" />
        <Metric label="Human handoff" value={String(handoffText.split("\n").filter(Boolean).length)} helper="Protected topics" tone="amber" />
      </section>

      {notice ? <div className="rounded-md border border-[#dbe8ff] bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</div> : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <section className="soft-card rounded-lg p-5">
            <div className="flex items-start justify-between gap-4"><div><p className="product-eyebrow">Approved source</p><h2 className="mt-1 text-lg font-semibold">Website knowledge</h2><p className="mt-1 text-sm text-[var(--text-muted)]">AiFrogi reads public pages only. It never asks for website admin credentials.</p></div><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary-strong)]"><Icon name="link" /></span></div>
            <label className="mt-5 block"><span className="field-label">Website URL</span><input className="product-input mt-2" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} disabled={!canManage} placeholder="https://example.com" /></label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"><div><strong className="block text-sm">Use approved knowledge for AI replies</strong><span className="text-xs text-[var(--text-muted)]">When paused, the inbox uses safe menu and human-handoff replies.</span></div><button type="button" disabled={!canManage} onClick={() => setApprovedForAi((value) => !value)} className={`relative h-7 w-12 rounded-full transition ${approvedForAi ? "bg-[var(--success)]" : "bg-[#cbc5ce]"}`} aria-label="Toggle AI knowledge answers"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${approvedForAi ? "left-6" : "left-1"}`} /></button></div>
          </section>

          <section className="soft-card overflow-hidden rounded-lg">
            <div className="border-b border-[var(--border)] px-5 py-4"><p className="product-eyebrow">Coverage</p><h2 className="mt-1 text-lg font-semibold">Topics and source pages</h2></div>
            {groupedPages.length ? <div className="divide-y divide-[var(--border)]">{groupedPages.map(([bucket, pages]) => <details key={bucket} className="group px-5 py-4" open={groupedPages.length < 5}><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span><strong className="text-sm font-semibold">{bucket}</strong><small className="ml-2 text-[var(--text-muted)]">{pages.length} page{pages.length === 1 ? "" : "s"}</small></span><span className="text-[var(--primary-strong)] group-open:rotate-90">→</span></summary><div className="mt-3 space-y-2">{pages.map((page) => <a key={page.url} href={page.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface-soft)] px-3 py-2 text-xs hover:bg-[var(--primary-soft)]"><span className="truncate">{page.title}</span><Icon name="arrow-right" className="h-3 w-3 shrink-0" /></a>)}</div></details>)}</div> : <div className="px-6 py-12 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon name="file-text" /></span><h3 className="mt-3 text-sm font-semibold">No approved pages yet</h3><p className="mt-1 text-xs text-[var(--text-muted)]">Save the source and sync the website to build topic coverage.</p></div>}
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5">
          <section className="soft-card rounded-lg p-5"><p className="product-eyebrow">Answer constitution</p><h2 className="mt-1 text-lg font-semibold">How the assistant behaves</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Global safety rules always apply. Add workspace-specific guidance below.</p><textarea className="product-input mt-4 min-h-28 resize-y" value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={!canManage} /><label className="mt-4 block"><span className="field-label">Always hand over these topics</span><textarea className="product-input mt-2 min-h-32 resize-y" value={handoffText} onChange={(event) => setHandoffText(event.target.value)} disabled={!canManage} /><small className="mt-1 block text-[11px] text-[var(--text-muted)]">Enter one topic per line.</small></label>{canManage ? <button onClick={save} disabled={saving} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--border)] bg-white text-sm font-semibold text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] disabled:opacity-55">{saving ? "Saving..." : "Save knowledge controls"}</button> : <p className="mt-4 rounded-md bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-muted)]">Your Client Admin manages these controls.</p>}</section>

          <section className="rounded-lg border border-[#dbe8ff] bg-white p-5 shadow-[var(--shadow-card)]"><p className="product-eyebrow">Safe preview</p><h2 className="mt-1 text-lg font-semibold">Test an answer</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">See what a customer would receive before enabling automation.</p><textarea className="product-input mt-4 min-h-24 resize-y" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a real customer question..." /><button onClick={testAnswer} disabled={testing || !question.trim()} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2c243b] text-sm font-semibold text-white disabled:opacity-50"><Icon name="sparkles" />{testing ? "Checking knowledge..." : "Generate safe answer"}</button>{answer ? <div className="mt-4 rounded-md bg-[var(--surface-soft)] p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[var(--text-muted)]">{answer.mode === "openai_kb" ? "Knowledge answer" : "Safe fallback"}</span><span className={`h-2 w-2 rounded-full ${answer.mode === "error" ? "bg-[var(--error)]" : "bg-[var(--success)]"}`} /></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{answer.text}</p>{answer.sources.length ? <p className="mt-3 text-[10px] text-[var(--text-muted)]">Grounded in {answer.sources.length} approved source{answer.sources.length === 1 ? "" : "s"}.</p> : null}</div> : null}</section>
        </aside>
      </div>
    </main>
  </div>;
}

function Metric({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-[var(--info-soft)] text-[var(--info)]", violet: "bg-[var(--primary-soft)] text-[var(--primary-strong)]", green: "bg-[var(--success-soft)] text-[var(--success)]", amber: "bg-[var(--tertiary-soft)] text-[var(--tertiary)]" };
  return <article className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><span className={`h-8 w-2 rounded-full ${colors[tone]}`} /></div><p className="mt-3 text-[11px] text-[var(--text-muted)]">{helper}</p></article>;
}

