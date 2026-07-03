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
  const checks = { database, sessionSecret, publicUrl } as const;
  const status = Object.values(checks).every((check) => check === "ok") ? "ok" : "degraded";

  return {
    status,
    service: "aifrogi",
    release: getReleaseId(),
    timestamp: new Date().toISOString(),
    checks
  };
}
