import Link from "next/link";
import { DemoSandboxActions } from "@/components/admin/demo-sandbox-actions";
import { getDb } from "@/lib/db";
import { DEMO_FIXTURES } from "@/lib/demo-sandbox/fixtures";

export const dynamic = "force-dynamic";

export default async function DemoSandboxesPage() {
  const db = getDb();
  const organizations = db ? await db.organization.findMany({ where: { isDemo: true }, orderBy: { demoKey: "asc" }, include: { botProfile: true, botConnectors: true, demoSandbox: { include: { connectorEvents: { orderBy: { createdAt: "desc" }, take: 5 } } }, properties: { take: 1 } } }) : [];
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="product-eyebrow">Isolated test estate</p><h1 className="mt-2 text-3xl font-black">Persona Demo Sandboxes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#68645c]">Eight synthetic tenants use the production Sovereign Intelligence runtime with mock connectors. They never send external messages, create real transactions, or share analytics with client tenants.</p></div><DemoSandboxActions /></div>
    <section className="mt-7 grid gap-5 lg:grid-cols-2">{organizations.map((organization) => {
      const fixture = organization.demoKey ? DEMO_FIXTURES[organization.demoKey as keyof typeof DEMO_FIXTURES] : null;
      const property = organization.properties[0];
      const successes = organization.demoSandbox?.connectorEvents.filter((event) => event.status === "SUCCEEDED").length || 0;
      const failures = organization.demoSandbox?.connectorEvents.filter((event) => event.status !== "SUCCEEDED").length || 0;
      return <article key={organization.id} className="rounded-xl border border-black/8 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#f8f0d8] px-2.5 py-1 text-[10px] font-black uppercase text-[#8a6a16]">Demo · Synthetic</span><span className="rounded-full bg-[#e9f7f1] px-2.5 py-1 text-[10px] font-black uppercase text-[#16794a]">{organization.demoSandbox?.status || "Missing"}</span></div><h2 className="mt-3 text-xl font-black">{organization.botProfile?.personaName}</h2><p className="mt-1 text-sm text-[#68645c]">{organization.name}</p></div><span className="font-mono text-xs text-[#8a6a16]">v{organization.demoSandbox?.fixtureVersion}</span></div>
        <p className="mt-4 text-sm leading-6 text-[#5e594f]">{fixture?.intro}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center"><Metric label="Knowledge" value={fixture?.facts.length || 0}/><Metric label="Mock success" value={successes}/><Metric label="Safe failure" value={failures}/></div>
        <div className="mt-4 rounded-md bg-[#101010] p-4 text-xs leading-5 text-white/75"><strong className="text-[#e2c66d]">Failure test:</strong> {fixture?.failurePrompt}</div>
        <div className="mt-4 flex flex-wrap items-center gap-3">{property ? <Link href={`/bot/${property.slug}`} target="_blank" className="rounded-md bg-[#101010] px-4 py-2 text-sm font-semibold text-white">Open demo bot</Link> : null}<Link href={`/admin/customers/${organization.id}`} className="text-sm font-semibold text-[#8a6a16]">Review configuration</Link><DemoSandboxActions organizationId={organization.id}/></div>
        <p className="mt-4 text-[11px] text-[#8a8174]">Last reset: {organization.demoSandbox?.lastResetAt ? organization.demoSandbox.lastResetAt.toLocaleString("en-IN") : "not yet"} · resets {organization.demoSandbox?.resetCount || 0}</p>
      </article>;
    })}</section>
    {!organizations.length ? <div className="mt-8 rounded-xl border border-dashed border-[#8a6a16]/40 bg-[#f8f0d8] p-8 text-center"><p className="font-semibold">No isolated persona demos are provisioned.</p><p className="mt-2 text-sm text-[#68645c]">Use “Provision all demos” to create the eight synthetic tenants.</p></div> : null}
  </main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-md border border-black/7 bg-[#fafafa] p-3"><p className="text-xl font-black">{value}</p><p className="mt-1 text-[10px] uppercase tracking-[.1em] text-[#68645c]">{label}</p></div>; }
