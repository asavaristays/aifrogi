import { getDb } from "@/lib/db";

export const CASTLE_PILOT_TENANT = "cmu2dcedu003284kxjotchehs";
// Direct-provider published price, verified 2026-09-20. Estimate, not invoice.
export const TYPESAFE_PRICE_SOURCE = "https://typesafe.ai/blog/introducing-system-one-models-and-jev";
export const estimatedTypesafeUsd = (inputTokens: number) => Math.max(0, inputTokens) * 0.042 / 1_000_000;
export type PilotPolicy = { enabled: boolean; expiresAt: string; dailyLimit: number };
export function validPilotPolicy(value: unknown, now = Date.now()): value is PilotPolicy {
  const p = value as PilotPolicy | null;
  return Boolean(p && p.enabled === true && Number.isFinite(Date.parse(p.expiresAt)) && Date.parse(p.expiresAt) > now && Number.isInteger(p.dailyLimit) && p.dailyLimit > 0 && p.dailyLimit <= 20);
}
const controlAction = "TYPESAFE_PILOT_CONTROL";
const attemptAction = "TYPESAFE_SHADOW_RESERVED";

export async function setPilotPolicy(organizationId: string, policy: PilotPolicy, actor: string) {
  if (organizationId !== CASTLE_PILOT_TENANT) throw new Error("Only Castle Mandawa is authorized for this pilot");
  if (policy.enabled && (!validPilotPolicy(policy) || Date.parse(policy.expiresAt) > Date.now() + 86400_000)) throw new Error("Pilot must expire within 24 hours with at most 20 daily attempts");
  const db = getDb(); if (!db) throw new Error("Database unavailable");
  return db.$transaction(async tx => {
    const locked = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext('typesafe-pilot'), hashtext(${organizationId})) AS acquired`;
    if (!locked[0]?.acquired) throw new Error("Pilot busy; retry control change");
    return tx.platformAuditLog.create({ data: { organizationId, actorEmail: actor, actorRole: "ADMIN", action: controlAction, targetType: "TypeSafePilot", targetId: organizationId, summary: policy.enabled ? "Bounded shadow pilot enabled" : "Shadow pilot disabled", metadata: policy } });
  });
}

/** Reserve before transmission. Failed requests count; missing state/errors fail closed. */
export async function reservePilotAttempt(organizationId: string) {
  if (organizationId !== CASTLE_PILOT_TENANT) return false;
  const db = getDb(); if (!db) return false;
  try {
    return await db.$transaction(async tx => {
      const locked = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext('typesafe-pilot'), hashtext(${organizationId})) AS acquired`;
      if (!locked[0]?.acquired) return false;
      const latest = await tx.platformAuditLog.findFirst({ where: { organizationId, action: controlAction }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
      const now = Date.now();
      if (!validPilotPolicy(latest?.metadata, now)) return false;
      const start = new Date(new Date(now).toISOString().slice(0, 10));
      const attempts = await tx.platformAuditLog.count({ where: { organizationId, action: attemptAction, createdAt: { gte: start } } });
      // Include pre-v2 observations only; later observations correspond to reservations.
      const legacy = await tx.platformAuditLog.count({ where: { organizationId, action: "TYPESAFE_SHADOW_OBSERVED", createdAt: { gte: start }, NOT: { metadata: { path: ["version"], equals: "typesafe-shadow-v2" } } } });
      const recent = await tx.platformAuditLog.findFirst({ where: { organizationId, action: attemptAction, createdAt: { gte: new Date(now - 10_000) } } });
      if (recent || attempts + legacy >= latest.metadata.dailyLimit) return false;
      await tx.platformAuditLog.create({ data: { organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: attemptAction, targetType: "TypeSafePilot", targetId: organizationId, summary: "Budget reserved before advisory transmission; no customer text stored", metadata: { version: "typesafe-shadow-v2" } } });
      return true;
    }, { timeout: 2000, maxWait: 1000 });
  } catch { return false; }
}

export async function getPilotReport(organizationId = CASTLE_PILOT_TENANT) {
  const db = getDb(); if (!db) throw new Error("Database unavailable");
  const since = new Date(Date.now() - 7 * 86400_000);
  const control = await db.platformAuditLog.findFirst({ where: { organizationId, action: controlAction }, orderBy: [{ createdAt: "desc" }, { id: "desc" }] });
  const rows = await db.platformAuditLog.findMany({ where: { organizationId, action: "TYPESAFE_SHADOW_OBSERVED", createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 500, select: { id: true, createdAt: true, metadata: true } });
  const samples = rows.map(row => ({ id: row.id, at: row.createdAt.toISOString(), ...(row.metadata as Record<string, unknown>) }));
  const values = samples.map(s => s as Record<string, unknown>);
  const sum = (key: string) => values.reduce((n, s) => n + (typeof s[key] === "number" ? s[key] as number : 0), 0);
  const latency = values.map(s => Number(s.latencyMs) || 0).sort((a,b) => a-b);
  return { policy: control?.metadata || null, active: validPilotPolicy(control?.metadata), samples, count: samples.length, unavailable: values.filter(s => s.status !== "OBSERVED").length,
    inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens"), p95Ms: latency.length ? latency[Math.ceil(latency.length * .95)-1] : null,
    estimatedUsd: estimatedTypesafeUsd(sum("inputTokens")), priceSource: TYPESAFE_PRICE_SOURCE,
    costStatus: "Estimated USD at $0.042 / million input tokens; output free. Rate verified 2026-09-20. Excludes unreported usage, taxes and contract differences.", assessment: samples.length < 30 ? "INSUFFICIENT_LIVE_EVIDENCE" : "HUMAN_REVIEW_REQUIRED" };
}
