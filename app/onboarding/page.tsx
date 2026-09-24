import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CustomerOnboarding } from "@/components/onboarding/customer-onboarding";
import { getCurrentUser } from "@/lib/auth-server";
import { getDb } from "@/lib/db";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";

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
  const memberRole = organization?.members.find((member) => member.email.toLowerCase() === user.username.toLowerCase())?.role?.toUpperCase();
  const onboardingData = organization && property && db ? await withTenantDatabaseContext({
    kind: "tenant",
    organizationId: organization.id,
    actor: `onboarding-page:${user.username}`
  }, async () => {
    const tenantDb = getDb();
    if (!tenantDb) return { subscription: null, verification: null, confirmedAnswers: 0 };
    const [subscription, verification, confirmedAnswers] = await Promise.all([
      getOrganizationSubscriptionAccess(organization.id),
      getKnowledgeVerificationReadiness(property.id, organization.botProfile?.category === "STAY" ? "HOSPITALITY" : organization.botProfile?.category === "PINGBOOK" ? "APPOINTMENTS" : organization.botProfile?.category || "BUSINESS_AI"),
      tenantDb.knowledgeEntry.count({ where: { propertyId: property.id, status: { notIn: ["REJECTED", "SUPERSEDED"] } } })
    ]);
    return { subscription, verification, confirmedAnswers };
  }) : { subscription: null, verification: null, confirmedAnswers: 0 };
  const { verification, confirmedAnswers } = onboardingData;
  return (
    <CustomerOnboarding
      initialOrganization={organization}
      accountEmail={user.username}
      reviewReadiness={{
        knowledgeReady: confirmedAnswers > 0,
        tested: false,
        certified: false,
        canManage: memberRole === "OWNER" || memberRole === "ADMIN",
        evidence: {
          pageCount: 0,
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
