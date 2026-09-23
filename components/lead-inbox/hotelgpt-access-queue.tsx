"use client";

import { useCallback, useEffect, useState } from "react";

type Item = {
  id: string;
  guestName: string;
  roomNumber: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  approvedCheckOut: string | null;
  status: string;
  createdAt: string;
};

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function HotelGptAccessQueue({ propertySlug }: { propertySlug: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [canApprove, setCanApprove] = useState(false);
  const [notice, setNotice] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [checkoutById, setCheckoutById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const response = await fetch(`/api/hotelgpt-stay/access?propertySlug=${encodeURIComponent(propertySlug)}`, { cache: "no-store" });
    if (!response.ok) return;
    const body = await response.json();
    const nextItems: Item[] = body.items || [];
    setItems(nextItems);
    setCanApprove(Boolean(body.canApprove));
    setCheckoutById((current) => {
      const next = { ...current };
      for (const item of nextItems) next[item.id] ||= toLocalDateTime(item.approvedCheckOut || item.requestedCheckOut);
      return next;
    });
  }, [propertySlug]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 20_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function act(item: Item, action: "APPROVE" | "REJECT" | "REVOKE") {
    const approvedCheckOut = action === "APPROVE" ? new Date(checkoutById[item.id]).toISOString() : undefined;
    const reason = action === "REJECT" ? "Please contact the front desk to verify your stay details." : undefined;
    setBusyId(item.id);
    setNotice("");
    const response = await fetch("/api/hotelgpt-stay/access", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertySlug, requestId: item.id, action, approvedCheckOut, reason }),
    });
    const body = await response.json().catch(() => null);
    setBusyId(null);
    setNotice(response.ok ? `Guest access ${action.toLowerCase()}d.` : body?.error || "Action failed.");
    if (response.ok) await load();
  }

  if (!items.length) return null;

  return (
    <section className="mx-4 mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white text-slate-900 shadow-sm">
      <header className="flex items-center justify-between border-b border-amber-200 px-4 py-3">
        <div>
          <strong>Resident access requests</strong>
          <p className="text-xs text-slate-600">Verify the guest at the front desk. A QR scan alone never grants in-stay access.</p>
        </div>
        <span className="rounded-full bg-amber-200 px-3 py-1 text-xs font-bold">{items.filter((item) => item.status === "PENDING").length} pending</span>
      </header>
      {notice ? <p className="px-4 pt-3 text-sm" role="status">{notice}</p> : null}
      <div className="divide-y divide-amber-200">
        {items.slice(0, 20).map((item) => (
          <article key={item.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <strong>{item.guestName} · Room {item.roomNumber}</strong>
              <p className="mt-1 text-xs text-slate-600">Check-in {new Date(item.requestedCheckIn).toLocaleDateString("en-IN")} · Requested checkout {new Date(item.requestedCheckOut).toLocaleString("en-IN")} · <b>{item.status}</b></p>
            </div>
            {canApprove ? (
              <div className="flex flex-wrap items-end gap-2">
                {item.status === "PENDING" ? (
                  <>
                    <label className="grid gap-1 text-xs font-semibold text-slate-700">
                      Approved checkout
                      <input className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" type="datetime-local" value={checkoutById[item.id] || ""} onChange={(event) => setCheckoutById((current) => ({ ...current, [item.id]: event.target.value }))} />
                    </label>
                    <button disabled={busyId === item.id || !checkoutById[item.id]} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" onClick={() => void act(item, "APPROVE")}>Approve verified stay</button>
                    <button disabled={busyId === item.id} className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50" onClick={() => void act(item, "REJECT")}>Reject</button>
                  </>
                ) : item.status === "APPROVED" ? (
                  <button disabled={busyId === item.id} className="rounded-lg border border-red-700 px-3 py-2 text-xs font-bold text-red-800 disabled:opacity-50" onClick={() => void act(item, "REVOKE")}>Revoke access</button>
                ) : null}
              </div>
            ) : <span className="text-xs text-slate-500">Owner or admin approval required</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
