import Link from "next/link";
import { listOrganizationsForAdmin } from "@/lib/repositories/onboarding-repository";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  const organizations = await listOrganizationsForAdmin();
  const records = await Promise.all(organizations.flatMap((organization) => organization.properties.map(async (property) => {
    const summary = await getKnowledgeWorkspaceSummary(property.slug);
    return { organization, property, summary };
  })));
  const ready = records.filter((record) => record.summary.settings.status === "READY" && record.summary.pages.length).length;
  const needsAttention = records.length - ready;

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">AI governance</p><h1 className="mt-2 text-3xl font-semibold">Customer knowledge health</h1><p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">Monitor approved sources, topic coverage, AI availability, and handoff protection across every workspace.</p></div><span className={`status-pill ${needsAttention ? "status-warning" : "status-success"}`}>{needsAttention ? `${needsAttention} need attention` : "All ready"}</span></section>

    <section className="grid gap-4 sm:grid-cols-3"><AdminMetric label="Workspaces" value={String(records.length)} helper="Customer knowledge scopes" /><AdminMetric label="Ready for AI" value={String(ready)} helper="Approved and successfully synced" /><AdminMetric label="Needs attention" value={String(needsAttention)} helper="Draft, paused, or failed" /></section>

    <section className="overflow-hidden rounded-lg border border-black/7 bg-white shadow-sm"><div className="border-b border-black/6 px-5 py-4"><p className="product-eyebrow">Knowledge registry</p><h2 className="mt-1 text-xl font-semibold">Sources and coverage</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-[#f7f9f8] text-xs text-[var(--text-muted)]"><tr><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Workspace</th><th className="px-5 py-3">Source</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Coverage</th><th className="px-5 py-3">AI</th><th className="px-5 py-3">Customer</th></tr></thead><tbody className="divide-y divide-black/6">{records.map(({ organization, property, summary }) => <tr key={property.id}><td className="px-5 py-4"><strong>{organization.name}</strong><small className="mt-1 block text-[var(--text-muted)]">{organization.plan}</small></td><td className="px-5 py-4">{property.name}</td><td className="max-w-[260px] px-5 py-4"><span className="block truncate text-xs text-[var(--text-muted)]">{summary.settings.sourceUrl}</span></td><td className="px-5 py-4"><Status value={summary.settings.status} /></td><td className="px-5 py-4"><strong>{summary.pages.length}</strong><small className="ml-1 text-[var(--text-muted)]">pages / {summary.settings.buckets.length} topics</small></td><td className="px-5 py-4"><Status value={summary.settings.approvedForAi ? "APPROVED" : "PAUSED"} /></td><td className="px-5 py-4"><Link href={`/admin/customers/${organization.id}`} className="font-semibold text-[var(--primary-strong)]">Open →</Link></td></tr>)}</tbody></table></div>{records.length ? null : <p className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">No customer workspaces are available.</p>}</section>
  </main>;
}

function AdminMetric({ label, value, helper }: { label: string; value: string; helper: string }) { return <article className="rounded-lg border border-black/7 bg-white p-5 shadow-sm"><p className="product-eyebrow">{label}</p><p className="mt-3 text-3xl font-semibold">{value}</p><p className="mt-2 text-xs text-[var(--text-muted)]">{helper}</p></article>; }
function Status({ value }: { value: string }) { const success = value === "READY" || value === "APPROVED"; const error = value === "ERROR"; return <span className={`status-pill ${success ? "status-success" : error ? "status-error" : "status-warning"}`}>{value.toLowerCase()}</span>; }

