import { getCurrentUser } from "@/lib/auth-server";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";

export type PlatformAdminUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function getCurrentPlatformAdmin() {
  const user = await getCurrentUser();
  return user?.role === "admin" ? user : null;
}

/** Explicit platform authority for every post-authentication Super Admin query. */
export function withPlatformAdminDatabaseContext<T>(user: PlatformAdminUser, surface: string, work: () => Promise<T>) {
  if (user.role !== "admin") throw new Error("Super Admin database authority is required.");
  return withTenantDatabaseContext({ kind: "platform-admin", actor: `${surface}:${user.username}` }, work);
}

export async function withCurrentPlatformAdminDatabaseContext<T>(surface: string, work: (user: PlatformAdminUser) => Promise<T>) {
  const user = await getCurrentPlatformAdmin();
  if (!user) return null;
  const value = await withPlatformAdminDatabaseContext(user, surface, () => work(user));
  return { user, value };
}
