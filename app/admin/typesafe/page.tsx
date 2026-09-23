import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth-server";
import { getHotelShadowMatrix } from "@/lib/typesafe-hotel-matrix";
import { setPilotPolicy, TYPESAFE_PRICE_SOURCE } from "@/lib/typesafe-pilot-store";

export const dynamic = "force-dynamic";

async function updateHotelShadow(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") throw new Error("Super Admin required");
  const organizationId = String(formData.get("organizationId") || "");
  const enabled = formData.get("action") === "renew";
  await setPilotPolicy(organizationId, {
    enabled,
    expiresAt: new Date(Date.now() + (enabled ? 23 : 0) * 3_600_000).toISOString(),
    dailyLimit: 20
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
  const format = (value: string | Date | null) => value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value))
    : "—";

  return <main className="mx-auto max-w-6xl space-y-6 p-5 sm:p-8">
    <header>
      <p className="product-eyebrow">Super Admin · HotelGPT</p>
      <h1 className="mt-2 text-3xl font-semibold">TypeSafe usage & renewal matrix</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Advisory shadow analysis for live hotel bots. It classifies eligible, filtered English enquiries for review; it does not alter answers, bookings, payments, or approved knowledge.</p>
    </header>

    <section className="rounded-2xl bg-stone-950 p-6 text-white">
      <h2 className="text-xl font-semibold">Gateway: {configured ? "Configured for hotel shadow" : "Off / incomplete configuration"}</h2>
      <p className="mt-2 text-sm text-stone-300">A hotel sends requests only while its own 23-hour policy is active and its daily allowance remains. Sensitive or identifying messages, unsupported scripts, demos, and non-hotel bots are excluded.</p>
      <p className="mt-2 text-sm text-stone-300">Provider API-key expiry or billing renewal date is not exposed by the TypeSafe response. Check those dates in the provider account; the renewal dates below are AiFrogi hotel-policy expiries.</p>
    </section>

    <section className="overflow-x-auto rounded-2xl border bg-white">
      <div className="border-b px-6 py-5"><h2 className="text-xl font-semibold">Live hotels</h2><p className="mt-1 text-sm text-stone-500">Daily allowance: 20 attempts per hotel, UTC day. Usage and cost cover the last 7 days.</p></div>
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500"><tr>
          <th className="px-4 py-3">Hotel</th><th className="px-4 py-3">Status / renew by</th><th className="px-4 py-3">Today</th>
          <th className="px-4 py-3">7-day results</th><th className="px-4 py-3">7-day tokens / estimated cost</th><th className="px-4 py-3">Control</th>
        </tr></thead>
        <tbody className="divide-y divide-stone-100">{hotels.map((hotel) => <tr key={hotel.id}>
          <td className="px-4 py-4"><strong>{hotel.name}</strong><span className="mt-1 block text-xs text-stone-500">{hotel.slug}</span></td>
          <td className="px-4 py-4"><strong className={hotel.active && configured ? "text-emerald-700" : "text-amber-700"}>{hotel.active && configured ? "Active shadow" : "Off / expired"}</strong><span className="mt-1 block text-xs text-stone-500">{format(hotel.expiresAt)}</span></td>
          <td className="px-4 py-4">{hotel.attemptsToday}/{hotel.dailyLimit || 20}<span className="mt-1 block text-xs text-stone-500">{hotel.remainingToday} remaining</span></td>
          <td className="px-4 py-4">{hotel.observations7d} observed<span className="mt-1 block text-xs text-stone-500">{hotel.unavailable7d} unavailable · last {format(hotel.lastObservedAt)}</span></td>
          <td className="px-4 py-4">{hotel.inputTokens7d} in / {hotel.outputTokens7d} out<span className="mt-1 block text-xs text-stone-500">${hotel.estimatedUsd7d.toFixed(6)} estimated</span></td>
          <td className="px-4 py-4"><div className="flex gap-2">
            <form action={updateHotelShadow}><input type="hidden" name="organizationId" value={hotel.id}/><button type="submit" name="action" value="renew" className="rounded-lg bg-stone-900 px-3 py-2 text-xs font-semibold text-white">{hotel.active ? "Renew 23h" : "Enable 23h"}</button></form>
            {hotel.active ? <form action={updateHotelShadow}><input type="hidden" name="organizationId" value={hotel.id}/><button type="submit" name="action" value="disable" className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Disable</button></form> : null}
          </div></td>
        </tr>)}</tbody>
      </table>
      {!hotels.length ? <p className="p-6 text-sm text-stone-500">No active, live, non-demo HotelGPT tenants.</p> : null}
    </section>

    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">TypeSafe intent labels are review signals, not answer-quality scores or proof of correctness. Customer-approved knowledge still requires human review. Cost is an estimate from reported input tokens at the <a className="underline" href={TYPESAFE_PRICE_SOURCE} target="_blank" rel="noreferrer">published TypeSafe rate</a>, not a provider invoice.</p>
  </main>;
}
