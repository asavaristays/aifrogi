import type { Prisma } from "../../generated/prisma/client";
import { enterDatabaseIdentity, getBootstrapDb, getDb, withDatabaseIdentity, withDatabaseTransaction } from "@/lib/db";

export type TenantDatabaseIdentity =
  | { kind: "tenant"; organizationId: string; actor: string }
  | { kind: "platform-admin"; actor: string }
  | { kind: "system"; actor: string; purpose: string };

type OrganizationResolution = { organization_id: string };

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
  // Establish PostgreSQL-local identity from the bootstrap connection. Calling
  // getDb() here would fail closed in production before the identity exists.
  const db = getBootstrapDb();
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
  }, { maxWait: 5000, timeout: 60000 });
}

async function resolveOrganization(query: (db: NonNullable<ReturnType<typeof getDb>>) => Promise<OrganizationResolution[]>) {
  const db = getBootstrapDb();
  if (!db) throw new Error("Database unavailable.");
  const rows = await query(db);
  const organizationId = rows[0]?.organization_id?.trim();
  return organizationId || null;
}

/** Narrow SECURITY DEFINER bootstrap; it returns only the owning tenant UUID. */
export function resolvePublicBotOrganization(slug: string) {
  const normalized = clean(slug, "public bot slug");
  return resolveOrganization((db) => db.$queryRaw<OrganizationResolution[]>`
    SELECT aifrogi_security.resolve_public_bot_organization(${normalized}) AS organization_id
  `);
}

export function resolvePropertyOrganization(slug: string) {
  const normalized = clean(slug, "property slug");
  return resolveOrganization((db) => db.$queryRaw<OrganizationResolution[]>`
    SELECT aifrogi_security.resolve_property_organization(${normalized}) AS organization_id
  `);
}

/** Narrow SECURITY DEFINER bootstrap for a signed application session. */
export function resolveSessionOrganization(sessionId: string, email: string) {
  const normalizedSessionId = clean(sessionId, "session");
  const normalizedEmail = clean(email.toLowerCase(), "email");
  return resolveOrganization((db) => db.$queryRaw<OrganizationResolution[]>`
    SELECT aifrogi_security.resolve_session_organization(${normalizedSessionId}, ${normalizedEmail}) AS organization_id
  `);
}

/**
 * Resolves one active authenticated member to a tenant id before tenant RLS
 * context is established. It returns an id only; it never reads tenant data.
 */
export function resolveMemberOrganization(email: string) {
  const normalizedEmail = clean(email.toLowerCase(), "email");
  return resolveOrganization((db) => db.$queryRaw<OrganizationResolution[]>`
    SELECT aifrogi_security.resolve_member_organization(${normalizedEmail}) AS organization_id
  `);
}

export async function withPublicBotDatabaseContext<T>(slug: string, work: () => Promise<T>) {
  const organizationId = await resolvePublicBotOrganization(slug);
  if (!organizationId) return null;
  return withDatabaseIdentity({ organizationId, platformAuthority: false, actor: `public-bot:${slug}`, systemPurpose: "" }, work);
}

export async function withPropertyDatabaseContext<T>(slug: string, actor: string, work: () => Promise<T>) {
  const organizationId = await resolvePropertyOrganization(slug);
  if (!organizationId) return null;
  return withDatabaseIdentity({ organizationId, platformAuthority: false, actor: clean(actor, "actor"), systemPurpose: "" }, work);
}

export function enterTenantDatabaseIdentity(organizationId: string, actor: string) {
  enterDatabaseIdentity({ organizationId: clean(organizationId, "organization"), platformAuthority: false, actor: clean(actor, "actor"), systemPurpose: "" });
}

export function enterPlatformDatabaseIdentity(actor: string) {
  enterDatabaseIdentity({ organizationId: "", platformAuthority: true, actor: clean(actor, "actor"), systemPurpose: "platform-administration" });
}

export function withSystemDatabaseIdentity<T>(actor: string, purpose: string, work: () => Promise<T>) {
  return withTenantDatabaseContext({ kind: "system", actor: clean(actor, "actor"), purpose: clean(purpose, "purpose") }, work);
}
