import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { listPropertiesForMember } from "@/lib/repositories/property-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import type { ClientAccessRole } from "@/lib/client-access";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { canOpenClientWorkspace } from "@/lib/workspace-access";
import { getMemberDepartment } from "@/lib/in-stay-access";
import { getDb } from "@/lib/db";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { LEVEL_ONE_JOB } from "@/lib/sovereign-intelligence/level-one";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/admin/customers");
  }

  const organization = await loadOnboardingForUser(user.username);
  // Verified automatic trials need access to Intelligence to repair a failed
  // capture before the public bot is live. This does not grant serving rights.
  const automaticTrial = organization?.status === "ONBOARDING" && organization.botProfile?.category === "STAY" && organization.members.some(member => member.email.toLowerCase() === user.username.toLowerCase() && member.status === "ACTIVE")
    ? await withTenantDatabaseContext({ kind: "tenant", organizationId: organization.id, actor: `trial-workspace:${user.username}` }, () => getDb()!.automationJob.findFirst({ where: { actionType: LEVEL_ONE_JOB, property: { organizationId: organization.id } }, select: { id: true } }))
    : null;
  if (!organization || (!canOpenClientWorkspace(organization) && !automaticTrial)) {
    redirect("/onboarding");
  }

  const [records, currentWorkspaceSlug, subscriptionAccess] = await Promise.all([
    listPropertiesForMember(user.username, false),
    getCurrentWorkspaceSlug(),
    getOrganizationSubscriptionAccess(organization.id)
  ]);
  const workspaces = records.map((record) => ({
    id: record.id,
    name: record.name,
    slug: record.slug,
    status: record.organization?.botProfile?.status ?? "NOT_CONFIGURED",
    displayPhoneNumber: ""
  }));
  const selectedSlug = workspaces.some((workspace) => workspace.slug === currentWorkspaceSlug)
    ? currentWorkspaceSlug
    : workspaces[0]?.slug ?? currentWorkspaceSlug;
  const membership = organization.members.find((member) => member.email.toLowerCase() === user.username.toLowerCase());
  const accessRole = (membership?.role || "AGENT").toUpperCase() as ClientAccessRole;
  const department = await getMemberDepartment(membership?.id, organization.id);

  return <AppShell
    workspaces={workspaces}
    currentWorkspaceSlug={selectedSlug}
    accessRole={accessRole}
    department={department}
    enabledChannels={organization.botProfile?.channels || []}
    botCategory={organization.botProfile?.category || ""}
    subscriptionAccess={subscriptionAccess ? {
      planCode: subscriptionAccess.planCode,
      status: subscriptionAccess.status,
      daysLeft: subscriptionAccess.daysLeft,
      paused: subscriptionAccess.paused,
      message: subscriptionAccess.message
    } : null}
  >{children}</AppShell>;
}
