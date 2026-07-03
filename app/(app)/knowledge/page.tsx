import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const [summary, governance] = await Promise.all([getKnowledgeWorkspaceSummary(propertySlug), getKnowledgeGovernanceSummary(propertySlug)]);
  return <KnowledgeWorkspace initialSummary={{ ...summary, ...governance }} propertySlug={propertySlug} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}
