"use client";

import { useMemo, useState } from "react";
import { Bot, Building2, CheckCircle2, FileSearch, GitBranch, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";
import type { CoreFrameNodeType, CoreIntelligenceFrame } from "@/lib/sovereign-intelligence/core-intelligence-frames";

const nodeStyle: Record<CoreFrameNodeType, { color: string; icon: React.ReactNode }> = {
  DETECT_PARTS: { color: "#2563eb", icon: <GitBranch /> },
  RESOLVE_TENANT: { color: "#0f766e", icon: <Building2 /> },
  RESOLVE_PROPERTY_ID: { color: "#7c3aed", icon: <LockKeyhole /> },
  RETRIEVE_EVIDENCE: { color: "#d97706", icon: <FileSearch /> },
  APPLY_AUTHORITY: { color: "#dc2626", icon: <ShieldCheck /> },
  COMPOSE: { color: "#0891b2", icon: <Bot /> },
  VERIFY: { color: "#16a34a", icon: <CheckCircle2 /> }
};

export function CoreIntelligenceWorkflow({ frames }: { frames: CoreIntelligenceFrame[] }) {
  const [selectedKey, setSelectedKey] = useState(frames[0]?.key || "");
  const selected = useMemo(() => frames.find((frame) => frame.key === selectedKey) || frames[0], [frames, selectedKey]);
  if (!selected) return null;

  return <section className="overflow-hidden rounded-[26px] border border-black/8 bg-white shadow-sm">
    <header className="flex flex-col gap-4 border-b border-black/7 px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#173c33] text-white"><Workflow className="size-5" /></span>
        <div><p className="product-eyebrow">Platform Intelligence · read only</p><h2 className="mt-1 text-2xl font-semibold">Core Intelligence workflow</h2><p className="mt-1 max-w-3xl text-sm text-[var(--text-muted)]">The shared reasoning path used by every bot. Core controls decisions; each client’s facts remain isolated by tenant and property ID.</p></div>
      </div>
      <span className="status-pill status-success">Runtime definition</span>
    </header>
    <div className="flex gap-2 overflow-x-auto border-b border-black/7 bg-[#faf8f2] px-5 py-3">
      {frames.map((frame) => <button key={frame.key} onClick={() => setSelectedKey(frame.key)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${frame.key === selected.key ? "border-[#8a6a16] bg-[#8a6a16] text-white" : "border-black/10 bg-white hover:border-[#8a6a16]"}`}>{frame.name}</button>)}
    </div>
    <div className="bg-[#f7f4ed] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><strong>{selected.name}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{selected.description}</p></div><span className="rounded-full border border-black/10 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider">{selected.category} · {selected.nodes.length} controls</span></div>
      <div className="overflow-x-auto rounded-2xl border border-[#cbc3b0] bg-[radial-gradient(#c9c1af_1px,transparent_1px)] [background-size:20px_20px] p-7">
        <div className="flex min-w-[1380px] items-center gap-5">
          {selected.nodes.map((node, index) => <div key={node.id} className="contents">
            <article className="relative grid h-[108px] w-[170px] shrink-0 grid-cols-[42px_1fr] items-center gap-3 rounded-xl border-2 bg-white p-3 shadow-[0_8px_24px_rgba(20,20,20,.12)]" style={{ borderColor: nodeStyle[node.type].color }}>
              <span className="grid size-10 place-items-center rounded-lg text-white [&>svg]:size-5" style={{ backgroundColor: nodeStyle[node.type].color }}>{nodeStyle[node.type].icon}</span>
              <span className="min-w-0"><strong className="block text-sm leading-5">{node.label}</strong><small className="mt-1 block text-[9px] font-bold tracking-wide text-black/45">{node.type.replaceAll("_", " ")}</small></span>
              <i className="absolute -right-2 top-[44px] size-4 rounded-full border-[3px] border-[#f7f4ed]" style={{ backgroundColor: nodeStyle[node.type].color }} />
            </article>
            {index < selected.nodes.length - 1 ? <div className="relative h-[2px] w-7 shrink-0 bg-[#84785e] after:absolute after:-right-1 after:-top-[4px] after:border-y-[5px] after:border-l-[7px] after:border-y-transparent after:border-l-[#84785e]" /> : null}
          </div>)}
        </div>
      </div>
      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3"><p className="rounded-xl border bg-white p-3"><strong className="block text-[#173c33]">Shared Core</strong><span className="text-[var(--text-muted)]">Intent, authority, completeness and safety rules.</span></p><p className="rounded-xl border bg-white p-3"><strong className="block text-[#7c3aed]">Tenant boundary</strong><span className="text-[var(--text-muted)]">Organization and property ID are resolved before retrieval.</span></p><p className="rounded-xl border bg-white p-3"><strong className="block text-[#a6322a]">No direct editing</strong><span className="text-[var(--text-muted)]">Runtime changes require tested code and a separately approved deployment.</span></p></div>
    </div>
  </section>;
}
