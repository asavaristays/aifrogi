"use client";

import { useState, type FormEvent } from "react";
import { WebsiteBotEmbed } from "@/components/website-bot/website-bot-embed";
import type { WidgetMenuConfig } from "@/lib/widget-menu";

export function HotelGptResidentEntry({ slug, propertyName, botName, themeColor, widgetTheme, logoUrl, menu }: { slug: string; propertyName: string; botName: string; themeColor: string; widgetTheme: "dark" | "light" | "system"; logoUrl: string; menu: WidgetMenuConfig }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/public/hotelgpt-stay/${encodeURIComponent(slug)}/session`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(data)) });
    const body = await response.json().catch(() => null) as { stayAccessToken?: string; error?: string } | null;
    if (response.ok && body?.stayAccessToken) setToken(body.stayAccessToken); else setError(body?.error || "Stay access could not be started.");
    setLoading(false);
  }

  if (token) return <main className="min-h-dvh bg-[#050505] px-3 py-4 sm:px-6 sm:py-8"><div className="mx-auto min-h-[calc(100dvh-2rem)] max-w-[460px] sm:min-h-[calc(100dvh-4rem)]"><WebsiteBotEmbed slug={slug} botName={botName} welcomeMessage={`Welcome to ${propertyName}. How can we help during your stay?`} themeColor={themeColor} widgetTheme={widgetTheme} logoUrl={logoUrl} menu={menu} stayAccessToken={token} /></div></main>;
  return <main className="grid min-h-dvh place-items-center bg-[#06141c] px-4 py-10 text-white"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0b2532] p-6 shadow-2xl sm:p-8"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#e7c66c]">HotelGPT resident concierge</p><h1 className="mt-3 text-3xl font-semibold">Welcome to {propertyName}</h1><p className="mt-3 text-sm leading-6 text-white/70">Enter your stay details to use guest assistance during the submitted stay period. This is guest-declared access and does not verify a booking.</p><form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-semibold">Room number<input name="roomNumber" required maxLength={24} autoComplete="off" className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-black" /></label><label className="block text-sm font-semibold">Guest name<input name="guestName" required maxLength={100} autoComplete="name" className="mt-2 w-full rounded-xl border border-white/15 bg-white px-4 py-3 text-black" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-semibold">Check-in<input name="checkIn" type="date" required className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-black" /></label><label className="block text-sm font-semibold">Checkout<input name="checkOut" type="date" required className="mt-2 w-full rounded-xl border border-white/15 bg-white px-3 py-3 text-black" /></label></div>{error ? <p role="alert" className="rounded-xl bg-red-950/60 p-3 text-sm text-red-100">{error}</p> : null}<button disabled={loading} className="w-full rounded-xl bg-[#e7c66c] px-4 py-3 font-bold text-[#10202a] disabled:opacity-60">{loading ? "Starting…" : "Start guest assistance"}</button></form><p className="mt-5 text-xs leading-5 text-white/55">Do not share passwords, payment PINs, door codes or identification documents in chat. Sensitive requests may require confirmation by hotel staff.</p></section></main>;
}
