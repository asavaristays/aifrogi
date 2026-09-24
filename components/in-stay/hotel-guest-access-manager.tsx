"use client";

import { useCallback, useEffect, useState } from "react";

type Item = { id: string; guestName: string; roomNumber: string; requestedCheckIn: string; requestedCheckOut: string; approvedCheckOut: string | null; status: string; createdAt: string };

export function HotelGuestAccessManager({ propertySlug, canManage }: { propertySlug: string; canManage: boolean }) {
  const [items, setItems] = useState<Item[]>([]);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const response = await fetch(`/api/hotelgpt-stay/access?propertySlug=${encodeURIComponent(propertySlug)}`, { cache: "no-store" });
    const body = await response.json().catch(() => null);
    if (response.ok) setItems(body?.items || []); else setNotice(body?.error || "Guest access requests could not be loaded.");
    setLoading(false);
  }, [propertySlug]);
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [load]);
  async function review(item: Item, action: "APPROVE" | "REJECT" | "REVOKE") {
    setNotice("");
    const response = await fetch("/api/hotelgpt-stay/access", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertySlug, requestId: item.id, action, approvedCheckOut: item.requestedCheckOut }) });
    const body = await response.json().catch(() => null);
    setNotice(response.ok ? `Guest access ${action.toLowerCase()}d.` : body?.error || "The request could not be updated.");
    if (response.ok) await load();
  }
  return <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="product-eyebrow">Front desk control</p><h2 className="mt-2 text-xl font-semibold">Guest access requests</h2><p className="mt-2 text-sm text-[var(--text-muted)]">Scanning never grants access automatically. Owner or admin approval is required for the verified stay window.</p></div><button type="button" onClick={() => void load()} className="rounded-md border border-black/15 px-4 py-2 text-sm font-bold">Refresh</button></div>
    {notice ? <p role="status" className="mt-4 rounded-xl bg-[#fff7df] p-3 text-sm text-[#644d12]">{notice}</p> : null}
    {loading ? <p className="mt-5 text-sm text-[var(--text-muted)]">Loading requests…</p> : !items.length ? <p className="mt-5 rounded-xl bg-[#f7f5ef] p-5 text-sm text-[var(--text-muted)]">No guest access requests yet.</p> : <div className="mt-5 space-y-3">{items.map(item => <article key={item.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-4"><div><strong>{item.guestName} · Room {item.roomNumber}</strong><p className="mt-1 text-xs text-[var(--text-muted)]">{item.status} · {new Date(item.requestedCheckIn).toLocaleDateString("en-IN")} to {new Date(item.requestedCheckOut).toLocaleString("en-IN")}</p></div>{canManage ? <div className="flex gap-2">{item.status === "PENDING" ? <><button onClick={() => void review(item, "APPROVE")} className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white">Approve</button><button onClick={() => void review(item, "REJECT")} className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Reject</button></> : item.status === "APPROVED" ? <button onClick={() => void review(item, "REVOKE")} className="rounded-md border border-red-300 px-3 py-2 text-xs font-bold text-red-700">Revoke</button> : null}</div> : null}</article>)}</div>}
  </section>;
}
