"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight, Pause, Play, ShieldOff, ShieldCheck, Trash2 } from "lucide-react";
import styles from "./customer-lifecycle-actions.module.css";

export function CustomerLifecycleActions({ organizationId, organizationStatus, botStatus }: { organizationId: string; organizationStatus: string; botStatus: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function act(action: string, reason?: string) { setBusy(action); setError(""); const response = await fetch(`/api/admin/customers/${organizationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, reason }) }); const payload = await response.json().catch(() => null); setBusy(""); if (!response.ok) return setError(payload?.error || "Action failed"); router.refresh(); }
  function remove() { const reason = window.prompt("Reason for removing this customer from active operations:"); if (reason?.trim()) void act("REMOVE_FROM_OPERATIONS", reason.trim()); }
  const BotIcon = botStatus === "PAUSED" ? Play : Pause;
  const AccountIcon = organizationStatus === "SUSPENDED" ? ShieldCheck : ShieldOff;
  return <div className={styles.operations}>
    <div className={styles.grid} role="group" aria-label="Customer operations" aria-busy={Boolean(busy)}>
      <Link href={`/admin/customers/${organizationId}?onboarding=ai-bot`} className={`${styles.action} ${styles.primary}`}>Open <ArrowUpRight aria-hidden="true" /></Link>
      <button type="button" disabled={Boolean(busy) || botStatus === "DELETED"} onClick={() => act(botStatus === "PAUSED" ? "RESTORE" : "PAUSE")} className={`${styles.action} ${styles.gold}`}><BotIcon aria-hidden="true" />{botStatus === "PAUSED" ? "Restore bot" : "Pause bot"}</button>
      <button type="button" disabled={Boolean(busy) || organizationStatus === "REMOVED"} onClick={() => act(organizationStatus === "SUSPENDED" ? "ACTIVATE" : "SUSPEND")} className={`${styles.action} ${styles.neutral}`}><AccountIcon aria-hidden="true" />{organizationStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}</button>
      <button type="button" disabled={Boolean(busy) || organizationStatus === "REMOVED"} onClick={remove} className={`${styles.action} ${styles.danger}`}><Trash2 aria-hidden="true" />Remove</button>
    </div>
    {busy ? <p className={styles.status} role="status">Updating customer…</p> : null}
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
  </div>;
}
