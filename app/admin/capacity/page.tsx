import Link from "next/link";
import { getCapacitySnapshot } from "@/lib/capacity-advisor";

export const dynamic = "force-dynamic";
const value = (number: number | null, suffix = "") => number === null ? "Not measured" : `${number.toLocaleString("en-IN")}${suffix}`;
const toneStyle = { GREEN: "border-[#9bd2ba] bg-[#eaf7f1] text-[#17694f]", AMBER: "border-[#dec77d] bg-[#fff8df] text-[#765a0c]", RED: "border-[#e1a39e] bg-[#fff0ee] text-[#a6322a]", UNKNOWN: "border-black/15 bg-[#f5f2eb] text-[#68645c]" } as const;

export default async function CapacityPage() {
  const snapshot = await getCapacitySnapshot(), tone = snapshot.advisor.tone;
  const metrics = [
    ["Configured bots", value(snapshot.configuredBots), `${Math.round(snapshot.configuredBots / snapshot.target.bots * 100)}% of ${snapshot.target.bots} target`],
    ["Live bots", value(snapshot.liveBots), "Currently serving"],
    ["AI replies today", value(snapshot.repliesToday), `${Math.round(snapshot.repliesToday / snapshot.target.dailyReplies * 100)}% of ${snapshot.target.dailyReplies.toLocaleString("en-IN")} daily target`],
    ["Projected daily", value(snapshot.projectedDailyReplies), "Seven-day average"],
    ["Peak replies/min", value(snapshot.peakRepliesPerMinute), "Observed over seven days"],
    ["Active · 5 min", value(snapshot.activeConversations5m), "Recent open website sessions"],
    ["AI p95 latency", value(snapshot.p95LatencyMs, " ms"), "Seven-day governed answers"],
    ["Answer error rate", value(snapshot.errorPercent, "%"), "Seven-day evidence"],
    ["Queue depth", value(snapshot.queueDepth), `Oldest due: ${value(snapshot.oldestJobMinutes, " min")}`],
    ["VPS memory", value(snapshot.host.memoryPercent, "%"), `${value(snapshot.host.cpuCores)} CPU cores · load ${value(snapshot.host.load1m)}`],
    ["VPS disk", value(snapshot.host.diskPercent, "%"), "Current application filesystem"],
    ["Seven-day replies", value(snapshot.replies7d), "Traffic baseline"]
  ];
  return <main className="mx-auto max-w-[1400px] space-y-7 px-4 py-8 sm:px-8 lg:px-10">
    <header className="flex flex-col gap-4 border-b border-black/8 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="product-eyebrow">Super Admin · capacity</p><h1 className="mt-3 text-4xl font-semibold tracking-[-.05em] sm:text-5xl">Capacity & Upgrade Advisor</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#68645c]">Evidence for the first operating target: 100 bots and 10,000 AI replies daily. A short spike alone never triggers a purchase recommendation.</p></div><Link href="/admin" className="text-sm font-bold text-[#6d5310]">← Admin Today</Link></header>
    <section className={`border p-6 ${toneStyle[tone]}`}><p className="text-xs font-bold uppercase tracking-[.16em]">{tone} capacity position</p><h2 className="mt-2 text-2xl font-semibold">{tone === "GREEN" ? "Current resources have measured headroom." : tone === "AMBER" ? "Prepare or optimise before the next traffic tier." : tone === "RED" ? "Capacity action is required before further growth." : "Monitoring evidence is incomplete."}</h2><ul className="mt-4 space-y-2 text-sm leading-6">{snapshot.advisor.actions.map(action => <li key={action}>• {action}</li>)}</ul></section>
    <section className="grid overflow-hidden border border-white/70 bg-white sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label,metric,copy], index) => <div key={label} className={`p-6 ${index ? "border-t border-black/6 sm:border-l sm:border-t-0" : ""}`}><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#777168]">{label}</p><strong className="mt-3 block text-3xl">{metric}</strong><small className="mt-2 block text-[#817b72]">{copy}</small></div>)}</section>
    <section className="overflow-hidden border border-white/70 bg-white"><div className="border-b border-black/6 px-6 py-5"><p className="product-eyebrow">Decision matrix</p><h2 className="mt-2 text-2xl font-semibold">When to optimise and when to upgrade</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#f5f2eb] text-xs uppercase tracking-[.12em] text-[#68645c]"><tr><th className="px-6 py-4">Signal</th><th className="px-6 py-4">Amber</th><th className="px-6 py-4">Red</th><th className="px-6 py-4">First action</th></tr></thead><tbody className="divide-y divide-black/6">{[
      ["Bots / daily replies", "80% of target", "100% of target", "Benchmark next tier before onboarding"], ["Memory / disk", "75%", "90%", "Diagnose growth; clean storage before purchase"], ["Answer errors", "2%", "5%", "Resolve dominant failure—not a hardware fix"], ["p95 answer latency", "8 seconds", "Investigate trend", "Separate provider, DB and CPU latency"], ["Automation backlog", "50 jobs or 10 min", "30 min oldest due", "Scale a dedicated worker"]
    ].map(row => <tr key={row[0]}>{row.map(cell => <td key={cell} className="px-6 py-4">{cell}</td>)}</tr>)}</tbody></table></div></section>
    <p className="text-xs leading-5 text-[#68645c]">Measured {snapshot.measuredAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}. Host CPU load is an instantaneous diagnostic; an upgrade decision should be confirmed by sustained observation and a staged load test.</p>
  </main>;
}
