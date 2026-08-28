import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AppointmentTenantSummary } from "@/lib/appointment-journey-service";

function statusTone(status: string) {
  if (status === "GOOGLE_READY") return "secondary" as const;
  if (status === "GOOGLE_ACTION_REQUIRED") return "error" as const;
  if (status.includes("GOOGLE")) return "primary" as const;
  return "tertiary" as const;
}

function statusLabel(status: string) {
  if (status === "GOOGLE_READY") return "Google ready";
  if (status === "GOOGLE_CONNECTED") return "Google connected";
  if (status === "GOOGLE_ACTION_REQUIRED") return "Action required";
  return "Setup needed";
}

export function AppointmentJourneyIntegrationCard({
  tenant,
  message
}: {
  tenant: AppointmentTenantSummary;
  message?: string | null;
}) {
  const connectHref = `/api/appointment-journey/google/oauth/start?tenantId=${encodeURIComponent(tenant.id)}&returnTo=${encodeURIComponent("/settings/integrations")}`;
  const connected = tenant.status === "GOOGLE_READY";

  return (
    <Card className="p-6 shadow-[0_18px_50px_rgba(15,61,53,0.07)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold">Appointment Journey</h3>
            <Badge tone={statusTone(tenant.status)}>{statusLabel(tenant.status)}</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
            WhatsApp appointment automation stores booking truth in AiFrogi, then mirrors confirmed operations into the connected Google Calendar and Sheet for this client workspace.
          </p>
        </div>
        <a
          href={connectHref}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--primary-strong)] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[var(--primary)]"
        >
          {tenant.hasGoogleConnection ? "Reconnect Google" : "Connect Google"}
        </a>
      </div>

      {message ? <p className="mt-4 rounded-lg border border-black/5 bg-[#f8fafc] px-4 py-3 text-sm font-semibold text-[#384152]">{message}</p> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <InfoTile label="Tenant" value={tenant.aifrogiTenantId} />
        <InfoTile label="Services" value={String(tenant.serviceCount)} />
        <InfoTile label="Bookings" value={String(tenant.bookingCount)} />
        <InfoTile label="Timezone" value={tenant.timezone} />
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <ResourceTile
          label="Calendar"
          value={tenant.calendarId || "Not created yet"}
          href={tenant.calendarId && tenant.calendarId !== "primary" ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(tenant.calendarId)}` : null}
          ready={connected && Boolean(tenant.calendarId)}
        />
        <ResourceTile
          label="Sheet"
          value={tenant.sheetId || "Not created yet"}
          href={tenant.sheetId ? `https://docs.google.com/spreadsheets/d/${tenant.sheetId}/edit` : null}
          ready={connected && Boolean(tenant.sheetId)}
        />
      </div>
    </Card>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/5 bg-[var(--surface-soft)] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-2 truncate text-sm font-bold text-[#1f2937]">{value}</p>
    </div>
  );
}

function ResourceTile({
  label,
  value,
  href,
  ready
}: {
  label: string;
  value: string;
  href: string | null;
  ready: boolean;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-[#fbfdfc] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p>
          <p className="mt-2 break-all text-sm font-semibold text-[#1f2937]">{value}</p>
        </div>
        <Badge tone={ready ? "secondary" : "neutral"}>{ready ? "Ready" : "Pending"}</Badge>
      </div>
      {href ? <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[var(--primary-strong)]">Open {label}</a> : null}
    </div>
  );
}
