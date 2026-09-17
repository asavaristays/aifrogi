import { cookies } from "next/headers";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";
import { resolveMemberOrganization, withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

export const WORKSPACE_COOKIE_NAME = "leados_workspace";

export async function getCurrentWorkspaceSlug() {
  const cookieStore = await cookies();
  const requestedSlug = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value?.trim() || DEFAULT_PROPERTY_SLUG;
  const user = await getCurrentUser();
  if (!user || user.role === "admin") return requestedSlug;
  const email = user.username.trim().toLowerCase();
  const organizationId = await resolveMemberOrganization(email);
  if (!organizationId) return requestedSlug;

  return withTenantDatabaseContext({
    kind: "tenant",
    organizationId,
    actor: `workspace-resolution:${email}`
  }, async () => {
    const db = getDb();
    if (!db) return requestedSlug;
    const property = await db.property.findFirst({
      where: { slug: requestedSlug, organizationId },
      select: { slug: true }
    });
    if (property) return property.slug;

    const fallback = await db.property.findFirst({
      where: { organizationId },
      select: { slug: true },
      orderBy: { createdAt: "asc" }
    });
    return fallback?.slug || requestedSlug;
  });
}
