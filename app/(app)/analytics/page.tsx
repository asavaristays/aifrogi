import { AnalyticsWorkspaceView } from "@/components/analytics/analytics-workspace-view";
import { loadLeads } from "@/lib/services/lead-service";
import { buildWhatsAppMetrics } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getAiOperationsReport } from "@/lib/repositories/ai-operations-repository";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage() {
  const [propertySlug, access] = await Promise.all([getCurrentWorkspaceSlug(), resolveClientWorkspaceAccess()]);
  const leads = await loadLeads(propertySlug);
  const metrics = buildWhatsAppMetrics(leads);
  const operations = access.ok ? await getAiOperationsReport(access.propertyId) : null;

  return <AnalyticsWorkspaceView metrics={metrics} operations={operations} />;
}
