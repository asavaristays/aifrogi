import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { getDb } from "@/lib/db";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  const [summary, governance] = await Promise.all([getKnowledgeWorkspaceSummary(propertySlug), getKnowledgeGovernanceSummary(propertySlug)]);
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug: propertySlug }, select: { organizationId: true, organization: { select: { botProfile: { select: { category: true, kbGateVersion: true, status: true } } } } } }) : null;
  const rawCategory = property?.organization?.botProfile?.category || "BUSINESS_AI";
  const category = rawCategory === "PINGBOOK" ? "APPOINTMENTS" : rawCategory === "STAY" ? "HOSPITALITY" : rawCategory;
  const verification = governance.propertyId ? await getKnowledgeVerificationReadiness(governance.propertyId, category) : null;
  const [subscription, testActivity] = property?.organizationId && db ? await Promise.all([
    getOrganizationSubscriptionAccess(property.organizationId),
    db.onboardingActivity.findFirst({ where: { organizationId: property.organizationId, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } })
  ]) : [null, null];
  return <KnowledgeWorkspace initialSummary={{ ...summary, ...governance, verification, isTrial: subscription?.planCode === "TRIAL", kbGateEnabled: true, testComplete: Boolean(testActivity), botStatus: property?.organization?.botProfile?.status || "DRAFT" }} propertySlug={propertySlug} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}
