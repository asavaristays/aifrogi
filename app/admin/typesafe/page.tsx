import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";
import { getHotelShadowMatrix } from "@/lib/typesafe-hotel-matrix";
import { setPilotPolicy } from "@/lib/typesafe-pilot-store";

export const dynamic = "force-dynamic";

async function updateHotelShadow(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Super Admin required");
  const organizationId = String(formData.get("organizationId") || "");
  const enabled = formData.get("action") === "renew";
  await setPilotPolicy(organizationId, {
    enabled, expiresAt: new Date(Date.now() + (enabled ? 23 : 0) * 3_600_000).toISOString(), dailyLimit: 20
  }, user.username);
  revalidatePath("/admin/typesafe");
}

export default async function TypeSafeHotelPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  const hotels = await getHotelShadowMatrix();
  const configured = process.env.TYPESAFE_ACTION_GATEWAY_ENABLED === "true"
    && process.env.TYPESAFE_MODE === "shadow"
    && process.env.TYPESAFE_HOTEL_SHADOW_ENABLED === "true"
    && Boolean(process.env.TYPESAFE_API_KEY);
  const total = (key: "assessed7d" | "addressed7d" | "flagged7d" | "unavailable7d") => hotels.reduce((sum, hotel) => sum + hotel[key], 0);
  const lastSuccess = hotels.map((hotel) => hotel.lastSuccessAt).filter((date): date is Date => Boolean(date)).sort((a, b) => b.getTime() - a.getTime())[0];
  const failures = hotels.filter((hotel) => hotel.latestStatus === "UNAVAILABLE");
  const apiStatus = !configured ? "Off / incomplete configuration" : failures.some((hotel) => hotel.latestHttpStatus === 401 || hotel.latestHttpStatus === 403)
    ? "Key rejected — check provider account" : failures.some((hotel) => hotel.latestHttpStatus === 429)
      ? "Provider limit reached — check renewal" : failures.length ? "Recent provider error — investigate" : lastSuccess ? "Operational" : "Configured; no successful quality check yet";
  const format = (value: string | Date | null | undefined) => value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value)) : "—";

  return <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
    <header><p className="product-eyebrow">Super Admin · HotelGPT</p>
      <h1 className="mt-2 text-3xl font-semibold">Answer quality matrix</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Advisory TypeSafe checks of saved answers for live hotels. Results never change guest replies, bookings, payments or approved knowledge.</p></header>
    <section className="rounded-2xl bg-stone-950 p-6 text-white">
      <h2 className="text-xl font-semibold">TypeSafe API: {apiStatus}</h2>
      <p className="mt-2 text-sm text-stone-300">Last successful check: {format(lastSuccess)}. API key is {process.env.TYPESAFE_API_KEY ? "present" : "missing"}; its value is never displayed.</p>
      <p className="mt-2 text-sm text-stone-300">Provider renewal date is not supplied by the TypeSafe API. Check it in the provider account. Hotel policy expiries below are separate AiFrogi safeguards, not the API renewal date.</p>
    </section>
    <section className="grid gap-3 sm:grid-cols-4">
      {[["Assessed", total("assessed7d")], ["Addressed / justified handover", total("addressed7d")], ["Flagged for human review", total("flagged7d")], ["Provider unavailable", total("unavailable7d")]].map(([label, value]) =>
        <div className="rounded-xl border bg-white p-4" key={label}><p className="text-xs text-stone-500">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}
    </section>
    <section className="overflow-x-auto rounded-2xl border bg-white">
      <div className="border-b px-6 py-5"><h2 className="text-xl font-semibold">Live hotel answer quality · last 7 days</h2><p className="mt-1 text-sm text-stone-500">Only eligible, filtered English turns are sampled; counts are not a score for all guest answers.</p></div>
      <table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr>
        <th className="px-4 py-3">Hotel</th><th className="px-4 py-3">Shadow policy</th><th className="px-4 py-3">Fit</th><th className="px-4 py-3">Grounding</th><th className="px-4 py-3">Review / API</th><th className="px-4 py-3">Control</th>
      </tr></thead><tbody className="divide-y divide-stone-100">{hotels.map((hotel) => <tr key={hotel.id}>
        <td className="px-4 py-4"><strong>{hotel.name}</strong><span className="mt-1 block text-xs text-stone-500">{hotel.slug}</span></td>
        <td className="px-4 py-4">{hotel.active && configured ? "Active" : "Off / expired"}<span className="mt-1 block text-xs text-stone-500">Expires {format(hotel.expiresAt)} · {hotel.attemptsToday}/{hotel.dailyLimit || 20} today</span></td>
        <td className="px-4 py-4">{hotel.addressed7d} addressed<span className="mt-1 block text-xs text-stone-500">{hotel.partial7d} partial · {hotel.missed7d} missed</span></td>
        <td className="px-4 py-4">{hotel.supported7d} supported<span className="mt-1 block text-xs text-stone-500">{hotel.unverified7d} lacked exact approved context</span></td>
        <td className="px-4 py-4">{hotel.flagged7d} flagged<span className="mt-1 block text-xs text-stone-500">{hotel.unavailable7d} unavailable · last {format(hotel.lastObservedAt)}</span></td>
        <td className="px-4 py-4"><div className="flex gap-2"><form action={updateHotelShadow}><input type="hidden" name="organizationId" value={hotel.id}/><button type="submit" name="action" value="renew" className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white">{hotel.active ? "Renew 23h" : "Enable 23h"}</button></form>
          {hotel.active ? <form action={updateHotelShadow}><input type="hidden" name="organizationId" value={hotel.id}/><button type="submit" name="action" value="disable" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Disable</button></form> : null}</div></td>
      </tr>)}</tbody></table>{!hotels.length ? <p className="p-6 text-sm text-stone-500">No active, live, non-demo HotelGPT tenants.</p> : null}
    </section>
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">These are review signals, not verified correctness rates. A human must review flagged answers against their exact saved evidence. TypeSafe cost is not a separate client charge.</p>
  </main>;
}
