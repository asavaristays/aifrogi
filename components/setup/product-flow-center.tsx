import Link from "next/link";
import type { ProductFlow, ProductFlowOwner, ProductFlowStage } from "@/lib/product-flow";

const ownerStyles: Record<ProductFlowOwner, string> = {
  Customer: "bg-[#eaf3ff] text-[#1c5eaa]",
  AiFrogi: "bg-[#f8f0d8] text-[#6d5310]",
  Meta: "bg-[#fff4df] text-[#8a5318]"
};

const statusStyles = {
  complete: "bg-[#e8f7f1] text-[#126452]",
  current: "bg-[#f8f0d8] text-[#6d5310]",
  waiting: "bg-[#f8f0d8] text-[#68645c]",
  blocked: "bg-[#fff0f0] text-[#a3322c]"
};

export function ProductFlowCenter({ flow, mode = "client" }: { flow: ProductFlow; mode?: "client" | "admin" }) {
  return <div className="space-y-6">
    <section className="overflow-hidden rounded-lg bg-[#101010] text-white shadow-[var(--shadow-soft)]">
      <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1fr_280px] lg:items-center lg:px-8">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#e2c66d]">{flow.phase}</span><span className="text-xs text-white/48">{flow.completedCount} of {flow.totalCount} stages proven</span></div>
          <p className="mt-6 text-xs font-semibold text-white/50">Next operating milestone</p>
          <h2 className="mt-2 text-3xl font-semibold">{flow.headline}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/66">{flow.summary}</p>
          {flow.nextAction && mode === "client" ? <Link href={flow.nextAction.href} className="mt-6 inline-flex min-h-11 items-center rounded-md bg-[#8a6a16] px-4 text-sm font-semibold text-white hover:bg-[#b28728]">{flow.nextAction.action}<span aria-hidden="true" className="ml-2">→</span></Link> : null}
        </div>
        <div>
          <div className="flex items-end justify-between"><strong className="text-4xl font-semibold">{flow.progressPercent}%</strong><span className="text-xs text-white/50">Operating readiness</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#b28728]" style={{ width: `${flow.progressPercent}%` }} /></div>
          <p className="mt-4 text-xs leading-5 text-white/48">Progress moves only when AiFrogi finds operating evidence.</p>
        </div>
      </div>
    </section>

    <section className="rounded-lg border border-[var(--border)] bg-white shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--border)] px-6 py-5"><p className="product-eyebrow">End-to-end flow</p><h2 className="mt-2 text-xl font-semibold">From account creation to repeatable growth</h2></div>
      <ol className="divide-y divide-[var(--border)]">{flow.stages.map((item, index) => <StageRow key={item.id} stage={item} index={index} mode={mode} />)}</ol>
    </section>

    <section aria-labelledby="responsibility-title">
      <div><p className="product-eyebrow">Responsibility map</p><h2 id="responsibility-title" className="mt-2 text-xl font-semibold">Who needs to move next</h2></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <ResponsibilityLane title="Customer actions" helper="Business decisions and approvals" owner="Customer" items={flow.customerActions} mode={mode} />
        <ResponsibilityLane title="AiFrogi actions" helper="Configuration, evidence, and recovery" owner="AiFrogi" items={flow.platformActions} mode={mode} />
        <ResponsibilityLane title="External dependencies" helper="Meta review, billing, and policy" owner="Meta" items={flow.externalDependencies} mode={mode} />
      </div>
    </section>
  </div>;
}

function StageRow({ stage, index, mode }: { stage: ProductFlowStage; index: number; mode: "client" | "admin" }) {
  const content = <>
    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${statusStyles[stage.status]}`}>{stage.status === "complete" ? "✓" : index + 1}</span>
    <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><strong className="text-sm">{stage.label}</strong><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ownerStyles[stage.owner]}`}>{stage.owner}</span></span><span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{stage.evidence}</span></span>
    <span className={`status-pill ${statusStyles[stage.status]}`}>{stage.status}</span>
    {mode === "client" && stage.status !== "complete" ? <span aria-hidden="true" className="text-[var(--primary-strong)]">→</span> : null}
  </>;
  return <li>{mode === "client" && stage.status !== "complete" ? <Link href={stage.href} className="flex min-h-20 items-center gap-4 px-6 py-4 hover:bg-[#fbfaf7]">{content}</Link> : <div className="flex min-h-20 items-center gap-4 px-6 py-4">{content}</div>}</li>;
}

function ResponsibilityLane({ title, helper, owner, items, mode }: { title: string; helper: string; owner: ProductFlowOwner; items: ProductFlowStage[]; mode: "client" | "admin" }) {
  return <div className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-[var(--shadow-card)]">
    <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs text-[var(--text-muted)]">{helper}</p></div><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${ownerStyles[owner]}`}>{items.length}</span></div>
    <div className="mt-5 space-y-2">{items.length ? items.map((item) => mode === "client" ? <Link key={item.id} href={item.href} className="block rounded-md border border-[var(--border)] px-3 py-3 hover:border-[#ded8cb] hover:bg-[#fbfaf7]"><strong className="block text-xs">{item.action}</strong><span className="mt-1 block text-[11px] leading-4 text-[var(--text-muted)]">{item.evidence}</span></Link> : <div key={item.id} className="rounded-md border border-[var(--border)] px-3 py-3"><strong className="block text-xs">{item.action}</strong><span className="mt-1 block text-[11px] leading-4 text-[var(--text-muted)]">{item.evidence}</span></div>) : <p className="rounded-md bg-[#f5fbf8] px-3 py-4 text-xs font-semibold text-[var(--success)]">No action waiting</p>}</div>
  </div>;
}
