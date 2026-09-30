import { getDb } from "@/lib/db";
import { assessBotFactualReadiness, assessSourceCoverage, clusterFleetKnowledgeGaps, deliveryUncertaintyAlerts } from "@/lib/fleet-knowledge-observability";

type HealthRow = {
  propertyId: string; propertyName: string; organizationId: string; releaseActive: boolean; factualServingOpen: boolean;
  authorizedSourceCount: bigint; activeMemberCount: bigint; retrievableUnitCount: bigint; openFlagCount: bigint; unresolvedDeliveryCount: bigint;
  generationId: string | null; expectedPages: number; capturedPages: number; failedPages: number; lastCapturedAt: Date | null;
};
type GapRow = { id: string; propertyId: string; question: string; occurrenceCount: number; lastAskedAt: Date };
type UncertainRow = { propertyId: string; provider: string | null; occurredAt: Date; deliveryKey: string };

export async function readFleetKnowledgeHealth(now = new Date()) {
  const db = getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const [rows, gaps, uncertain] = await Promise.all([
    db.$queryRaw<HealthRow[]>`
      SELECT p.id AS "propertyId",p.name AS "propertyName",p."organizationId",
        (brp."propertyId" IS NOT NULL) AS "releaseActive",NOT coalesce(fc."isClosed",false) AS "factualServingOpen",
        (SELECT count(*) FROM "KnowledgeSource" s WHERE s."propertyId"=p.id AND s.state='AUTHORIZED' AND s."revokedAt" IS NULL) AS "authorizedSourceCount",
        (SELECT count(*) FROM "KnowledgeReleaseMember" m WHERE m."propertyId"=p.id AND m."releaseArtifactId"=kap."releaseArtifactId") AS "activeMemberCount",
        coalesce(wg."chunkCount",0)::bigint AS "retrievableUnitCount",
        (SELECT count(*) FROM "KnowledgeAnswerFlag" f WHERE f."propertyId"=p.id AND f.status<>'RESOLVED') AS "openFlagCount",
        (SELECT count(*) FROM "KnowledgeAnswerOutcome" o WHERE o."propertyId"=p.id AND o.state='FAILED' AND coalesce((o.detail->>'deliveryUncertain')::boolean,false)) AS "unresolvedDeliveryCount",
        wg.id AS "generationId",coalesce(jsonb_array_length(cv.manifest#>'{snapshot,pages}'),0)::int AS "expectedPages",
        coalesce(wg."pageCount",0)::int AS "capturedPages",0::int AS "failedPages",max(wp."crawledAt") AS "lastCapturedAt"
      FROM "Property" p
      LEFT JOIN "BotReleasePointer" brp ON brp."propertyId"=p.id
      LEFT JOIN "BotFactualServingControl" fc ON fc."propertyId"=p.id
      LEFT JOIN "KnowledgeReleaseActivePointer" kap ON kap."propertyId"=p.id
      LEFT JOIN "WebsiteCrawlGeneration" wg ON wg."propertyId"=p.id AND wg.status='ACTIVE'
      LEFT JOIN "CaptureVersion" cv ON cv."propertyId"=p.id AND cv.id=wg."captureVersionId"
      LEFT JOIN "WebsiteCrawlPage" wp ON wp."propertyId"=p.id AND wp."generationId"=wg.id
      GROUP BY p.id,p.name,p."organizationId",brp."propertyId",fc."isClosed",kap."releaseArtifactId",wg.id,wg."chunkCount",wg."pageCount",cv.manifest
      ORDER BY p.id`,
    db.$queryRaw<GapRow[]>`SELECT id,"propertyId",question,"occurrenceCount","lastAskedAt" FROM "KnowledgeGap" WHERE status='OPEN' ORDER BY "propertyId","occurrenceCount" DESC`,
    db.$queryRaw<UncertainRow[]>`SELECT "propertyId",detail->>'provider' AS provider,"occurredAt","deliveryKey" FROM "KnowledgeAnswerOutcome" WHERE state='FAILED' AND coalesce((detail->>'deliveryUncertain')::boolean,false) ORDER BY "occurredAt"`,
  ]);
  return {
    generatedAt: now.toISOString(),
    bots: rows.map((row) => ({
      propertyId: row.propertyId, propertyName: row.propertyName, organizationId: row.organizationId,
      readiness: assessBotFactualReadiness({ propertyId: row.propertyId, releaseActive: row.releaseActive, factualServingOpen: row.factualServingOpen, authorizedSourceCount: Number(row.authorizedSourceCount), activeMemberCount: Number(row.activeMemberCount), retrievableUnitCount: Number(row.retrievableUnitCount), validatorHealthy: Number(row.openFlagCount) === 0, unresolvedDeliveryCount: Number(row.unresolvedDeliveryCount) }),
      website: row.generationId ? assessSourceCoverage({ sourceId: row.generationId, expectedItems: row.expectedPages, capturedItems: row.capturedPages, failedItems: row.failedPages, lastCapturedAt: row.lastCapturedAt?.toISOString() ?? null, refreshHours: 24 * 7 }, now) : null,
    })),
    gapTopics: clusterFleetKnowledgeGaps(gaps),
    deliveryUncertainty: deliveryUncertaintyAlerts(uncertain, now),
  };
}
