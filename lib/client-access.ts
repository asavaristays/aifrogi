import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";

export type ClientAccessRole = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

export async function getCurrentClientAccess() {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return null;
  const organization = await getOrganizationForMember(user.username);
  if (!organization) return null;
  const membership = organization.members.find((member) => member.email.toLowerCase() === user.username.toLowerCase());
  const role = (membership?.role || "AGENT").toUpperCase() as ClientAccessRole;
  return { user, organization, membership, role };
}

export function canManageWorkspace(role: ClientAccessRole) {
  return role === "OWNER" || role === "ADMIN";
}

