import { decryptSecretValue, encryptSecretValue } from "@/lib/field-encryption";
import { getDb } from "@/lib/db";
import { isIP } from "node:net";

export const CONNECTOR_AUTH_TYPES = ["NONE", "BEARER", "API_KEY"] as const;
export type ConnectorAuthType = typeof CONNECTOR_AUTH_TYPES[number];

export type ConnectorOperationMapping = {
  health?: string;
  availability?: string;
  quote?: string;
  create?: string;
  status?: string;
  cancel?: string;
  paymentVerification?: string;
};

function safePath(value?: string | null) {
  const path = String(value || "").trim();
  if (!path) return undefined;
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("..")) throw new Error("API operation paths must start with / and cannot contain ..");
  return path.slice(0, 240);
}

export function parseConnectorApiConfiguration(input: { apiBaseUrl?: string | null; authType?: string | null; operationMapping?: ConnectorOperationMapping | null }) {
  const rawUrl = String(input.apiBaseUrl || "").trim();
  if (!rawUrl) throw new Error("Add the connector API base URL.");
  let url: URL;
  try { url = new URL(rawUrl); } catch { throw new Error("Enter a valid API base URL."); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash) throw new Error("Use a clean HTTPS API base URL without credentials, query or fragment.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || (isIP(host) && (/^(127\.|10\.|192\.168\.|169\.254\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "::1"))) throw new Error("Connector APIs must use an approved public HTTPS host.");
  const authType = String(input.authType || "BEARER").toUpperCase() as ConnectorAuthType;
  if (!CONNECTOR_AUTH_TYPES.includes(authType)) throw new Error("Select a supported API authentication method.");
  const source = input.operationMapping || {};
  const operationMapping: ConnectorOperationMapping = {
    health: safePath(source.health) || "/health",
    availability: safePath(source.availability), quote: safePath(source.quote), create: safePath(source.create), status: safePath(source.status), cancel: safePath(source.cancel), paymentVerification: safePath(source.paymentVerification)
  };
  return { apiBaseUrl: url.toString().replace(/\/$/, ""), authType, operationMapping };
}

export async function saveConnectorApiConfiguration(input: { organizationId: string; connectorKey: string; apiBaseUrl?: string | null; authType?: string | null; operationMapping?: ConnectorOperationMapping | null; secret?: string | null; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const config = parseConnectorApiConfiguration(input);
  const connector = await db.botConnectorConfiguration.findUnique({ where: { organizationId_connectorKey: { organizationId: input.organizationId, connectorKey: input.connectorKey } } });
  if (!connector) throw new Error("Connector requirement was not found for this bot persona.");
  const secret = String(input.secret || "").trim();
  if (config.authType !== "NONE" && !secret) {
    const existing = await db.botConnectorCredential.findUnique({ where: { connectorId: connector.id }, select: { id: true } });
    if (!existing) throw new Error("Add the API secret for this authentication method.");
  }
  await db.$transaction(async (tx) => {
    await tx.botConnectorConfiguration.update({ where: { id: connector.id }, data: { ...config, lifecycle: "AUTHORISED", enabled: false, lastHealthStatus: null, lastHealthCode: null, lastHealthAt: null, lastError: null, configuredBy: input.actorEmail } });
    if (secret) await tx.botConnectorCredential.upsert({ where: { connectorId: connector.id }, update: { secretEncrypted: encryptSecretValue(secret)!, updatedBy: input.actorEmail }, create: { connectorId: connector.id, secretEncrypted: encryptSecretValue(secret)!, updatedBy: input.actorEmail } });
    if (config.authType === "NONE") await tx.botConnectorCredential.deleteMany({ where: { connectorId: connector.id } });
    await tx.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "BOT_CONNECTOR_API_CONFIGURED", detail: `${connector.name}: API configuration saved; secret ${secret ? "replaced" : "retained"}.` } });
  });
}

export async function testConnectorApi(input: { organizationId: string; connectorKey: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const connector = await db.botConnectorConfiguration.findUnique({ where: { organizationId_connectorKey: { organizationId: input.organizationId, connectorKey: input.connectorKey } }, include: { credential: true } });
  if (!connector?.apiBaseUrl) throw new Error("Save the connector API configuration before testing.");
  const mapping = (connector.operationMapping || {}) as ConnectorOperationMapping;
  const target = new URL(mapping.health || "/health", `${connector.apiBaseUrl}/`);
  if (target.origin !== new URL(connector.apiBaseUrl).origin) throw new Error("Health path must remain on the configured API host.");
  const headers: Record<string, string> = { Accept: "application/json", "User-Agent": "AiFrogi-Connector-Health/1.0" };
  const secret = decryptSecretValue(connector.credential?.secretEncrypted);
  if (connector.authType === "BEARER" && secret) headers.Authorization = `Bearer ${secret}`;
  if (connector.authType === "API_KEY" && secret) headers["X-API-Key"] = secret;
  let status = 0; let error: string | null = null;
  try {
    const response = await fetch(target, { method: "GET", headers, signal: AbortSignal.timeout(8000), redirect: "error", cache: "no-store" });
    status = response.status;
    if (!response.ok) error = `Health endpoint returned HTTP ${response.status}.`;
  } catch (caught) { error = caught instanceof Error ? caught.message.slice(0, 240) : "Connector health request failed."; }
  const healthy = !error;
  await db.$transaction([
    db.botConnectorConfiguration.update({ where: { id: connector.id }, data: { lastHealthStatus: healthy ? "HEALTHY" : "FAILED", lastHealthCode: status || null, lastHealthAt: new Date(), lastError: error, lifecycle: healthy ? "CONNECTED" : connector.lifecycle, enabled: false, configuredBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: healthy ? "BOT_CONNECTOR_API_TEST_PASSED" : "BOT_CONNECTOR_API_TEST_FAILED", detail: `${connector.name}: ${healthy ? "authenticated health check passed" : error}` } })
  ]);
  return { healthy, status, message: healthy ? "Authenticated API health check passed. Map and sandbox-test operations before enabling live actions." : error };
}
