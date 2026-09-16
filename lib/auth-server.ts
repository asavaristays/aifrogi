import { cookies } from "next/headers";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";
import { enterPlatformDatabaseIdentity, enterTenantDatabaseIdentity, resolveSessionOrganization } from "@/lib/security/tenant-database-context";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  const user = await verifySessionToken(token);
  if (!user?.sessionId) return null;
  if (user.role === "admin") {
    enterPlatformDatabaseIdentity(user.username);
    return user;
  }
  const organizationId = await resolveSessionOrganization(user.sessionId, user.username);
  if (!organizationId) return null;
  enterTenantDatabaseIdentity(organizationId, user.username);
  return user;
}
