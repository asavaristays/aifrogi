"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/icons";
import { OnboardingWorkbookImport } from "@/components/onboarding/onboarding-workbook-import";
import type { KnowledgeSettings } from "@/lib/repositories/knowledge-repository";

type KnowledgePageSummary = { url: string; title: string; bucket: string; crawledAt: string };
type KnowledgeDocumentSummary = { id: string; fileName: string; mimeType: string; sizeBytes: number; status: string; conflictSummary: string | null; uploadedBy: string; approvedBy: string | null; createdAt: string | Date; updatedAt: string | Date };
type KnowledgeEntrySummary = { id: string; question: string; answer: string; category: string; status: string; claimType?: string; valueType?: string; currency?: string | null; version?: number; validationStatus?: string; validationErrors?: string[]; conflictStatus?: string; conflictSummary: string | null; fieldApprovedBy?: string | null; fieldApprovedAt?: string | Date | null; previewApprovedBy?: string | null; previewApprovedAt?: string | Date | null; expiresAt?: string | Date | null; pauseReason?: string | null; createdBy: string; approvedBy: string | null; createdAt: string | Date; updatedAt: string | Date };
type KnowledgeGapSummary = { id: string; question: string; occurrenceCount: number; status: string; lastAskedAt: string | Date };
type KnowledgePreviewSummary = { id: string; entryId: string; question: string; generatedAnswer: string; status: string };
type KnowledgeFlagSummary = { id: string; entryId?: string | null; reason: string; status: string; acknowledgeDueAt: string | Date; resolveDueAt: string | Date };
type ImprovementRouteSummary = { id: string; trigger: string; state: string; priority: string; owner: string; deadline: string | Date | null; nextAction: string; lifecycle: string; occurrenceCount: number };
type VerificationSummary = { coverage: { percentage: number; covered?: number; total?: number; missing: string[] }; freshnessRate: number; conflicts: number; unsigned: number; openFlags: number; previewPending: number; ready: boolean };
type Summary = { settings: KnowledgeSettings; pages: KnowledgePageSummary[]; propertyId: string | null; documents: KnowledgeDocumentSummary[]; entries: KnowledgeEntrySummary[]; gaps: KnowledgeGapSummary[]; previews?: KnowledgePreviewSummary[]; flags?: KnowledgeFlagSummary[]; improvementRoutes?: ImprovementRouteSummary[]; verification?: VerificationSummary | null; kbGateEnabled?: boolean };

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
  const [uploading, setUploading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [entryQuestion, setEntryQuestion] = useState("");
  const [entryAnswer, setEntryAnswer] = useState("");
  const [entryCategory, setEntryCategory] = useState("General");
  const [entryGapId, setEntryGapId] = useState<string | undefined>();
  const [savingEntry, setSavingEntry] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(initialSummary.settings.welcomeMessage);
  const [themeColor, setThemeColor] = useState(initialSummary.settings.themeColor);
  const [logoUrl, setLogoUrl] = useState(initialSummary.settings.logoUrl);
  const [savingAppearance, setSavingAppearance] = useState(false);

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

  async function saveAppearance() {
    setSavingAppearance(true); setNotice(null);
    try {
      const response = await fetch("/api/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ welcomeMessage, themeColor, logoUrl }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save bot appearance.");
      setSummary((current) => ({ ...current, settings: payload.settings }));
      setNotice("Bot name, colour and welcome message saved. You can change them anytime.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save bot appearance."); }
    finally { setSavingAppearance(false); }
  }

  async function syncWebsite() {
    setSyncing(true);
    setNotice("Reading and classifying approved website pages...");
    try {
      const response = await fetch("/api/knowledge", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Knowledge sync failed.");
      setSummary((current) => ({ ...current, settings: payload.settings, pages: payload.pages }));
      setNotice(`${payload.pagesSynced} pages are ready for approved AI answers.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Knowledge sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  async function connectWebsite() {
    if (!sourceUrl.trim()) { setNotice("Enter your public website address first."); return; }
    setSyncing(true); setNotice("Connecting your website and preparing its public information...");
    try {
      const saved = await fetch("/api/knowledge", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl, approvedForAi, customInstructions: instructions, handoffTopics: handoffText.split("\n").map((item) => item.trim()).filter(Boolean) }) });
      const savedPayload = await saved.json();
      if (!saved.ok) throw new Error(savedPayload.error || "Could not save the website source.");
      const synced = await fetch("/api/knowledge", { method: "POST" });
      const syncedPayload = await synced.json();
      if (!synced.ok) throw new Error(syncedPayload.error || "Could not read this website.");
      setSummary((current) => ({ ...current, settings: syncedPayload.settings, pages: syncedPayload.pages }));
      setNotice(`${syncedPayload.pagesSynced} website page${syncedPayload.pagesSynced === 1 ? " is" : "s are"} ready for review.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not connect this website."); }
    finally { setSyncing(false); }
  }

  async function refreshGovernance() {
    const response = await fetch("/api/knowledge", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Could not refresh knowledge governance.");
    setSummary((current) => ({ ...current, propertyId: payload.propertyId, documents: payload.documents || [], entries: payload.entries || [], gaps: payload.gaps || [], previews: payload.previews || [], flags: payload.flags || [], improvementRoutes: payload.improvementRoutes || [], verification: payload.verification, kbGateEnabled: payload.kbGateEnabled }));
  }

  async function uploadDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setUploading(true); setNotice(null); setUploadNotice(null);
    try {
      const response = await fetch("/api/knowledge/documents", { method: "POST", body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not upload this document.");
      await refreshGovernance();
      form.reset();
      const message = payload.stagedCount ? `${payload.stagedCount} atomic claim suggestion${payload.stagedCount === 1 ? "" : "s"} extracted. Review every claim; none is live yet.` : "Source uploaded, but no safe atomic claim structure was detected. Add its facts manually; the raw document will not be used by AI.";
      setUploadNotice(message); setNotice(message);
    } catch (error) { const message = error instanceof Error ? error.message : "Could not upload this document."; setUploadNotice(message); setNotice(message); }
    finally { setUploading(false); }
  }

  async function reviewDocument(id: string, action: "APPROVE" | "REJECT" | "DELETE", hasConflict = false) {
    const confirmConflict = hasConflict && action === "APPROVE" ? window.confirm("This document may conflict with approved information. Approve it anyway?") : false;
    if (hasConflict && action === "APPROVE" && !confirmConflict) return;
    const response = await fetch("/api/knowledge/documents", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, confirmConflict }) });
    const payload = await response.json();
    if (!response.ok) { setNotice(payload.error || "Could not update this document."); return; }
    await refreshGovernance(); setNotice(`Document ${action.toLowerCase()}d.`);
  }

  async function saveEntry(event: FormEvent) {
    event.preventDefault(); setSavingEntry(true); setNotice(null);
    try {
      const response = await fetch("/api/knowledge/entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: entryQuestion, answer: entryAnswer, category: entryCategory, gapId: entryGapId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save this answer.");
      await refreshGovernance();
      setEntryQuestion(""); setEntryAnswer(""); setEntryCategory("General"); setEntryGapId(undefined);
      setNotice(payload.entry.status === "CONFLICT" ? "Answer saved with a possible conflict. Review it before approval." : "Answer saved as a draft. Approve it when ready.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not save this answer."); }
    finally { setSavingEntry(false); }
  }

  async function reviewEntry(id: string, action: "FIELD_APPROVE" | "GENERATE_PREVIEW" | "PREVIEW_APPROVE" | "PREVIEW_REJECT" | "PAUSE" | "RECONFIRM" | "DELETE", previewId?: string, hasConflict = false) {
    const supersedesId = hasConflict && action === "FIELD_APPROVE" ? window.prompt("Enter the exact claim ID this new version supersedes. Conflicts cannot be bypassed.") || undefined : undefined;
    if (hasConflict && action === "FIELD_APPROVE" && !supersedesId) return;
    const reason = action === "PREVIEW_REJECT" ? window.prompt("What should be corrected in this answer?") || undefined : undefined;
    const response = await fetch("/api/knowledge/entries", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action, previewId, supersedesId, reason }) });
    const payload = await response.json();
    if (!response.ok) { setNotice(payload.error || "Could not update this answer."); return; }
    await refreshGovernance();
    const messages: Record<string, string> = {
      FIELD_APPROVE: "Answer confirmed. Next, create the customer preview.",
      GENERATE_PREVIEW: "Preview created. Read it once, then approve it to make this answer live.",
      PREVIEW_APPROVE: "Answer approved and published. The bot may now use it.",
      PREVIEW_REJECT: "Preview returned for correction. It has not been published.",
      PAUSE: "Answer paused. The bot will not use it until you restore it.",
      RECONFIRM: "Answer restored after reconfirmation.",
      DELETE: "Draft answer deleted."
    };
    setNotice(messages[action] || "Answer updated.");
  }

  async function dismissGap(id: string) {
    const response = await fetch("/api/knowledge/gaps", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) { const payload = await response.json(); setNotice(payload.error || "Could not dismiss this gap."); return; }
    await refreshGovernance(); setNotice("Knowledge gap dismissed.");
  }

  function answerGap(gap: KnowledgeGapSummary) {
    setEntryQuestion(gap.question); setEntryGapId(gap.id);
    document.getElementById("manual-answer-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function startRequiredAnswer(requiredQuestion: string) {
    setEntryQuestion(requiredQuestion);
    setEntryGapId(undefined);
    const form = document.querySelector<HTMLDetailsElement>("#manual-answer-form details");
    if (form) form.open = true;
    document.getElementById("manual-answer-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const publishedCount = summary.entries.filter((item) => ["PUBLISHED", "APPROVED"].includes(item.status)).length;
  const pendingCount = summary.entries.length - publishedCount;
  const sourceReady = summary.settings.status === "READY" && summary.pages.length > 0;
  const quickTrial = !summary.kbGateEnabled;
  const ready = quickTrial ? sourceReady && publishedCount >= 5 : Boolean(summary.verification?.ready);

  return <div className="product-surface min-h-screen">
    <header className="border-b border-[var(--border)] bg-white px-5 py-4 sm:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 pl-12 lg:pl-0 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="product-eyebrow">{quickTrial ? "15-day quick trial" : "Your bot’s intelligence"}</p><h1 className="mt-1 text-2xl font-semibold">{quickTrial ? "Launch your trial bot" : "Teach your AI Bot"}</h1><p className="mt-1 max-w-2xl text-sm text-[var(--text-muted)]">{quickTrial ? "Connect your website, confirm five essential answers, choose the look and test. Add more knowledge anytime." : "Add your website or files, check what the bot will say, and approve it. Nothing is used in a live answer without your approval."}</p></div>
        <div className="flex items-center gap-2"><span className={`status-pill ${ready ? "status-success" : summary.settings.status === "ERROR" ? "status-error" : "status-warning"}`}>{ready ? quickTrial ? "Trial ready for testing" : "Ready for customers" : sourceReady ? quickTrial ? `${publishedCount}/5 essential answers ready` : "Source connected · approval required" : "Setup in progress"}</span></div>
      </div>
    </header>

    <main className="mx-auto max-w-[1500px] space-y-5 px-5 py-6 sm:px-8">
      <section className="overflow-hidden rounded-[28px] bg-[#080808] text-white shadow-[0_28px_80px_rgba(0,0,0,.18)]">
        <div className="grid lg:grid-cols-[1.08fr_.92fr]"><div className="p-6 sm:p-8"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#e2c66d]">Start here</p><h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-[-.03em] sm:text-3xl">Give your bot information it can safely use.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/60">The easiest option is your public website. You can also upload current documents or type an important answer yourself.</p><div className="mt-7 flex flex-wrap gap-3"><a href="#upload-knowledge" className="inline-flex min-h-11 items-center rounded-full bg-[#b38a20] px-5 text-sm font-semibold text-white">Upload files</a><a href="#manual-answer-form" className="inline-flex min-h-11 items-center rounded-full border border-white/18 px-5 text-sm font-semibold text-white">Add one answer</a></div></div><div className="border-t border-white/10 bg-white/[.04] p-6 sm:p-8 lg:border-l lg:border-t-0"><label className="text-xs font-semibold text-white/75">Your public website</label><input className="mt-3 min-h-12 w-full rounded-xl border border-white/14 bg-black/40 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#d3aa42]" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} disabled={!canManage} placeholder="https://yourbusiness.com" />{canManage ? <button onClick={connectWebsite} disabled={syncing || !sourceUrl.trim()} className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-black disabled:opacity-45"><Icon name="sparkles" />{syncing ? "Reading your website..." : summary.pages.length ? "Update website knowledge" : "Use my website"}</button> : null}<p className="mt-3 text-xs leading-5 text-white/45">We read public pages only. No website password or admin access is required.</p></div></div>
        <div className="grid border-t border-white/10 sm:grid-cols-3">{[[summary.pages.length > 0 || summary.documents.length > 0,"1","Connect website",summary.pages.length || summary.documents.length ? "Website ready" : "Enter the website"],[publishedCount >= (quickTrial ? 5 : 1) && pendingCount === 0,"2",quickTrial ? "Confirm essentials" : "Review answers",pendingCount ? `${pendingCount} awaiting approval` : `${quickTrial ? Math.min(publishedCount, 5) : publishedCount}/${quickTrial ? 5 : publishedCount || 1} answers ready`],[ready,"3",quickTrial ? "Test your trial bot" : "Test and approve",ready ? quickTrial ? "Ready now" : "Ready for customers" : quickTrial ? "Finish five essentials" : `${summary.verification?.coverage.percentage || 0}% of required topics covered`]].map(([complete,number,title,copy]) => <div key={String(number)} className="flex items-start gap-3 border-white/10 p-5 sm:border-r last:border-r-0"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black ${complete ? "bg-[#31c99a] text-black" : "bg-white/10 text-[#e2c66d]"}`}>{complete ? "✓" : number}</span><span><strong className="block text-sm">{title}</strong><small className="mt-1 block text-white/45">{copy}</small></span></div>)}</div>
      </section>

      {notice ? <div className="rounded-xl border border-[#dbe8ff] bg-[var(--info-soft)] px-4 py-3 text-sm text-[#385d8e]">{notice}</div> : null}

      {quickTrial ? <section className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6"><p className="product-eyebrow">Quick trial · appearance</p><div className="mt-2 grid gap-4 lg:grid-cols-[1fr_160px_1fr_auto] lg:items-end"><label><span className="field-label">Welcome message</span><input className="product-input mt-2" value={welcomeMessage} onChange={(event) => setWelcomeMessage(event.target.value)} placeholder="Hello. How can I help?" /></label><label><span className="field-label">Bot colour</span><div className="mt-2 flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3"><input type="color" value={themeColor} onChange={(event) => setThemeColor(event.target.value)} className="h-7 w-9 cursor-pointer border-0 bg-transparent" /><span className="text-xs font-semibold">{themeColor}</span></div></label><label><span className="field-label">Logo URL (optional)</span><input className="product-input mt-2" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://yourwebsite.com/logo.png" /></label><button onClick={saveAppearance} disabled={savingAppearance} className="min-h-11 rounded-full bg-[#9a7411] px-5 text-sm font-semibold text-white disabled:opacity-50">{savingAppearance ? "Saving…" : "Save appearance"}</button></div></section> : null}

      {quickTrial && ready ? <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6"><p className="product-eyebrow">Quick trial setup complete</p><div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Your bot is ready to test.</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Ask five real customer questions. Documents and additional fine-tuning can be added later.</p></div><a href="#test-your-bot" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#101010] px-5 text-sm font-semibold text-white">Test my bot →</a></div></section> : null}

      {!quickTrial && !ready && publishedCount > 0 && summary.verification?.coverage.missing.length ? <section className="rounded-2xl border border-[#e4cf8e] bg-[#fffaf0] p-5 sm:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="product-eyebrow">Your next action</p><h2 className="mt-1 text-xl font-semibold">Complete the required customer questions.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">Your {publishedCount} approved answer{publishedCount === 1 ? " is" : "s are"} live. To prepare this governed bot for full launch, add correct answers for at least {Math.max(0, 8 - (summary.verification.coverage.covered || 0))} more required topic{Math.max(0, 8 - (summary.verification.coverage.covered || 0)) === 1 ? "" : "s"}.</p></div><span className="status-pill status-warning">{summary.verification.coverage.percentage}% complete</span></div><div className="mt-5 grid gap-2 md:grid-cols-2">{summary.verification.coverage.missing.map((requiredQuestion) => <div key={requiredQuestion} className="flex items-center justify-between gap-3 rounded-xl border border-[#eadcae] bg-white px-4 py-3"><span className="text-sm font-medium">{requiredQuestion}</span><button onClick={() => startRequiredAnswer(requiredQuestion)} className="shrink-0 rounded-full bg-[#101010] px-4 py-2 text-xs font-semibold text-white">Add answer</button></div>)}</div></section> : null}

      <details className="group rounded-2xl border border-[var(--border)] bg-white"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><span><strong className="block text-sm">Readiness and safety checks</strong><small className="mt-1 block text-[var(--text-muted)]">Optional details for administrators</small></span><span className="text-[var(--primary-strong)] group-open:rotate-90">→</span></summary><section className="grid gap-3 border-t border-[var(--border)] p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Category coverage" value={`${summary.verification?.coverage.percentage || 0}%`} helper="80% required to go live" tone="blue" />
        <Metric label="Fresh knowledge" value={`${summary.verification?.freshnessRate || 0}%`} helper="95% required to go live" tone="violet" />
        <Metric label="Conflicts" value={String(summary.verification?.conflicts || 0)} helper="Zero may be published" tone="green" />
        <Metric label="Preparation gate" value={summary.verification?.ready ? "Ready" : "Blocked"} helper={summary.kbGateEnabled ? "KB Gate 1.0 enforced" : "Legacy profile"} tone="amber" />
      </section></details>

      <span id="test-your-bot" className="block scroll-mt-6" aria-hidden="true" />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5 [&>section:first-child]:hidden">
          <section className="soft-card rounded-lg p-5">
            <div className="flex items-start justify-between gap-4"><div><p className="product-eyebrow">Approved source</p><h2 className="mt-1 text-lg font-semibold">Website knowledge</h2><p className="mt-1 text-sm text-[var(--text-muted)]">AiFrogi reads public pages only. It never asks for website admin credentials.</p></div><span className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary-strong)]"><Icon name="link" /></span></div>
            <label className="mt-5 block"><span className="field-label">Website URL</span><input className="product-input mt-2" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} disabled={!canManage} placeholder="https://example.com" /></label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4"><div><strong className="block text-sm">Use approved knowledge for AI replies</strong><span className="text-xs text-[var(--text-muted)]">When paused, the inbox uses safe menu and human-handoff replies.</span></div><button type="button" disabled={!canManage} onClick={() => setApprovedForAi((value) => !value)} className={`relative h-7 w-12 rounded-full transition ${approvedForAi ? "bg-[var(--success)]" : "bg-[#ded8cb]"}`} aria-label="Toggle AI knowledge answers"><span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${approvedForAi ? "left-6" : "left-1"}`} /></button></div>
          </section>

          <section className="soft-card overflow-hidden rounded-lg">
            <div className="border-b border-[var(--border)] px-5 py-4"><p className="product-eyebrow">Your website</p><h2 className="mt-1 text-lg font-semibold">Information we found</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Open a topic only when you want to inspect its source pages.</p></div>
            {groupedPages.length ? <div className="divide-y divide-[var(--border)]">{groupedPages.map(([bucket, pages]) => <details key={bucket} className="group px-5 py-4" open={groupedPages.length < 5}><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><span><strong className="text-sm font-semibold">{bucket}</strong><small className="ml-2 text-[var(--text-muted)]">{pages.length} page{pages.length === 1 ? "" : "s"}</small></span><span className="text-[var(--primary-strong)] group-open:rotate-90">→</span></summary><div className="mt-3 space-y-2">{pages.map((page) => <a key={page.url} href={page.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-md bg-[var(--surface-soft)] px-3 py-2 text-xs hover:bg-[var(--primary-soft)]"><span className="truncate">{page.title}</span><Icon name="arrow-right" className="h-3 w-3 shrink-0" /></a>)}</div></details>)}</div> : <div className="px-6 py-12 text-center"><span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--text-muted)]"><Icon name="file-text" /></span><h3 className="mt-3 text-sm font-semibold">No approved pages yet</h3><p className="mt-1 text-xs text-[var(--text-muted)]">Save the source and sync the website to build topic coverage.</p></div>}
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 [&>section:first-child]:hidden">
          <section className="soft-card rounded-lg p-5"><p className="product-eyebrow">Answer constitution</p><h2 className="mt-1 text-lg font-semibold">How the assistant behaves</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Global safety rules always apply. Add workspace-specific guidance below.</p><textarea className="product-input mt-4 min-h-28 resize-y" value={instructions} onChange={(event) => setInstructions(event.target.value)} disabled={!canManage} /><label className="mt-4 block"><span className="field-label">Always hand over these topics</span><textarea className="product-input mt-2 min-h-32 resize-y" value={handoffText} onChange={(event) => setHandoffText(event.target.value)} disabled={!canManage} /><small className="mt-1 block text-[11px] text-[var(--text-muted)]">Enter one topic per line.</small></label>{canManage ? <button onClick={save} disabled={saving} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-md border border-[var(--border)] bg-white text-sm font-semibold text-[var(--primary-strong)] hover:bg-[var(--primary-soft)] disabled:opacity-55">{saving ? "Saving..." : "Save knowledge controls"}</button> : <p className="mt-4 rounded-md bg-[var(--surface-soft)] p-3 text-xs text-[var(--text-muted)]">Your Client Admin manages these controls.</p>}</section>

          <section className="rounded-lg border border-[#dbe8ff] bg-white p-5 shadow-[var(--shadow-card)]"><p className="product-eyebrow">Step 3</p><h2 className="mt-1 text-lg font-semibold">Ask your bot a question</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Test the same questions your customers normally ask.</p><textarea className="product-input mt-4 min-h-24 resize-y" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: What time do you open on Saturday?" /><button onClick={testAnswer} disabled={testing || !question.trim()} className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#101010] text-sm font-semibold text-white disabled:opacity-50"><Icon name="sparkles" />{testing ? "Checking your information..." : "Ask my bot"}</button>{answer ? <div className="mt-4 rounded-md bg-[var(--surface-soft)] p-4"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold text-[var(--text-muted)]">{answer.mode === "openai_kb" ? "Answer from approved information" : "Safe handover answer"}</span><span className={`h-2 w-2 rounded-full ${answer.mode === "error" ? "bg-[var(--error)]" : "bg-[var(--success)]"}`} /></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5">{answer.text}</p>{answer.sources.length ? <p className="mt-3 text-[10px] text-[var(--text-muted)]">Checked against {answer.sources.length} approved source{answer.sources.length === 1 ? "" : "s"}.</p> : null}</div> : null}</section>
        </aside>
      </div>

      <section className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          {canManage ? <OnboardingWorkbookImport onImported={() => window.location.reload()} /> : null}
          <div id="upload-knowledge" className="soft-card overflow-hidden rounded-lg"><div className="border-b border-[var(--border)] px-5 py-4"><p className="product-eyebrow">Trusted source evidence</p><h2 className="mt-1 text-lg font-semibold">Upload supporting documents</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Use this for current service, pricing, policy, contact and operating documents. Use the Excel importer above for the completed AiFrogi onboarding workbook.</p></div>{canManage ? <form onSubmit={uploadDocument} className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="min-w-0 flex-1"><span className="field-label">PDF, DOCX, TXT, Markdown, CSV, or JSON</span><input name="file" type="file" required accept=".pdf,.docx,.txt,.md,.csv,.json" className="mt-2 block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[var(--primary-soft)] file:px-3 file:py-2 file:font-semibold file:text-[var(--primary-strong)]" /></label><button disabled={uploading} className="min-h-9 rounded-md bg-[#101010] px-4 text-xs font-semibold text-white disabled:opacity-55">{uploading ? "Extracting..." : "Upload source"}</button></div>{uploadNotice ? <p role="status" className={`text-xs font-semibold ${/could not|must be|no readable|upload a /i.test(uploadNotice) ? "text-red-700" : "text-[#176b50]"}`}>{uploadNotice}</p> : null}</form> : null}<div className="divide-y divide-[var(--border)]">{summary.documents.length ? summary.documents.map((item) => <DocumentRow key={item.id} item={item} canManage={canManage} onReview={reviewDocument} />) : <EmptyState title="No source files uploaded" copy="Add supporting policies, service guides, pricing sheets, contact details, FAQs, or operating information." />}</div></div>
        </div>

        <div id="manual-answer-form" className="soft-card rounded-lg p-5"><p className="product-eyebrow">Step 2</p><h2 className="mt-1 text-lg font-semibold">Review and approve answers</h2><p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">Check each answer below. AiFrogi will guide you through one clear action at a time before anything can go live.</p>{canManage ? <details className="group mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]"><summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold"><span>+ Add an answer manually</span><span className="text-[var(--primary-strong)] group-open:rotate-90">→</span></summary><form onSubmit={saveEntry} className="space-y-3 border-t border-[var(--border)] p-4"><label className="block"><span className="field-label">Question a customer may ask</span><input className="product-input mt-2" value={entryQuestion} onChange={(event) => setEntryQuestion(event.target.value)} required placeholder="Example: What is your phone number?" /></label><label className="block"><span className="field-label">Correct answer</span><textarea className="product-input mt-2 min-h-28 resize-y" value={entryAnswer} onChange={(event) => setEntryAnswer(event.target.value)} required placeholder="Enter the exact answer the bot may use." /></label><div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="flex-1"><span className="field-label">Topic</span><input className="product-input mt-2" value={entryCategory} onChange={(event) => setEntryCategory(event.target.value)} /></label><button disabled={savingEntry} className="min-h-11 rounded-md bg-[var(--primary-strong)] px-4 text-xs font-semibold text-white disabled:opacity-55">{savingEntry ? "Checking answer..." : "Save for review"}</button></div>{entryGapId ? <p className="rounded-md bg-[var(--info-soft)] px-3 py-2 text-xs text-[#385d8e]">This answer will resolve the selected unanswered question.</p> : null}</form></details> : null}<div className="mt-5 space-y-4">{summary.entries.length ? summary.entries.map((item, index) => <EntryRow key={item.id} item={item} position={index + 1} total={summary.entries.length} preview={(summary.previews || []).find((preview) => preview.entryId === item.id && preview.status === "PENDING")} canManage={canManage} onReview={reviewEntry} />) : <EmptyState title="No answers to review" copy="Upload the completed Excel template, a supporting document, or add one answer manually." />}</div></div>
      </section>

      {(summary.improvementRoutes || []).length ? <section className="soft-card overflow-hidden rounded-lg"><div className="border-b border-[var(--border)] px-5 py-4"><p className="product-eyebrow">Governed improvement routing</p><h2 className="mt-1 text-lg font-semibold">Every signal has an owner and safe next action</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Signals may pause or prioritise review, but never rewrite approved business truth automatically.</p></div><div className="divide-y divide-[var(--border)]">{(summary.improvementRoutes || []).map((route) => <div key={route.id} className="grid gap-3 px-5 py-4 md:grid-cols-[180px_160px_minmax(0,1fr)] md:items-start"><div><strong className="text-sm">{route.trigger.toLowerCase().replaceAll("_", " ")}</strong><small className="mt-1 block text-[var(--text-muted)]">Owner: {route.owner.toLowerCase().replaceAll("_", " ")}</small></div><div><Status value={route.priority} /><small className="mt-2 block text-[var(--text-muted)]">{route.state.toLowerCase().replaceAll("_", " ")}{route.deadline ? ` · due ${formatDateTime(route.deadline)}` : ""}</small></div><p className="text-xs leading-5 text-[var(--text-muted)]">{route.nextAction}</p></div>)}</div></section> : null}

      {(summary.flags || []).length ? <section className="soft-card overflow-hidden rounded-lg"><div className="border-b border-[var(--border)] px-5 py-4"><p className="product-eyebrow">Correction queue</p><h2 className="mt-1 text-lg font-semibold">Flagged answers</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Affected facts are paused immediately. Acknowledge within two hours and resolve within 24 hours.</p></div><div className="divide-y divide-[var(--border)]">{(summary.flags || []).map((flag) => <div key={flag.id} className="px-5 py-4"><div className="flex items-center justify-between gap-3"><strong className="text-sm">{flag.reason}</strong><Status value={flag.status} /></div><small className="mt-1 block text-[var(--text-muted)]">Resolution due {formatDateTime(flag.resolveDueAt)}</small></div>)}</div></section> : null}

      <section className="soft-card overflow-hidden rounded-lg"><div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Learning queue</p><h2 className="mt-1 text-lg font-semibold">Unanswered customer questions</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Repeated questions rise automatically. Resolve them with an approved answer or dismiss irrelevant requests.</p></div><span className={`status-pill ${summary.gaps.length ? "status-warning" : "status-success"}`}>{summary.gaps.length} open</span></div><div className="divide-y divide-[var(--border)]">{summary.gaps.length ? summary.gaps.map((gap) => <div key={gap.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_100px_auto] sm:items-center"><div><strong className="text-sm font-semibold">{gap.question}</strong><small className="mt-1 block text-[var(--text-muted)]">Last asked {formatDate(gap.lastAskedAt)}</small></div><span className="text-xs text-[var(--text-muted)]">{gap.occurrenceCount} occurrence{gap.occurrenceCount === 1 ? "" : "s"}</span>{canManage ? <div className="flex gap-2"><button onClick={() => answerGap(gap)} className="min-h-8 rounded-md bg-[var(--primary-soft)] px-3 text-xs font-semibold text-[var(--primary-strong)]">Answer</button><button onClick={() => dismissGap(gap.id)} className="min-h-8 px-2 text-xs font-semibold text-[var(--text-muted)]">Dismiss</button></div> : null}</div>) : <EmptyState title="No unanswered questions" copy="New knowledge gaps will appear here when approved sources do not contain an answer." />}</div></section>
    </main>
  </div>;
}

function Metric({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "blue" | "violet" | "green" | "amber" }) {
  const colors = { blue: "bg-[var(--info-soft)] text-[var(--info)]", violet: "bg-[var(--primary-soft)] text-[var(--primary-strong)]", green: "bg-[var(--success-soft)] text-[var(--success)]", amber: "bg-[var(--tertiary-soft)] text-[var(--tertiary)]" };
  return <article className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-card)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div><span className={`h-8 w-2 rounded-full ${colors[tone]}`} /></div><p className="mt-3 text-[11px] text-[var(--text-muted)]">{helper}</p></article>;
}

function DocumentRow({ item, canManage, onReview }: { item: KnowledgeDocumentSummary; canManage: boolean; onReview: (id: string, action: "APPROVE" | "REJECT" | "DELETE", conflict?: boolean) => void }) { return <article className="px-5 py-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><strong className="block truncate text-sm">{item.fileName}</strong><small className="mt-1 block text-[var(--text-muted)]">{formatBytes(item.sizeBytes)} · {formatDate(item.createdAt)}</small></div><Status value={item.status} /></div>{item.conflictSummary ? <p className="mt-3 rounded-md bg-[var(--error-soft)] px-3 py-2 text-xs text-[var(--error)]">{item.conflictSummary}</p> : null}{canManage && !["APPROVED","REJECTED"].includes(item.status) ? <div className="mt-3 flex gap-2"><button onClick={() => onReview(item.id,"APPROVE",Boolean(item.conflictSummary))} className="text-xs font-semibold text-[var(--success)]">Approve</button><button onClick={() => onReview(item.id,"REJECT")} className="text-xs font-semibold text-[var(--error)]">Reject</button><button onClick={() => onReview(item.id,"DELETE")} className="text-xs text-[var(--text-muted)]">Delete</button></div> : null}</article>; }
function EntryRow({ item, position, total, preview, canManage, onReview }: { item: KnowledgeEntrySummary; position: number; total: number; preview?: KnowledgePreviewSummary; canManage: boolean; onReview: (id: string, action: "FIELD_APPROVE" | "GENERATE_PREVIEW" | "PREVIEW_APPROVE" | "PREVIEW_REJECT" | "PAUSE" | "RECONFIRM" | "DELETE", previewId?: string, conflict?: boolean) => void }) {
  const published = ["PUBLISHED", "APPROVED"].includes(item.status);
  const needsFactApproval = ["VALIDATED", "CONFLICT"].includes(item.status);
  const needsPreview = item.status === "FIELD_APPROVED";
  const needsPublish = item.status === "PREVIEW_PENDING" && Boolean(preview);
  const step = published ? 3 : needsPublish ? 3 : needsPreview ? 2 : 1;
  return <article className={`rounded-xl border p-4 ${published ? "border-emerald-200 bg-emerald-50/40" : "border-[var(--border)] bg-white"}`}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><small className="font-semibold text-[var(--text-muted)]">Answer {position} of {total} · {item.category}</small><strong className="mt-1 block text-base">{item.question}</strong></div><span className={`status-pill ${published ? "status-success" : "status-warning"}`}>{published ? "Live" : `Approval step ${step} of 3`}</span></div>
    <div className="mt-3 rounded-lg bg-[var(--surface-soft)] p-3"><small className="field-label">Bot will answer</small><p className="mt-2 text-sm leading-6">{item.answer}</p></div>
    {item.validationErrors?.length ? <p className="mt-3 rounded-md bg-[var(--error-soft)] px-3 py-2 text-xs text-[var(--error)]">Please correct: {item.validationErrors.join(", ")}</p> : null}
    {item.conflictSummary ? <p className="mt-3 rounded-md bg-[var(--error-soft)] px-3 py-2 text-xs text-[var(--error)]">Possible conflicting information: {item.conflictSummary}</p> : null}
    {preview ? <div className="mt-3 rounded-lg border border-[#d9c583] bg-[#fffaf0] p-3"><small className="field-label">Preview exactly as the customer will see it</small><p className="mt-2 text-sm leading-6">{preview.generatedAnswer}</p></div> : null}
    {item.pauseReason ? <p className="mt-3 text-xs text-[var(--error)]">Paused: {item.pauseReason}</p> : null}
    {canManage ? <div className="mt-4 flex flex-wrap items-center gap-3">
      {needsFactApproval ? <button onClick={() => onReview(item.id,"FIELD_APPROVE",undefined,Boolean(item.conflictSummary))} className="min-h-11 rounded-full bg-[#0c7658] px-5 text-sm font-semibold text-white">Yes, this answer is correct →</button> : null}
      {needsPreview ? <button onClick={() => onReview(item.id,"GENERATE_PREVIEW")} className="min-h-11 rounded-full bg-[#9a7411] px-5 text-sm font-semibold text-white">Create customer preview →</button> : null}
      {needsPublish ? <button onClick={() => onReview(item.id,"PREVIEW_APPROVE",preview?.id)} className="min-h-11 rounded-full bg-[#0c7658] px-5 text-sm font-semibold text-white">Approve and make this answer live →</button> : null}
      {needsPublish ? <button onClick={() => onReview(item.id,"PREVIEW_REJECT",preview?.id)} className="min-h-11 rounded-full border border-[var(--border)] px-4 text-sm font-semibold text-[var(--error)]">This needs correction</button> : null}
      {published ? <><span className="text-xs font-semibold text-emerald-700">✓ Approved and available to the bot</span><button onClick={() => onReview(item.id,"PAUSE")} className="text-xs font-semibold text-[var(--error)]">Pause answer</button></> : null}
      {["PAUSED","EXPIRED"].includes(item.status) ? <button onClick={() => onReview(item.id,"RECONFIRM")} className="min-h-10 rounded-full bg-[#0c7658] px-4 text-sm font-semibold text-white">Review and restore</button> : null}
      {!published ? <button onClick={() => onReview(item.id,"DELETE")} className="text-xs text-[var(--text-muted)]">Delete</button> : null}
    </div> : null}
  </article>;
}
function Status({ value }: { value: string }) { const tone = ["APPROVED","PUBLISHED","RESOLVED"].includes(value) ? "status-success" : ["CONFLICT","REJECTED","INVALID","PAUSED","EXPIRED","OPEN","CRITICAL"].includes(value) ? "status-error" : "status-warning"; return <span className={`status-pill ${tone}`}>{value.toLowerCase().replaceAll("_", " ")}</span>; }
function EmptyState({ title, copy }: { title: string; copy: string }) { return <div className="px-5 py-8 text-center"><h3 className="text-sm font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">{copy}</p></div>; }
function formatBytes(value: number) { return value < 1024 * 1024 ? `${Math.max(1, Math.round(value / 1024))} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`; }
function formatDate(value: string | Date) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
function formatDateTime(value: string | Date) { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
