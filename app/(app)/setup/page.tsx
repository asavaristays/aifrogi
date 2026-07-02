import { TopBar } from "@/components/layout/top-bar";
import { WhatsAppSetupWizard } from "@/components/setup/whatsapp-setup-wizard";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { loadWhatsAppIntegration } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SetupPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const [integration, workspace] = await Promise.all([
    loadWhatsAppIntegration(propertySlug),
    getPropertyBySlug(propertySlug)
  ]);
  const baseUrl = process.env.PUBLIC_BASE_URL || "https://leados.hotelradar.in";
  const webhookUrl = baseUrl.replace(/\/$/, "") + "/api/integrations/whatsapp/webhook";

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#eefaf3_0%,#ffffff_48%,#edf8f5_100%)]">
      <TopBar title="Setup" subtitle="Configure a WhatsApp Business workspace from connection to go-live" />
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <WhatsAppSetupWizard
          integration={integration}
          webhookUrl={webhookUrl}
          workspaceName={workspace?.name ?? propertySlug}
          workspaceSlug={propertySlug}
        />
      </div>
    </div>
  );
}
