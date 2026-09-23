import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { canManageWorkspace, getCurrentClientAccess, withClientDatabaseContext } from "@/lib/client-access";
import { getKnowledgeWorkspaceSummary } from "@/lib/services/website-knowledge-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { getDb } from "@/lib/db";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const [access, propertySlug] = await Promise.all([getCurrentClientAccess(), getCurrentWorkspaceSlug()]);
  if (!access) redirect("/login");
  const { summary, governance, property, verification, subscription, testActivity } = await withClientDatabaseContext(access, "client-knowledge", async () => {
    const [summary, governance] = await Promise.all([getKnowledgeWorkspaceSummary(propertySlug), getKnowledgeGovernanceSummary(propertySlug)]);
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { organizationId: true, organization: { select: { botProfile: { select: { category: true, kbGateVersion: true, status: true } } } } } });
    const rawCategory = property?.organization?.botProfile?.category || "BUSINESS_AI";
    const category = rawCategory === "PINGBOOK" ? "APPOINTMENTS" : rawCategory === "STAY" ? "HOSPITALITY" : rawCategory;
    const verification = governance.propertyId ? await getKnowledgeVerificationReadiness(governance.propertyId, category) : null;
    const [subscription, testActivity] = property?.organizationId ? await Promise.all([
      getOrganizationSubscriptionAccess(property.organizationId),
      db.onboardingActivity.findFirst({ where: { organizationId: property.organizationId, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } })
    ]) : [null, null];
    return { summary, governance, property, verification, subscription, testActivity };
  });
  return <KnowledgeWorkspace initialSummary={{ ...summary, ...governance, verification, isTrial: subscription?.planCode === "TRIAL", kbGateEnabled: true, testComplete: Boolean(testActivity), botStatus: property?.organization?.botProfile?.status || "DRAFT" }} propertySlug={propertySlug} canManage={Boolean(access && canManageWorkspace(access.role))} />;
}
