"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CustomerLifecycleActions({ organizationId, organizationStatus, botStatus }: { organizationId: string; organizationStatus: string; botStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function act(action: string, reason?: string) { setBusy(action); setError(""); const response = await fetch(`/api/admin/customers/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) }); const payload = await response.json().catch(() => null); setBusy(""); if (!response.ok) return setError(payload?.error || "Action failed"); router.refresh(); }
  function remove() { const reason = window.prompt("Reason for removing this customer from active operations:"); if (reason?.trim()) void act("REMOVE_FROM_OPERATIONS", reason.trim()); }
  return <div className="min-w-[260px]"><div className="flex flex-wrap gap-2"><Link href={`/admin/customers/${organizationId}?onboarding=ai-bot`} className="rounded-full bg-[#101010] px-3 py-2 text-[11px] font-bold text-white">Open</Link><button disabled={Boolean(busy) || botStatus === "DELETED"} onClick={() => act(botStatus === "PAUSED" ? "RESTORE" : "PAUSE")} className="rounded-full border border-[#b99a43]/45 px-3 py-2 text-[11px] font-bold text-[#6d5310] disabled:opacity-40">{botStatus === "PAUSED" ? "Restore bot" : "Pause bot"}</button><button disabled={Boolean(busy) || organizationStatus === "REMOVED"} onClick={() => act(organizationStatus === "SUSPENDED" ? "ACTIVATE" : "SUSPEND")} className="rounded-full border border-black/10 px-3 py-2 text-[11px] font-bold disabled:opacity-40">{organizationStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}</button><button disabled={Boolean(busy) || organizationStatus === "REMOVED"} onClick={remove} className="rounded-full border border-[#cf4d43]/25 px-3 py-2 text-[11px] font-bold text-[#a6322a] disabled:opacity-40">Remove</button></div>{error ? <p className="mt-2 max-w-[260px] text-[10px] text-[#a6322a]">{error}</p> : null}</div>;
}
