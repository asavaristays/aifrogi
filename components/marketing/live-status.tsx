"use client";

import { useEffect, useState } from "react";

type HealthState = "checking" | "operational" | "unavailable";

export function LiveStatus() {
  const [state, setState] = useState<HealthState>("checking");
  const [checkedAt, setCheckedAt] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const response = await fetch("/api/health/live", { cache: "no-store" });
        const health = await response.json() as { status?: string };
        if (active) setState(response.ok && health.status === "ok" ? "operational" : "unavailable");
      } catch {
        if (active) setState("unavailable");
      } finally {
        if (active) setCheckedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    }

    void check();
    const interval = window.setInterval(check, 60_000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  const label = state === "checking" ? "Checking" : state === "operational" ? "Operational" : "Needs investigation";
  const color = state === "operational" ? "bg-[#178665]" : state === "unavailable" ? "bg-[#c44545]" : "bg-[#a86312]";

  return (
    <div className="border-y border-black/10" aria-live="polite">
      <div className="flex items-center justify-between gap-5 py-6">
        <div><h2 className="font-bold">AiFrogi web application and API</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Live reachability check from this page.</p></div>
        <div className="shrink-0 text-right"><p className="flex items-center justify-end gap-2 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</p>{checkedAt ? <p className="mt-1 text-[10px] text-[var(--text-muted)]">Checked {checkedAt}</p> : null}</div>
      </div>
      <div className="flex items-center justify-between gap-5 border-t border-black/10 py-6">
        <div><h2 className="font-bold">WhatsApp Business Platform</h2><p className="mt-1 text-sm text-[var(--text-muted)]">Operated independently by Meta.</p></div>
        <a href="https://metastatus.com/" target="_blank" rel="noreferrer" className="shrink-0 text-sm font-bold text-[#6d5310]">Meta status ↗</a>
      </div>
    </div>
  );
}
