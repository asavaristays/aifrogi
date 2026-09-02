"use client";

import { useRef, useState } from "react";

type Preview = { business: Record<string, string>; faqs: Array<{ category: string; question: string; answer: string }>; warnings: string[]; fileName: string };

export function OnboardingWorkbookImport({ organizationId, onImported }: { organizationId?: string; onImported?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = organizationId ? `/api/admin/customers/${organizationId}/workbook-import` : "/api/onboarding/workbook-import";

  async function submit(action: "PREVIEW" | "APPLY") {
    if (!file) return setStatus("Choose the completed AiFrogi onboarding workbook.");
    setBusy(true); setStatus("");
    const body = new FormData(); body.set("file", file); body.set("action", action);
    const response = await fetch(endpoint, { method: "POST", body });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setStatus(data.error || "The workbook could not be processed.");
    if (action === "PREVIEW") { setPreview(data); setStatus("Preview ready. Check the business details and approved answers before importing."); }
    else { setStatus(`${data.stagedCount || 0} approved answers staged for review. Nothing was published automatically.`); setPreview(null); setFile(null); if (input.current) input.current.value = ""; onImported?.(); }
  }

  return <section className="rounded-lg border border-black/8 bg-white p-6 shadow-sm sm:p-7">
    <p className="product-eyebrow">Simple Excel onboarding</p>
    <h3 className="mt-2 text-xl font-black">Import business details and approved answers.</h3>
    <p className="mt-2 text-sm leading-6 text-[#68645c]">Download the template, complete it offline, then preview it here. The import updates approved profile fields and stages FAQs inside Intelligence for review. It never makes answers live automatically.</p>
    <div className="mt-5 flex flex-wrap gap-3">
      <a href="/downloads/AiFrogi-Simple-AI-Bot-Onboarding.xlsx" download className="inline-flex min-h-11 items-center rounded-full border border-[#d8c278] px-5 py-2.5 text-sm font-bold text-[#72550c]">↓ Download Excel template</a>
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-full bg-[#101010] px-5 py-2.5 text-sm font-bold text-white">Choose completed file<input ref={input} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); setStatus(""); }} /></label>
    </div>
    {file ? <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#f5f2eb] p-4"><span className="text-sm font-semibold">{file.name}</span><button type="button" disabled={busy} onClick={() => submit("PREVIEW")} className="rounded-full bg-[#9b7613] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Checking…" : "Validate and preview"}</button></div> : null}
    {preview ? <div className="mt-5 rounded-md border border-[#d8c278] bg-[#fffaf0] p-5">
      <div className="grid gap-3 text-sm sm:grid-cols-2"><PreviewItem label="Business" value={preview.business.name} /><PreviewItem label="Website" value={preview.business.website} /><PreviewItem label="Contact" value={preview.business.ownerName} /><PreviewItem label="Approved answers found" value={String(preview.faqs.length)} /></div>
      {preview.faqs.length ? <div className="mt-4 max-h-44 space-y-2 overflow-y-auto border-t border-black/8 pt-4">{preview.faqs.slice(0, 20).map((faq, index) => <p key={`${faq.question}-${index}`} className="text-sm"><strong>{faq.question}</strong><span className="mt-1 block text-[#68645c]">{faq.answer}</span></p>)}</div> : null}
      {preview.warnings.map((warning) => <p key={warning} className="mt-3 text-sm font-semibold text-[#8a5d00]">{warning}</p>)}
      <button type="button" disabled={busy} onClick={() => submit("APPLY")} className="mt-5 rounded-full bg-[#127451] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Importing…" : "Confirm and stage for review"}</button>
    </div> : null}
    {status ? <p role="status" className={`mt-4 text-sm font-semibold ${status.includes("could not") || status.startsWith("Choose") ? "text-red-700" : "text-[#176b50]"}`}>{status}</p> : null}
  </section>;
}

function PreviewItem({ label, value }: { label: string; value?: string }) { return <div><span className="block text-xs font-black uppercase tracking-[0.12em] text-[#766f64]">{label}</span><span className="mt-1 block font-semibold">{value || "Not supplied"}</span></div>; }
