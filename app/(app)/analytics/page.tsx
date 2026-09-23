import { AnalyticsWorkspaceView } from "@/components/analytics/analytics-workspace-view";
import { loadLeads } from "@/lib/services/lead-service";
import { buildConversationMetrics } from "@/lib/conversation-metrics";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { getAiOperationsReport } from "@/lib/repositories/ai-operations-repository";
import { resolveReportPeriod, websiteLeadsForPeriod, websiteMonthlyReport, websiteOutcomeSummary } from "@/lib/website-reporting";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const [propertySlug, access, query] = await Promise.all([getCurrentWorkspaceSlug(), resolveClientWorkspaceAccess(), searchParams]);
  if (!access.ok) redirect("/login");
  const period = resolveReportPeriod(query.period);
  const [allLeads, operations] = await withTenantDatabaseContext({kind:"tenant",organizationId:access.organization.id,actor:`client-analytics:${access.user.username}`},()=>Promise.all([
    loadLeads(propertySlug),
    getAiOperationsReport(access.propertyId, period.since)
  ]));
  const leads = websiteLeadsForPeriod(allLeads, period.since);
  const metrics = buildConversationMetrics(leads);
  const outcomes = websiteOutcomeSummary(leads);

  return <AnalyticsWorkspaceView metrics={metrics} operations={operations} outcomes={outcomes} period={period} monthly={websiteMonthlyReport(allLeads)} />;
}
