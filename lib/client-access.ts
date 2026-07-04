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

export type ClientWorkspaceAccessResult =
  | {
      ok: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["user"];
      organization: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["organization"];
      role: ClientAccessRole;
      property: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["organization"]["properties"][number];
      propertySlug: string;
      propertyId: string;
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      error: string;
    };

export async function resolveClientWorkspaceAccess(input?: {
  propertySlug?: string | null;
  requireManage?: boolean;
}): Promise<ClientWorkspaceAccessResult> {
  const access = await getCurrentClientAccess();
  if (!access) {
    return { ok: false, status: 401, error: "Sign in with a customer workspace account." };
  }

  if (input?.requireManage && !canManageWorkspace(access.role)) {
    return { ok: false, status: 403, error: "Owner or admin access is required for this workspace action." };
  }

  const requestedSlug = input?.propertySlug?.trim();
  const property = requestedSlug
    ? access.organization.properties.find((item) => item.slug === requestedSlug)
    : access.organization.properties[0];

  if (requestedSlug && !property) {
    return { ok: false, status: 403, error: "You do not have access to this workspace." };
  }

  if (!property) {
    return { ok: false, status: 404, error: "No workspace is available for your account." };
  }

  return {
    ok: true,
    user: access.user,
    organization: access.organization,
    role: access.role,
    property,
    propertySlug: property.slug,
    propertyId: property.id
  };
}
