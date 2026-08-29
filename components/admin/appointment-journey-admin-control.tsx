"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AppointmentJourneyAdminWorkspace } from "@/lib/appointment-journey-service";

export function AppointmentJourneyAdminControl({
  organizationId,
  workspaces
}: {
  organizationId?: string;
  workspaces: AppointmentJourneyAdminWorkspace[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  async function update(workspace: AppointmentJourneyAdminWorkspace, enabled: boolean) {
    setSavingId(workspace.propertyId);
    setError("");
    const response = await fetch(organizationId ? `/api/admin/customers/${organizationId}` : "/api/admin/appointment-journey", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: enabled ? "ENABLE_APPOINTMENT_JOURNEY" : "DISABLE_APPOINTMENT_JOURNEY",
        propertyId: workspace.propertyId
      })
    });
    const payload = await response.json().catch(() => null);
    setSavingId("");
    if (!response.ok) {
      setError(payload?.error || "Appointment Journey could not be updated.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-black/6 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <CalendarCheck className="mt-0.5 size-5 text-[#6d5310]" aria-hidden="true" />
        <div>
          <p className="product-eyebrow">Product access</p>
          <h2 className="mt-2 text-lg font-black">Appointment Journey</h2>
          <p className="mt-2 text-sm leading-6 text-[#68645c]">Enable the product after the workspace WhatsApp API is connected. The client can then connect Google from Settings.</p>
        </div>
      </div>

      <div className="mt-5 divide-y divide-black/5 border-y border-black/5">
        {workspaces.map((workspace) => {
          const enabled = workspace.appointmentStatus !== "DISABLED";
          const whatsappReady = workspace.whatsappStatus === "CONNECTED";
          return (
            <div key={workspace.propertyId} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-sm">{workspace.propertyName}</strong>
                  <Badge tone={whatsappReady ? "secondary" : "error"}>WhatsApp {whatsappReady ? "connected" : "not connected"}</Badge>
                  <Badge tone={workspace.googleReady ? "secondary" : enabled ? "primary" : "neutral"}>
                    {workspace.googleReady ? "Google ready" : enabled ? "Awaiting Google" : "Disabled"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-[#68645c]">{workspace.propertySlug}{workspace.whatsappNumber ? ` · ${workspace.whatsappNumber}` : ""}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {enabled && !workspace.googleReady && workspace.tenantId ? (
                  <a
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-black/8 bg-white px-4 py-2.5 text-sm font-bold text-[#2b2b2b] hover:bg-[#fbfaf7]"
                    href={`/api/appointment-journey/google/oauth/start?tenantId=${encodeURIComponent(workspace.tenantId)}&returnTo=${encodeURIComponent(organizationId ? `/admin/customers/${organizationId}` : "/admin/appointments")}`}
                  >
                    Connect Google
                  </a>
                ) : null}
                <Button
                  tone={enabled ? "danger" : "primary"}
                  iconLeft={enabled ? <PowerOff className="size-4" aria-hidden="true" /> : <Power className="size-4" aria-hidden="true" />}
                  disabled={savingId === workspace.propertyId || (!enabled && !whatsappReady)}
                  title={!enabled && !whatsappReady ? "Connect WhatsApp before enabling Appointment Journey" : undefined}
                  onClick={() => update(workspace, !enabled)}
                >
                  {savingId === workspace.propertyId ? "Saving..." : enabled ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          );
        })}
        {!workspaces.length ? <p className="py-4 text-sm text-[#68645c]">No client workspace is available.</p> : null}
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-[#a3342b]">{error}</p> : null}
    </section>
  );
}
