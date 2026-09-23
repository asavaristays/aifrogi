import { getDb } from "@/lib/db";

export const CASTLE_PILOT_TENANT = "cmu2dcedu003284kxjotchehs";
// Direct-provider published price, verified 2026-09-20. Estimate, not invoice.
export const TYPESAFE_PRICE_SOURCE = "https://typesafe.ai/blog/introducing-system-one-models-and-jev";
export const estimatedTypesafeUsd = (inputTokens: number) => Math.max(0, inputTokens) * 0.042 / 1_000_000;
export type PilotPolicy = { enabled: boolean; expiresAt: string; dailyLimit: number };
export function eligibleHotelPilot(organization: { isDemo: boolean; status: string; botProfile: { category: string; status: string } | null } | null) {
  return Boolean(organization && !organization.isDemo && organization.status === "ACTIVE"
    && organization.botProfile?.category === "STAY" && organization.botProfile.status === "LIVE");
}
export function validPilotPolicy(value: unknown, now = Date.now()): value is PilotPolicy {
  const p = value as PilotPolicy | null;
  return Boolean(p && p.enabled === true && Number.isFinite(Date.parse(p.expiresAt)) && Date.parse(p.expiresAt) > now && Number.isInteger(p.dailyLimit) && p.dailyLimit > 0 && p.dailyLimit <= 20);
}
const controlAction = "TYPESAFE_PILOT_CONTROL";
const attemptAction = "TYPESAFE_SHADOW_RESERVED";
const reviewAction = "TYPESAFE_OBSERVATION_REVIEW";
export type PilotReviewVerdict = "CORRECT" | "INCORRECT" | "UNRESOLVED";

