import { FlowIntelligenceWorkspace } from "@/components/knowledge/flow-intelligence-workspace";
import { canManageWorkspace, getCurrentClientAccess, withClientDatabaseContext } from "@/lib/client-access";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function FlowIntelligencePage() {
  const [access, slug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const settings = access ? await withClientDatabaseContext(access,"client-flow-intelligence",()=>readKnowledgeSettings(slug)) : await readKnowledgeSettings(slug);
  return <div className="flow-premium"><FlowIntelligenceWorkspace initialFlows={settings.tenantFlows || []} canManage={Boolean(access && canManageWorkspace(access.role))} botCategory={access?.organization.botProfile?.category || ""} /></div>;
}
