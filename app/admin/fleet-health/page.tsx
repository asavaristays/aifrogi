import { withCurrentPlatformAdminDatabaseContext } from "@/lib/admin-access";
import { readFleetKnowledgeHealth } from "@/lib/repositories/fleet-health-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FleetHealthPage() {
  const scoped = await withCurrentPlatformAdminDatabaseContext("admin-fleet-health-page",()=>readFleetKnowledgeHealth());
  if (!scoped) return null;
  const health=scoped.value;
  const ready=health.bots.filter(bot=>bot.readiness.ready).length;
  return <main className="mx-auto max-w-[1500px] space-y-7 px-4 py-8 sm:px-8 lg:px-10">
    <header className="border-b border-black/8 pb-7"><p className="product-eyebrow">Super Admin · fleet authority</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Bot Fleet Health</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#68645c]">Read-only evidence for release, factual serving, source coverage, retrieval, validation and uncertain delivery. This screen does not repair or activate bots.</p></header>
    <section className="grid overflow-hidden border border-white/70 bg-white sm:grid-cols-4">{[["Bots",health.bots.length],["Ready",ready],["Gap topics",health.gapTopics.length],["Uncertain delivery",health.deliveryUncertainty.length]].map(([label,value])=><div key={label} className="border-b border-black/6 p-6 sm:border-b-0 sm:border-r"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#777168]">{label}</p><strong className="mt-3 block text-3xl">{value}</strong></div>)}</section>
    <section className="overflow-hidden border border-white/70 bg-white"><div className="border-b border-black/6 px-6 py-5"><p className="product-eyebrow">Per-bot readiness</p><h2 className="mt-2 text-2xl font-semibold">Exact blockers, not a general green light</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-[#f5f2eb] text-[10px] uppercase tracking-[.13em] text-[#68645c]"><tr><th className="px-5 py-4">Bot</th><th className="px-5 py-4">State</th><th className="px-5 py-4">Blockers</th><th className="px-5 py-4">Website capture</th></tr></thead><tbody className="divide-y divide-black/6">{health.bots.map(bot=><tr key={bot.propertyId}><td className="px-5 py-5"><strong>{bot.propertyName}</strong><small className="block text-[#777168]">{bot.propertyId}</small></td><td className="px-5 py-5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${bot.readiness.ready?"bg-[#eaf7f1] text-[#17694f]":"bg-[#fff0ee] text-[#a6322a]"}`}>{bot.readiness.ready?"READY":"BLOCKED"}</span></td><td className="px-5 py-5">{bot.readiness.blockers.length?bot.readiness.blockers.join(" · "):"None"}</td><td className="px-5 py-5">{bot.website?`${bot.website.coveragePercent}% · ${bot.website.healthy?"HEALTHY":bot.website.alerts.join(" · ")}`:"No active website capture"}</td></tr>)}</tbody></table></div></section>
    <p className="text-xs text-[#68645c]">Generated {new Date(health.generatedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}. Private, no-store, platform-admin database context.</p>
  </main>;
}
