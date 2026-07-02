import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const summary = await getKnowledgeWorkspaceSummary(propertySlug);
  return <KnowledgeWorkspace initialSummary={summary} propertySlug={propertySlug} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}

