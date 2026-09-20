import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";
import { CASTLE_PILOT_TENANT, getPilotReport, setPilotPolicy } from "@/lib/typesafe-pilot-store";

export const dynamic = "force-dynamic";
async function disablePilot() {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Super Admin required");
  await setPilotPolicy(CASTLE_PILOT_TENANT, { enabled: false, expiresAt: new Date().toISOString(), dailyLimit: 20 }, user.username);
  revalidatePath("/admin/typesafe");
}
export default async function TypeSafePilotPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  const report = await getPilotReport();
  const policy = report.policy as { expiresAt?: string; dailyLimit?: number } | null;
  const configured = process.env.TYPESAFE_ACTION_GATEWAY_ENABLED === "true" && process.env.TYPESAFE_MODE === "shadow" && Boolean(process.env.TYPESAFE_API_KEY) && (process.env.TYPESAFE_SHADOW_ORGANIZATIONS || "").split(",").includes(CASTLE_PILOT_TENANT);
  return <main className="mx-auto max-w-6xl space-y-6 p-8">
    <header><p className="product-eyebrow">Super Admin · controlled evaluation</p><h1 className="mt-2 text-3xl font-semibold">TypeSafe shadow pilot</h1><p className="mt-3 text-sm text-stone-600">Castle Mandawa only. Observation does not change answers, booking or payment authority. No raw customer messages are displayed or stored in this telemetry.</p></header>
    <section className="rounded-2xl bg-stone-950 p-6 text-white"><h2 className="text-xl">{report.active && configured ? "Shadow enabled" : "Off / expired / not configured"}</h2><p className="mt-2">Expiry: {policy?.expiresAt || "Not configured"} · Daily cap: {policy?.dailyLimit || 0}</p><p className="mt-2 text-sm text-stone-300">Database reservations survive restarts. New requests stop immediately after disable; an already-dispatched request may finish.</p><form action={disablePilot}><button className="mt-5 rounded-lg bg-red-700 px-5 py-3 font-semibold">Disable pilot now</button></form></section>
    <section className="grid gap-4 sm:grid-cols-4">{[["Observations (last 7 days)",report.count],["Unavailable",report.unavailable],["p95 added latency",report.p95Ms === null ? "No data" : `${report.p95Ms} ms`],["Tokens input / output",`${report.inputTokens} / ${report.outputTokens}`]].map(([label,value]) => <div key={label} className="rounded-xl border bg-white p-5"><p className="text-sm text-stone-600">{label}</p><strong className="mt-2 block text-xl">{value}</strong></div>)}</section>
    <p className="rounded-xl border bg-amber-50 p-4 text-sm">{report.assessment}. Label agreement is not accuracy. Raw questions are not retained here, so human-labelled synthetic evaluations are required. Estimated usage cost: ${report.estimatedUsd.toFixed(6)}. {report.costStatus} <a className="underline" href={report.priceSource} target="_blank" rel="noreferrer">Pricing source</a>. No routing activation is available.</p>
    <div className="overflow-auto rounded-xl border bg-white"><table className="w-full text-left text-sm"><thead><tr>{["Time","Primary intent","TypeSafe intent","Status","Confidence","Latency"].map(label => <th key={label} className="p-3">{label}</th>)}</tr></thead><tbody>{report.samples.map(sample => { const s = sample as Record<string, unknown>; return <tr key={String(s.id)} className="border-t">{[s.at,s.primaryIntent,s.intent,s.status,s.confidence,`${s.latencyMs} ms`].map((value,index) => <td key={index} className="p-3">{String(value ?? "—")}</td>)}</tr>; })}</tbody></table>{!report.count && <p className="p-6">No live observations yet. Synthetic connectivity tests are not counted as live traffic.</p>}</div>
  </main>;
}
