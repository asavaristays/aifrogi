import { getDb } from "@/lib/db";

export type PlatformHealth = {
  status: "ok" | "degraded";
  service: "aifrogi";
  release: string;
  timestamp: string;
  checks: {
    database: "ok" | "unavailable";
    sessionSecret: "ok" | "misconfigured";
    publicUrl: "ok" | "misconfigured";
    metaWebhookSignature: "ok" | "not_enforced";
    legacyInboundToken: "ok" | "not_configured";
  };
};

export function getReleaseId() {
  return process.env.AIFROGI_RELEASE?.trim() || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || "development";
}

export async function getPlatformReadiness(): Promise<PlatformHealth> {
  const db = getDb();
  let database: PlatformHealth["checks"]["database"] = "unavailable";
  if (db) {
    try {
      await db.$queryRaw`SELECT 1`;
      database = "ok";
    } catch {
      database = "unavailable";
    }
  }

  const sessionSecret = process.env.AUTH_SESSION_SECRET && process.env.AUTH_SESSION_SECRET !== "change-this-in-production"
    ? "ok"
    : "misconfigured";
  const publicUrl = /^https:\/\/app\.aifrogi\.com\/?$/i.test(process.env.PUBLIC_BASE_URL?.trim() || "")
    ? "ok"
    : "misconfigured";
  const metaWebhookSignature = process.env.META_APP_SECRET?.trim() || process.env.FACEBOOK_APP_SECRET?.trim()
    ? "ok"
    : "not_enforced";
  const legacyInboundToken = process.env.LEADOS_WHATSAPP_INBOUND_TOKEN?.trim() ||
    process.env.LEADOS_AI_BOT_WEBHOOK_TOKEN?.trim() ||
    process.env.AI_BOT_AGENT_REPLY_TOKEN?.trim()
    ? "ok"
    : "not_configured";
  const checks = { database, sessionSecret, publicUrl, metaWebhookSignature, legacyInboundToken } as const;
  const status = Object.values(checks).every((check) => check === "ok") ? "ok" : "degraded";

  return {
    status,
    service: "aifrogi",
    release: getReleaseId(),
    timestamp: new Date().toISOString(),
    checks
  };
}
