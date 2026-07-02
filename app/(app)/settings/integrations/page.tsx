import { TopBar } from "@/components/layout/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WhatsAppIntegrationCard } from "@/components/settings/whatsapp-integration-card";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsIntegrationsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const integration = await loadWhatsAppIntegration(propertySlug);
  const webhookBaseUrl = process.env.PUBLIC_BASE_URL || "https://leados.hotelradar.in";
  const webhookUrl = webhookBaseUrl.replace(/\/$/, "") + "/api/integrations/whatsapp/webhook";
  const connected = integration.status === "CONNECTED";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f1fbf5_0%,#ffffff_50%,#eef8f5_100%)]">
      <TopBar title="WhatsApp API" subtitle="Connect and maintain the official Meta WhatsApp Cloud API" />
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Card className="p-6 shadow-[0_18px_50px_rgba(15,61,53,0.07)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c725ba]">Connection</p>
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

        <Card className="p-6 shadow-[0_18px_50px_rgba(15,61,53,0.07)]">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#c725ba]">Webhook</p>
          <h2 className="mt-2 text-xl font-black">Meta callback URL</h2>
          <code className="mt-4 block overflow-x-auto rounded-2xl bg-[#2c243b] px-4 py-4 text-xs font-semibold text-[#b7f7d0]">{webhookUrl}</code>
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
  return <div className="rounded-2xl border border-black/5 bg-[#f2faf6] px-4 py-3 text-sm font-bold text-[#493b62]">✓ {label}</div>;
}
