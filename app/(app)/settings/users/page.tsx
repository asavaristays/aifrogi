import { redirect } from "next/navigation";
import { TeamAccessManager } from "@/components/settings/team-access-manager";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { listTeamMembers } from "@/lib/repositories/team-repository";

export const dynamic = "force-dynamic";

export default async function SettingsUsersPage() {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role)) redirect("/dashboard");
  const members = await listTeamMembers(access.organization.id);
  return <TeamAccessManager organizationName={access.organization.name} currentEmail={access.user.username} initialMembers={members.map((member) => ({ ...member, invitedAt: member.invitedAt.toISOString(), joinedAt: member.joinedAt?.toISOString() || null, lastLoginAt: member.lastLoginAt?.toISOString() || null, invitationExpiresAt: member.invitationExpiresAt?.toISOString() || null }))} />;
}
