import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const [summary, governance] = await Promise.all([getKnowledgeWorkspaceSummary(propertySlug), getKnowledgeGovernanceSummary(propertySlug)]);
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug: propertySlug }, select: { organization: { select: { botProfile: { select: { category: true, kbGateVersion: true } } } } } }) : null;
  const rawCategory = property?.organization?.botProfile?.category || "BUSINESS_AI";
  const category = rawCategory === "PINGBOOK" ? "APPOINTMENTS" : rawCategory === "STAY" ? "HOSPITALITY" : rawCategory;
  const verification = governance.propertyId ? await getKnowledgeVerificationReadiness(governance.propertyId, category) : null;
  return <KnowledgeWorkspace initialSummary={{ ...summary, ...governance, verification, kbGateEnabled: Boolean(property?.organization?.botProfile?.kbGateVersion) }} propertySlug={propertySlug} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}
