import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { canServeWebsiteBot } from "@/lib/website-bot-lifecycle";

export const AGENT_GATEWAY_SCOPES = ["profile:read", "availability:read"] as const;
export type AgentGatewayScope = typeof AGENT_GATEWAY_SCOPES[number];

const TOKEN_PREFIX = "afg_ag_";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cleanLabel(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, 80) : "";
}

export function bearerAgentToken(request: Request) {
  const value = request.headers.get("authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7).trim() : "";
}

export async function listAgentGatewayClients(organizationId: string) {
  const db = getDb();
  if (!db) return [];
  return db.agentGatewayClient.findMany({
    where: { organizationId },
    select: { id: true, label: true, scopes: true, enabled: true, lastUsedAt: true, expiresAt: true, revokedAt: true, createdAt: true },
    orderBy: { createdAt: "desc" }
  });
}

export async function issueAgentGatewayClient(input: { organizationId: string; actorEmail: string; label: unknown }) {
  const label = cleanLabel(input.label);
  if (!label) throw new Error("Give this external agent credential a clear label.");
  const db = getDb();
  if (!db) throw new Error("Agent Gateway is temporarily unavailable.");
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  const client = await db.$transaction(async (tx) => {
    const profile = await tx.botProfile.findUnique({ where: { organizationId: input.organizationId }, select: { status: true, channels: true } });
    if (!profile || !canServeWebsiteBot(profile.status, profile.channels)) throw new Error("Make the Website Bot live before enabling Agent Gateway access.");
    const created = await tx.agentGatewayClient.create({ data: { organizationId: input.organizationId, label, tokenHash: hashToken(token), scopes: [...AGENT_GATEWAY_SCOPES], createdBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "CLIENT_ADMIN", action: "AGENT_GATEWAY_CLIENT_CREATED", targetType: "AgentGatewayClient", targetId: created.id, summary: `Read-only Agent Gateway credential created for ${label}. Secret value was shown once and was not logged.`, metadata: { scopes: created.scopes } } });
    return created;
  });
  return { client: { id: client.id, label: client.label, scopes: client.scopes, createdAt: client.createdAt }, token };
}

export async function setAgentGatewayClientState(input: { organizationId: string; actorEmail: string; id: string; enabled: boolean }) {
  const db = getDb();
  if (!db) throw new Error("Agent Gateway is temporarily unavailable.");
  const client = await db.agentGatewayClient.findFirst({ where: { id: input.id, organizationId: input.organizationId } });
  if (!client) throw new Error("Agent credential was not found in this workspace.");
  const updated = await db.$transaction(async (tx) => {
    const item = await tx.agentGatewayClient.update({ where: { id: client.id }, data: input.enabled ? { enabled: true, revokedAt: null, revokedBy: null } : { enabled: false, revokedAt: new Date(), revokedBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "CLIENT_ADMIN", action: input.enabled ? "AGENT_GATEWAY_CLIENT_ENABLED" : "AGENT_GATEWAY_CLIENT_REVOKED", targetType: "AgentGatewayClient", targetId: client.id, summary: `Agent Gateway credential ${input.enabled ? "enabled" : "revoked"}: ${client.label}.`, metadata: { scopes: client.scopes } } });
    return item;
  });
  return { id: updated.id, enabled: updated.enabled, revokedAt: updated.revokedAt };
}

export async function authorizeAgentGatewayRequest(input: { organizationId: string; request: Request; scope: AgentGatewayScope }) {
  const rawToken = bearerAgentToken(input.request);
  if (!rawToken || !rawToken.startsWith(TOKEN_PREFIX)) return null;
  const db = getDb();
  if (!db) return null;
  const tokenHash = hashToken(rawToken);
  const client = await db.agentGatewayClient.findFirst({ where: { organizationId: input.organizationId, tokenHash, enabled: true, revokedAt: null, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, select: { id: true, tokenHash: true, label: true, scopes: true } });
  if (!client || !client.scopes.includes(input.scope)) return null;
  // Keep a constant-time equality check even though the database lookup is indexed.
  if (!timingSafeEqual(Buffer.from(client.tokenHash), Buffer.from(tokenHash))) return null;
  await db.agentGatewayClient.update({ where: { id: client.id }, data: { lastUsedAt: new Date() } });
  return client;
}

export function agentGatewayHeaders() {
  return {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Vary": "Authorization"
  };
}
