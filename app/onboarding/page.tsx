import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerOnboarding } from "@/components/onboarding/customer-onboarding";
import { getCurrentUser } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { getMemberRoleByEmail } from "@/lib/repositories/onboarding-repository";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { readKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { getTenantKnowledgeRevision, readTenantCertification, tenantCertificationStatus } from "@/lib/tenant-intelligence/certification";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "Account onboarding | AiFrogi", robots: { index: false, follow: false } };

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin/customers");

  const organization = await loadOnboardingForUser(user.username);
  if (organization?.onboarding?.lifecycleStatus === "LIVE") redirect("/dashboard");
  const property = organization?.properties[0];
  const db = getDb();
  const [memberRole, subscription, verification, testActivity, answerEvidence, certification] = organization && property && db ? await Promise.all([
    getMemberRoleByEmail(user.username),
    getOrganizationSubscriptionAccess(organization.id),
    getKnowledgeVerificationReadiness(property.id, organization.botProfile?.category === "STAY" ? "HOSPITALITY" : organization.botProfile?.category === "PINGBOOK" ? "APPOINTMENTS" : organization.botProfile?.category || "BUSINESS_AI"),
    db.onboardingActivity.findFirst({ where: { organizationId: organization.id, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } }),
    db.sovereignAnswerEvidence.findFirst({ where: { propertyId: property.id }, select: { id: true } }),
    readTenantCertification(property.slug)
  ]) : [null, null, null, null, null, null];
  const certificationStatus = property && certification ? tenantCertificationStatus(certification, await getTenantKnowledgeRevision(property.slug)) : { eligible: false };
  const appearance = property ? await readKnowledgeSettings(property.slug) : null;
  return (
    <CustomerOnboarding
      initialOrganization={organization}
      accountEmail={user.username}
      reviewReadiness={{
        knowledgeReady: Boolean(subscription?.planCode === "TRIAL" ? verification?.trialReady : verification?.ready),
        tested: Boolean(testActivity || answerEvidence),
        certified: certificationStatus.eligible,
        canManage: memberRole === "OWNER" || memberRole === "ADMIN",
        evidence: {
          pageCount: appearance?.pageCount || 0,
          published: verification?.published || 0,
          coveragePercent: verification?.coverage.percentage || 0,
          freshnessRate: verification?.freshnessRate || 0,
          conflicts: verification?.conflicts || 0,
          unsigned: verification?.unsigned || 0,
          openFlags: verification?.openFlags || 0,
          previewPending: verification?.previewPending || 0,
          missingEssentials: verification?.essentials.missing || []
        }
      }}
    />
  );
}
