import { AnalyticsWorkspaceView } from "@/components/analytics/analytics-workspace-view";
import { loadLeads } from "@/lib/services/lead-service";
import { buildWhatsAppMetrics } from "@/lib/whatsapp-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getAiOperationsReport } from "@/lib/repositories/ai-operations-repository";
import { resolveReportPeriod, websiteLeadsForPeriod, websiteMonthlyReport, websiteOutcomeSummary } from "@/lib/website-reporting";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [propertySlug, access, query] = await Promise.all([getCurrentWorkspaceSlug(), resolveClientWorkspaceAccess(), searchParams]);
  const period = resolveReportPeriod(query.period);
  const allLeads = await loadLeads(propertySlug);
  const leads = websiteLeadsForPeriod(allLeads, period.since);
  const metrics = buildWhatsAppMetrics(leads);
  const outcomes = websiteOutcomeSummary(leads);
  const operations = access.ok ? await getAiOperationsReport(access.propertyId, period.since) : null;

  return <AnalyticsWorkspaceView metrics={metrics} operations={operations} outcomes={outcomes} period={period} monthly={websiteMonthlyReport(allLeads)} />;
}
