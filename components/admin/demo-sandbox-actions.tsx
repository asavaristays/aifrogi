"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DemoSandboxActions({ organizationId }: { organizationId?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function act(action: "PROVISION_ALL" | "RESET") {
    if (action === "RESET" && !window.confirm("Reset synthetic conversations, feedback, flags and mock connector events for this demo?")) return;
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/demo-sandboxes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, organizationId }) });
    const payload = await response.json().catch(() => null);
    setBusy(false); setMessage(response.ok ? action === "RESET" ? "Demo reset completed." : "All demo tenants provisioned." : payload?.error || "Action failed.");
    if (response.ok) router.refresh();
  }
  return <div className="flex flex-wrap items-center gap-2"><button type="button" disabled={busy} onClick={() => act(organizationId ? "RESET" : "PROVISION_ALL")} className="rounded-md bg-[#8a6a16] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Working…" : organizationId ? "Reset demo" : "Provision all demos"}</button>{message ? <span className="text-xs text-[#68645c]">{message}</span> : null}</div>;
}
