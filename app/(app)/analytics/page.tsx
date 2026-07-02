import { AnalyticsWorkspaceView } from "@/components/analytics/analytics-workspace-view";
import { loadLeads } from "@/lib/services/lead-service";
import { buildWhatsAppMetrics, filterWhatsAppLeads } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const leads = filterWhatsAppLeads(await loadLeads(propertySlug));
  const metrics = buildWhatsAppMetrics(leads);

  return <AnalyticsWorkspaceView metrics={metrics} />;
}
