import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AppointmentJourneyIntegrationCard } from "@/components/settings/appointment-journey-integration-card";
import { WhatsAppIntegrationCard } from "@/components/settings/whatsapp-integration-card";
import { getAppointmentTenantForProperty } from "@/lib/appointment-journey-service";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsIntegrationsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const propertySlug = await getCurrentWorkspaceSlug();
  const [integration, appointmentResult, params] = await Promise.all([
    loadWhatsAppIntegration(propertySlug),
    getAppointmentTenantForProperty(propertySlug),
    (searchParams ?? Promise.resolve({})) as Promise<Record<string, string | string[] | undefined>>
  ]);
  const webhookBaseUrl = process.env.PUBLIC_BASE_URL || "https://leados.hotelradar.in";
  const webhookUrl = webhookBaseUrl.replace(/\/$/, "") + "/api/integrations/whatsapp/webhook";
  const connected = integration.status === "CONNECTED";
  const googleStatus = Array.isArray(params.appointment_google) ? params.appointment_google[0] : params.appointment_google;
  const googleDetail = Array.isArray(params.appointment_google_detail) ? params.appointment_google_detail[0] : params.appointment_google_detail;
  const appointmentMessage = googleStatus === "connected"
    ? "Google Calendar and the Appointment Journey Sheet are connected for this client."
    : googleStatus === "action_required"
      ? `Google connected, but resource setup needs attention: ${googleDetail || "review API scopes and enabled services."}`
      : googleStatus === "failed"
        ? `Google connection failed: ${googleDetail || "try reconnecting."}`
        : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f1fbf5_0%,#ffffff_50%,#eef8f5_100%)]">
      <TopBar title="WhatsApp API" subtitle="Connect and maintain the official Meta WhatsApp Cloud API" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="p-6 shadow-[0_18px_50px_rgba(15,61,53,0.07)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a6a16]">Connection</p>
              <h2 className="mt-2 text-2xl font-black">Meta Cloud API</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Credentials are scoped to this WhatsApp Business number.</p>
            </div>
            <Badge tone={connected ? "secondary" : "error"}>{connected ? "Connected" : "Not connected"}</Badge>
          </div>
        </Card>

        <WhatsAppIntegrationCard
          integration={integration}
          twilioAccountSid=""
          twilioTestTo=""
          webhookUrl={webhookUrl}
          twilioReady={false}
        />

        {appointmentResult.tenant ? (
          <AppointmentJourneyIntegrationCard tenant={appointmentResult.tenant} message={appointmentMessage} />
        ) : (
          <Card className="p-6">
            <h3 className="text-xl font-extrabold">Appointment Journey</h3>
            <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{appointmentResult.error || "Appointment Journey could not load."}</p>
          </Card>
        )}

        <Card className="p-6 shadow-[0_18px_50px_rgba(15,61,53,0.07)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a6a16]">Webhook</p>
          <h2 className="mt-2 text-xl font-black">Meta callback URL</h2>
          <code className="mt-4 block overflow-x-auto rounded-2xl bg-[#101010] px-4 py-4 text-xs font-semibold text-[#b7f7d0]">{webhookUrl}</code>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Checklist label="Subscribe to messages" />
            <Checklist label="Use a permanent system-user token" />
            <Checklist label="Keep two-step verification enabled" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Checklist({ label }: { label: string }) {
  return <div className="rounded-2xl border border-black/5 bg-[#f2faf6] px-4 py-3 text-sm font-bold text-[#404040]">✓ {label}</div>;
}
