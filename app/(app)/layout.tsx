import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { listPropertiesForMember } from "@/lib/repositories/property-repository";
import { loadOnboardingForUser } from "@/lib/services/onboarding-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "admin") {
    redirect("/admin/customers");
  }

  const organization = await loadOnboardingForUser(user.username);
  if (!organization || organization.onboarding?.lifecycleStatus !== "LIVE") {
    redirect("/onboarding");
  }

  const [records, currentWorkspaceSlug] = await Promise.all([
    listPropertiesForMember(user.username, false),
    getCurrentWorkspaceSlug()
  ]);
  const workspaces = records.map((record) => ({
    id: record.id,
    name: record.name,
    slug: record.slug,
    status: record.whatsappIntegration?.status ?? "NOT_CONFIGURED",
    displayPhoneNumber: record.whatsappIntegration?.displayPhoneNumber ?? ""
  }));
  const selectedSlug = workspaces.some((workspace) => workspace.slug === currentWorkspaceSlug)
    ? currentWorkspaceSlug
    : workspaces[0]?.slug ?? currentWorkspaceSlug;

  return <AppShell workspaces={workspaces} currentWorkspaceSlug={selectedSlug}>{children}</AppShell>;
}
