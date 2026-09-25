import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { getOrganizationSubscriptionAccess, type SubscriptionAccessState } from "@/lib/subscription-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getMemberDepartment, type InStayDepartment } from "@/lib/in-stay-access";

export type ClientAccessRole = "OWNER" | "ADMIN" | "AGENT" | "VIEWER";

export async function getCurrentClientAccess() {
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return null;
  const organization = await getOrganizationForMember(user.username);
  if (!organization) return null;
  const membership = organization.members.find((member) => member.email.toLowerCase() === user.username.toLowerCase());
  const role = (membership?.role || "AGENT").toUpperCase() as ClientAccessRole;
  const department = await getMemberDepartment(membership?.id, organization.id);
  return { user, organization, membership, role, department };
}

export function canManageWorkspace(role: ClientAccessRole) {
  return role === "OWNER" || role === "ADMIN";
}

/**
 * Keep every post-authentication tenant query inside one explicit database
 * transaction. Next layouts and pages do not share AsyncLocalStorage reliably,
 * so callers must not depend on the identity established while resolving the
 * session or membership.
 */
export function withClientDatabaseContext<T>(
  access: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>,
  surface: string,
  work: () => Promise<T>
) {
  return withTenantDatabaseContext({
    kind: "tenant",
    organizationId: access.organization.id,
    actor: `${surface}:${access.user.username}`
  }, work);
}

export type ClientWorkspaceAccessResult =
  | {
      ok: true;
      user: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["user"];
      organization: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["organization"];
      role: ClientAccessRole;
      department: InStayDepartment | null;
      property: NonNullable<Awaited<ReturnType<typeof getCurrentClientAccess>>>["organization"]["properties"][number];
      propertySlug: string;
      propertyId: string;
      subscriptionAccess: SubscriptionAccessState | null;
    }
  | {
      ok: false;
      status: 401 | 402 | 403 | 404;
      error: string;
    };

export async function resolveClientWorkspaceAccess(input?: {
  propertySlug?: string | null;
  requireManage?: boolean;
  requireActiveSubscription?: boolean;
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

  const subscriptionAccess = await withClientDatabaseContext(access, "client-access", () => getOrganizationSubscriptionAccess(access.organization.id));
  if (input?.requireActiveSubscription && subscriptionAccess && !subscriptionAccess.canUsePaidActions) {
    return { ok: false, status: 402, error: subscriptionAccess.message };
  }

  return {
    ok: true,
    user: access.user,
    organization: access.organization,
    role: access.role,
    department: access.department,
    property,
    propertySlug: property.slug,
    propertyId: property.id,
    subscriptionAccess
  };
}

export async function withCurrentClientDatabaseContext<T>(
  surface: string,
  input: Parameters<typeof resolveClientWorkspaceAccess>[0],
  work: (access: Extract<ClientWorkspaceAccessResult, { ok: true }>) => Promise<T>
) {
  const access = await resolveClientWorkspaceAccess(input);
  if (!access.ok) return access;
  const value = await withTenantDatabaseContext({
    kind: "tenant",
    organizationId: access.organization.id,
    actor: `${surface}:${access.user.username}`
  }, () => work(access));
  return { ok: true as const, access, value };
}
