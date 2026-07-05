import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AuditPage() {
  const db = getDb();
  const logs = db ? await db.platformAuditLog.findMany({
    include: { organization: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200
  }) : [];
  const systemCount = logs.filter((log) => log.actorRole === "SYSTEM").length;
  const customerCount = logs.filter((log) => Boolean(log.organizationId)).length;

  return <main className="mx-auto max-w-7xl space-y-6 px-4 py-7 sm:px-8">
    <section><p className="product-eyebrow">Operator accountability</p><h1 className="mt-2 text-3xl font-semibold">Platform audit trail</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">Plan changes, invoices, incidents, support access, and automatic trial pauses stay attributable without exposing customer message content.</p></section>
    <section className="grid gap-4 sm:grid-cols-3"><Metric label="Recent records" value={String(logs.length)} /><Metric label="Customer-scoped" value={String(customerCount)} /><Metric label="System actions" value={String(systemCount)} /></section>
    <section className="overflow-hidden border border-black/7 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#f7f9f8] text-xs text-[var(--text-muted)]"><tr><th className="px-5 py-3">Time</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Actor</th><th className="px-5 py-3">Summary</th></tr></thead><tbody className="divide-y divide-black/6">{logs.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-5 py-4 text-xs text-[var(--text-muted)]">{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(log.createdAt)}</td><td className="px-5 py-4"><strong className="text-xs">{log.action.replaceAll("_", " ")}</strong></td><td className="px-5 py-4">{log.organization?.name || "Platform"}</td><td className="px-5 py-4"><span className="block">{log.actorEmail}</span><small className="text-[var(--text-muted)]">{log.actorRole}</small></td><td className="max-w-xl px-5 py-4 leading-6">{log.summary}</td></tr>)}</tbody></table></div>{!logs.length ? <p className="px-5 py-12 text-center text-sm text-[var(--text-muted)]">No platform audit records yet.</p> : null}</section>
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="border border-black/7 bg-white p-5 shadow-sm"><p className="product-eyebrow">{label}</p><p className="mt-3 text-2xl font-semibold">{value}</p></div>;
}
