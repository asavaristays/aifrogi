import { FlowIntelligenceWorkspace } from "@/components/knowledge/flow-intelligence-workspace";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function FlowIntelligencePage() {
  const [access, slug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const settings = await readKnowledgeSettings(slug);
  return <FlowIntelligenceWorkspace initialFlows={settings.tenantFlows || []} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}
