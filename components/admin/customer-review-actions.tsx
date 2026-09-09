"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CustomerReviewActions({ organizationId, organizationStatus }: { organizationId: string; organizationStatus: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function run(action: string) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/admin/customers/${organizationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason })
    });
    const payload = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setError(payload?.error || "Action could not be completed");
      return;
    }
    setReason("");
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-black">Review actions</h2>
      <p className="mt-2 text-sm text-[#68645c]">Suspend access temporarily or retire the customer from active operations. Every action remains audited.</p>
      <textarea className="mt-4 min-h-24 w-full rounded-md border border-black/10 bg-[#f8faf9] px-3 py-3 text-sm outline-none focus:border-[#8a6a16]" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason required when removing from operations" />
      {error ? <p className="mt-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button tone="surface" disabled={saving} onClick={() => run(organizationStatus === "SUSPENDED" ? "ACTIVATE" : "SUSPEND")}>{organizationStatus === "SUSPENDED" ? "Reactivate" : "Suspend"}</Button>
        <Button tone="danger" disabled={saving || !reason.trim() || organizationStatus === "REMOVED"} onClick={() => run("REMOVE_FROM_OPERATIONS")}>Remove from operations</Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#68645c]">Suspend blocks account operation temporarily. Remove retires the AI Bot and removes the customer from active operations while preserving an auditable record.</p>
    </section>
  );
}
