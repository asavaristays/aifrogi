import type { Prisma } from "../../generated/prisma/client";
import { getDb, withDatabaseTransaction } from "@/lib/db";

export type TenantDatabaseIdentity =
  | { kind: "tenant"; organizationId: string; actor: string }
  | { kind: "platform-admin"; actor: string }
  | { kind: "system"; actor: string; purpose: string };

function clean(value: string, field: string) {
  const normalized = value.trim();
  if (!normalized || normalized.length > 200 || /[\u0000-\u001f]/.test(normalized)) {
    throw new Error(`Invalid database ${field}.`);
  }
  return normalized;
}

/**
 * Runs all repository calls in one transaction with PostgreSQL-local tenant
 * identity. SET LOCAL semantics prevent identity leaking through the pool.
 */
export async function withTenantDatabaseContext<T>(identity: TenantDatabaseIdentity, work: () => Promise<T>) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const actor = clean(identity.actor, "actor");
  return db.$transaction(async (tx) => {
    const organizationId = identity.kind === "tenant" ? clean(identity.organizationId, "organization") : "";
    const platformAuthority = identity.kind === "platform-admin" || identity.kind === "system" ? "true" : "false";
    const systemPurpose = identity.kind === "system" ? clean(identity.purpose, "purpose") : "";
    await tx.$queryRaw`SELECT set_config('app.organization_id', ${organizationId}, true)`;
    await tx.$queryRaw`SELECT set_config('app.platform_authority', ${platformAuthority}, true)`;
    await tx.$queryRaw`SELECT set_config('app.security_actor', ${actor}, true)`;
    await tx.$queryRaw`SELECT set_config('app.system_purpose', ${systemPurpose}, true)`;
    return withDatabaseTransaction(tx as Prisma.TransactionClient, work);
  });
}