export async function setPilotPolicy(organizationId: string, policy: PilotPolicy, actor: string) {
  if (policy.enabled && (!validPilotPolicy(policy) || Date.parse(policy.expiresAt) > Date.now() + 86400_000)) throw new Error("Pilot must expire within 24 hours with at most 20 daily attempts");
  const db = getDb(); if (!db) throw new Error("Database unavailable");
  const organization = await db.organization.findUnique({ where: { id: organizationId }, select: { isDemo: true, status: true, botProfile: { select: { category: true, status: true } } } });
  if (!eligibleHotelPilot(organization)) throw new Error("TypeSafe shadow policy requires an active, live, non-demo HotelGPT tenant");
  return db.$transaction(async tx => {
    const locked = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtext('typesafe-pilot'), hashtext(${organizationId})) AS acquired`;
    if (!locked[0]?.acquired) throw new Error("Pilot busy; retry control change");
    return tx.platformAuditLog.create({ data: { organizationId, actorEmail: actor, actorRole: "ADMIN", action: controlAction, targetType: "TypeSafePilot", targetId: organizationId, summary: policy.enabled ? "Bounded shadow pilot enabled" : "Shadow pilot disabled", metadata: policy } });
  });
}

/** Reserve before transmission. Failed requests count; missing state/errors fail closed. */
export async function reservePilotAttempt(organizationId: string) {
  if (organizationId !== CASTLE_PILOT_TENANT && process.env.TYPESAFE_HOTEL_SHADOW_ENABLED !== "true") return false;
  const db = getDb(); if (!db) return false;
  try {
    return await db.$transaction(async tx => {
      const organization = await tx.organization.findUnique({ where: { id: organizationId }, select: { isDemo: true, status: true, botProfile: { select: { category: true, status: true } } } });
      if (!eligibleHotelPilot(organization)) return false;
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
  const reviewRows = await db.platformAuditLog.findMany({ where: { organizationId, action: reviewAction, createdAt: { gte: since } }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 1000, select: { targetId: true, createdAt: true, actorEmail: true, metadata: true } });
  const latestReviews = new Map<string, { verdict: PilotReviewVerdict; rationale: string; reviewer: string; reviewedAt: string }>();
  for (const row of reviewRows) {
    if (!row.targetId || latestReviews.has(row.targetId)) continue;
    const metadata = row.metadata as Record<string, unknown>;
    if (!["CORRECT", "INCORRECT", "UNRESOLVED"].includes(String(metadata.verdict))) continue;
    latestReviews.set(row.targetId, { verdict: metadata.verdict as PilotReviewVerdict, rationale: String(metadata.rationale || ""), reviewer: row.actorEmail, reviewedAt: row.createdAt.toISOString() });
  }
  const refs = [...new Set(rows.map(row => String((row.metadata as Record<string, unknown>).reviewRef || "")).filter(Boolean))];
  const evidenceRows = refs.length ? await db.sovereignAnswerEvidence.findMany({ where: { property: { organizationId }, sessionIdHash: { in: refs }, createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, select: { sessionIdHash: true, question: true, answer: true, createdAt: true } }) : [];
  const evidenceByRef = new Map<string, { question: string; answer: string }>();
  for (const item of evidenceRows) if (!evidenceByRef.has(item.sessionIdHash)) evidenceByRef.set(item.sessionIdHash, { question: item.question, answer: item.answer });
  const samples = rows.map(row => { const metadata = row.metadata as Record<string, unknown>; const ref = String(metadata.reviewRef || ""); return { id: row.id, at: row.createdAt.toISOString(), ...metadata, review: latestReviews.get(row.id) || null, evidence: ref ? evidenceByRef.get(ref) || null : null }; });
  const values = samples.map(s => s as Record<string, unknown>);
  const sum = (key: string) => values.reduce((n, s) => n + (typeof s[key] === "number" ? s[key] as number : 0), 0);
  const latency = values.map(s => Number(s.latencyMs) || 0).sort((a,b) => a-b);
  const resolvedReviews = samples.filter(sample => sample.review?.verdict === "CORRECT" || sample.review?.verdict === "INCORRECT").length;
  return { policy: control?.metadata || null, active: validPilotPolicy(control?.metadata), samples, count: samples.length, unavailable: values.filter(s => s.status !== "OBSERVED").length, reviewed: resolvedReviews,
    inputTokens: sum("inputTokens"), outputTokens: sum("outputTokens"), p95Ms: latency.length ? latency[Math.ceil(latency.length * .95)-1] : null,
    estimatedUsd: estimatedTypesafeUsd(sum("inputTokens")), priceSource: TYPESAFE_PRICE_SOURCE,
    costStatus: "Estimated USD at $0.042 / million input tokens; output free. Rate verified 2026-09-20. Excludes unreported usage, taxes and contract differences.", assessment: samples.length < 30 ? "INSUFFICIENT_LIVE_EVIDENCE" : "HUMAN_REVIEW_REQUIRED" };
}

export async function reviewPilotObservation(organizationId: string, observationId: string, verdict: PilotReviewVerdict, rationale: string, reviewer: string) {
  if (organizationId !== CASTLE_PILOT_TENANT) throw new Error("Only Castle Mandawa is authorized for this review workflow");
  if (!["CORRECT", "INCORRECT", "UNRESOLVED"].includes(verdict)) throw new Error("Invalid review verdict");
  const note = rationale.trim();
  if (note.length < 12 || note.length > 1000) throw new Error("Review rationale must be 12–1000 characters");
  const db = getDb(); if (!db) throw new Error("Database unavailable");
  const observation = await db.platformAuditLog.findFirst({ where: { id: observationId, organizationId, action: "TYPESAFE_SHADOW_OBSERVED" }, select: { id: true } });
  if (!observation) throw new Error("TypeSafe observation not found");
  return db.platformAuditLog.create({ data: { organizationId, actorEmail: reviewer, actorRole: "ADMIN", action: reviewAction, targetType: "TypeSafeObservation", targetId: observationId, summary: `Human review recorded: ${verdict}`, metadata: { verdict, rationale: note, version: "typesafe-review-v1" } } });
}
