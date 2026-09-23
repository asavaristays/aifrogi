import { getDb } from "@/lib/db";
import { validPilotPolicy, type PilotPolicy } from "@/lib/typesafe-pilot-store";

type Observation = { createdAt: Date; metadata: unknown };
type Metadata = { status?: string; fit?: { choice?: string }; grounding?: { choice?: string }; reviewReasons?: string[]; httpStatus?: number };

export function summarizeHotelShadow(policy: unknown, attemptsToday: number, observations: Observation[], now = new Date()) {
  const current = policy as PilotPolicy | null;
  const active = validPilotPolicy(current, now.getTime());
  const observed = observations.map((row) => row.metadata as Metadata | null).filter((row): row is Metadata => row?.status === "OBSERVED");
  const count = (predicate: (row: Metadata) => boolean) => observed.filter(predicate).length;
  const lastSuccess = observations.find((row) => (row.metadata as Metadata | null)?.status === "OBSERVED");
  const latest = observations[0]?.metadata as Metadata | null;
  return {
    active, expiresAt: current?.expiresAt || null, dailyLimit: current ? current.dailyLimit : 0,
    attemptsToday, remainingToday: active && current!.dailyLimit !== null ? Math.max(0, current!.dailyLimit - attemptsToday) : null,
    assessed7d: observed.length, unavailable7d: observations.length - observed.length,
    addressed7d: count((row) => row.fit?.choice === "ADDRESSED" || row.fit?.choice === "APPROPRIATE_HANDOVER"),
    partial7d: count((row) => row.fit?.choice === "PARTIAL"), missed7d: count((row) => row.fit?.choice === "MISSED"),
    supported7d: count((row) => row.grounding?.choice === "SUPPORTED"),
    unverified7d: count((row) => row.grounding?.choice === "NO_APPROVED_CONTEXT"),
    flagged7d: count((row) => Boolean(row.reviewReasons?.length)),
    lastObservedAt: observations[0]?.createdAt || null, lastSuccessAt: lastSuccess?.createdAt || null,
    latestStatus: latest?.status || null, latestHttpStatus: latest?.httpStatus || null
  };
}

/** Super-admin only; the caller must establish platform database identity. */
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
    const [control, shadowAttemptsToday, preSendAttemptsToday, observations] = await Promise.all([
      db.platformAuditLog.findFirst({ where: { organizationId: hotel.id, action: "TYPESAFE_PILOT_CONTROL" }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { metadata: true } }),
      db.platformAuditLog.count({ where: { organizationId: hotel.id, action: "TYPESAFE_SHADOW_RESERVED", createdAt: { gte: today } } }),
      db.platformAuditLog.count({ where: { organizationId: hotel.id, action: "TYPESAFE_PRE_SEND_RESERVED", createdAt: { gte: today } } }),
      db.platformAuditLog.findMany({ where: { organizationId: hotel.id, action: "TYPESAFE_QUALITY_OBSERVED", createdAt: { gte: sevenDaysAgo } }, orderBy: { createdAt: "desc" }, take: 200, select: { createdAt: true, metadata: true } })
    ]);
    return { ...hotel, ...summarizeHotelShadow(control?.metadata, shadowAttemptsToday + preSendAttemptsToday, observations, now) };
  }));
}
