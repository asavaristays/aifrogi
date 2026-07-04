import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";

export const SUPPORT_ACCESS_SCOPES = ["CONVERSATIONS", "DOCUMENTS", "KNOWLEDGE", "INTEGRATIONS"] as const;
export type SupportAccessScope = (typeof SUPPORT_ACCESS_SCOPES)[number];

export type SupportAccessGrant = {
  id: string;
  organizationId: string;
  scopes: SupportAccessScope[];
  reason: string;
  ticketId?: string | null;
  grantedBy: string;
  grantedAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  revokedBy?: string | null;
  active: boolean;
};

export type SupportAccessEvent = {
  id: string;
  action: string;
  actorEmail: string;
  actorRole: string;
  summary: string;
  createdAt: Date;
  metadata: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function normalizeSupportAccessScopes(input: unknown): SupportAccessScope[] {
  const values = Array.isArray(input) ? input : [];
  const normalized = values
    .map((value) => String(value || "").trim().toUpperCase())
    .filter((value): value is SupportAccessScope => SUPPORT_ACCESS_SCOPES.includes(value as SupportAccessScope));
  return Array.from(new Set(normalized));
}

export async function grantSupportAccess(input: {
  organizationId: string;
  actorEmail: string;
  actorRole: string;
  scopes: SupportAccessScope[];
  reason: string;
  durationMinutes: number;
  ticketId?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  const grantId = randomUUID();
  const now = new Date();
  const safeDuration = [30, 120, 1440].includes(input.durationMinutes) ? input.durationMinutes : 30;
  const expiresAt = new Date(now.getTime() + safeDuration * 60 * 1000);

  await db.platformAuditLog.create({
    data: {
      organizationId: input.organizationId,
      actorEmail: input.actorEmail.toLowerCase(),
      actorRole: input.actorRole,
      action: "SUPPORT_ACCESS_GRANTED",
      targetType: "SUPPORT_ACCESS",
      targetId: grantId,
      summary: `Customer granted AiFrogi support access for ${safeDuration} minutes.`,
      metadata: {
        scopes: input.scopes,
        reason: input.reason,
        ticketId: input.ticketId || null,
        expiresAt: expiresAt.toISOString()
      }
    }
  });

  return grantId;
}

export async function revokeSupportAccess(input: {
  organizationId: string;
  grantId: string;
  actorEmail: string;
  actorRole: string;
}) {
  const db = getDb();
  if (!db) return false;
  const grant = await db.platformAuditLog.findFirst({
    where: {
      organizationId: input.organizationId,
      action: "SUPPORT_ACCESS_GRANTED",
      targetType: "SUPPORT_ACCESS",
      targetId: input.grantId
    },
    select: { id: true }
  });
  if (!grant) return false;

  await db.platformAuditLog.create({
    data: {
      organizationId: input.organizationId,
      actorEmail: input.actorEmail.toLowerCase(),
      actorRole: input.actorRole,
      action: "SUPPORT_ACCESS_REVOKED",
      targetType: "SUPPORT_ACCESS",
      targetId: input.grantId,
      summary: "Customer revoked AiFrogi support access.",
      metadata: {}
    }
  });
  return true;
}

export async function listSupportAccessGrants(organizationId: string): Promise<SupportAccessGrant[]> {
  const db = getDb();
  if (!db) return [];
  const logs = await db.platformAuditLog.findMany({
    where: {
      organizationId,
      targetType: "SUPPORT_ACCESS",
      action: { in: ["SUPPORT_ACCESS_GRANTED", "SUPPORT_ACCESS_REVOKED"] }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const revocations = new Map<string, { revokedAt: Date; revokedBy: string }>();
  for (const log of logs) {
    if (log.action === "SUPPORT_ACCESS_REVOKED" && log.targetId) {
      const existing = revocations.get(log.targetId);
      if (!existing || log.createdAt > existing.revokedAt) {
        revocations.set(log.targetId, { revokedAt: log.createdAt, revokedBy: log.actorEmail });
      }
    }
  }

  return logs
    .filter((log) => log.action === "SUPPORT_ACCESS_GRANTED" && log.targetId)
    .map((log) => {
      const metadata = asRecord(log.metadata);
      const expiresAt = new Date(String(metadata.expiresAt || log.createdAt.toISOString()));
      const revoked = log.targetId ? revocations.get(log.targetId) : null;
      const scopes = normalizeSupportAccessScopes(metadata.scopes);
      return {
        id: log.targetId!,
        organizationId,
        scopes,
        reason: String(metadata.reason || "Support request"),
        ticketId: typeof metadata.ticketId === "string" ? metadata.ticketId : null,
        grantedBy: log.actorEmail,
        grantedAt: log.createdAt,
        expiresAt,
        revokedAt: revoked?.revokedAt || null,
        revokedBy: revoked?.revokedBy || null,
        active: !revoked && expiresAt > new Date() && scopes.length > 0
      };
    });
}

export async function getActiveSupportGrant(organizationId: string, scope: SupportAccessScope) {
  const grants = await listSupportAccessGrants(organizationId);
  return grants.find((grant) => grant.active && grant.scopes.includes(scope)) || null;
}

export async function hasActiveSupportAccess(organizationId: string, scope: SupportAccessScope) {
  return Boolean(await getActiveSupportGrant(organizationId, scope));
}

export async function listSupportAccessEvents(organizationId: string): Promise<SupportAccessEvent[]> {
  const db = getDb();
  if (!db) return [];
  const logs = await db.platformAuditLog.findMany({
    where: {
      organizationId,
      action: { in: ["SUPPORT_ACCESS_GRANTED", "SUPPORT_ACCESS_REVOKED", "SUPPORT_DATA_VIEWED", "SUPPORT_DATA_DENIED"] }
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return logs.map((log) => ({
    id: log.id,
    action: log.action,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    summary: log.summary,
    createdAt: log.createdAt,
    metadata: asRecord(log.metadata)
  }));
}

export async function logSupportDataAccess(input: {
  organizationId: string;
  actorEmail: string;
  scope: SupportAccessScope;
  targetType: string;
  targetId?: string | null;
  granted: boolean;
  summary?: string;
}) {
  const db = getDb();
  if (!db) return;
  await db.platformAuditLog.create({
    data: {
      organizationId: input.organizationId,
      actorEmail: input.actorEmail.toLowerCase(),
      actorRole: "ADMIN",
      action: input.granted ? "SUPPORT_DATA_VIEWED" : "SUPPORT_DATA_DENIED",
      targetType: input.targetType,
      targetId: input.targetId || null,
      summary: input.summary || (input.granted ? `Support accessed ${input.scope.toLowerCase()} data.` : `Support access denied for ${input.scope.toLowerCase()} data.`),
      metadata: { scope: input.scope }
    }
  });
}
