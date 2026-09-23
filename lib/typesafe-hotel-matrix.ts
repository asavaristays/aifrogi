import { getDb } from "@/lib/db";
import { estimatedTypesafeUsd, validPilotPolicy, type PilotPolicy } from "@/lib/typesafe-pilot-store";

type Observation = { createdAt: Date; metadata: unknown };

export function summarizeHotelShadow(policy: unknown, attemptsToday: number, observations: Observation[], now = new Date()) {
  const current = policy as PilotPolicy | null;
  const active = validPilotPolicy(current, now.getTime());
  const inputTokens = observations.reduce((sum, row) => sum + Math.max(0, Number((row.metadata as Record<string, unknown> | null)?.inputTokens) || 0), 0);
  const outputTokens = observations.reduce((sum, row) => sum + Math.max(0, Number((row.metadata as Record<string, unknown> | null)?.outputTokens) || 0), 0);
  const unavailable = observations.filter((row) => (row.metadata as Record<string, unknown> | null)?.status !== "OBSERVED").length;
  return {
    active, expiresAt: current?.expiresAt || null, dailyLimit: current?.dailyLimit || 0,
    attemptsToday, remainingToday: active ? Math.max(0, current!.dailyLimit - attemptsToday) : 0,
    observations7d: observations.length, unavailable7d: unavailable,
    inputTokens7d: inputTokens, outputTokens7d: outputTokens,
    estimatedUsd7d: estimatedTypesafeUsd(inputTokens),
    lastObservedAt: observations[0]?.createdAt || null
  };
}

/** Super-admin only. Call after platform database identity has been established. */
export async function getHotelShadowMatrix(now = new Date()) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable");
  const hotels = await db.organization.findMany({
    where: { isDemo: false, status: "ACTIVE", botProfile: { category: "STAY", status: "LIVE" } },
    select: { id: true, name: true, slug: true }, orderBy: { name: "asc" }
  });
  const today = new Date(now.toISOString().slice(0, 10));
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  return Promise.all(hotels.map(async (hotel) => {
    const [control, attemptsToday, observations] = await Promise.all([
      db.platformAuditLog.findFirst({ where: { organizationId: hotel.id, action: "TYPESAFE_PILOT_CONTROL" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { metadata: true } }),
      db.platformAuditLog.count({ where: { organizationId: hotel.id, action: "TYPESAFE_SHADOW_RESERVED", createdAt: { gte: today } } }),
      db.platformAuditLog.findMany({ where: { organizationId: hotel.id, action: "TYPESAFE_SHADOW_OBSERVED", createdAt: { gte: sevenDaysAgo } }, orderBy: { createdAt: "desc" }, take: 200, select: { createdAt: true, metadata: true } })
    ]);
    return { ...hotel, ...summarizeHotelShadow(control?.metadata, attemptsToday, observations, now) };
  }));
}
