import { Prisma, ReadinessScanStatus, type ReadinessScan } from "../../generated/prisma/client";
import { getDb } from "@/lib/db";
import { withSystemDatabaseIdentity, withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { AI_READINESS_RUBRIC_V1 } from "@/lib/ai-readiness/rubric";

const ACTIVE_SCAN_STATUSES = [ReadinessScanStatus.QUEUED, ReadinessScanStatus.RUNNING] as const;
const MAX_SCAN_ATTEMPTS = 3;
const MAX_CLAIM_BATCH = 10;
const MAX_LEASE_SECONDS = 300;

export type EnqueueReadinessScanInput = {
  organizationId: string;
  propertyId: string;
  sourceUrl: string;
  requestedBy: string;
  rubricVersion?: string;
  requestPayload?: Prisma.InputJsonValue;
  idempotencyKey?: string;
  scheduledFor?: Date;
};

export type ClaimReadinessScansInput = {
  workerId: string;
  take?: number;
  leaseSeconds?: number;
  now?: Date;
};

function clean(value: string, label: string, max = 500) {
  const normalized = value.trim();
  if (!normalized || normalized.length > max || /[\u0000-\u001f]/.test(normalized)) throw new Error(`Invalid readiness ${label}.`);
  return normalized;
}

function permittedSourceUrl(value: string) {
  const parsed = new URL(clean(value, "source URL", 2_000));
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Readiness scans require a public HTTP(S) URL.");
  if (parsed.username || parsed.password || !parsed.hostname) throw new Error("Readiness scan URL must not contain credentials.");
  return parsed.toString();
}

export function readinessScanIdempotencyKey(input: Pick<EnqueueReadinessScanInput, "organizationId" | "propertyId" | "sourceUrl" | "rubricVersion">) {
  const source = permittedSourceUrl(input.sourceUrl);
  return `${clean(input.organizationId, "organization", 200)}:ai-readiness:${clean(input.propertyId, "property", 200)}:${clean(input.rubricVersion || AI_READINESS_RUBRIC_V1, "rubric", 100)}:${source}`;
}

export function readinessRetryDelayMs(attemptCount: number) {
  return Math.min(60, Math.max(2, 2 ** Math.max(attemptCount - 1, 0))) * 60 * 1000;
}

/**
 * Persists a request only. It cannot fetch a website and it proves the chosen
 * property belongs to the caller's tenant before creating the scan row.
 */
export async function enqueueReadinessScan(input: EnqueueReadinessScanInput) {
  const organizationId = clean(input.organizationId, "organization", 200);
  const propertyId = clean(input.propertyId, "property", 200);
  const sourceUrl = permittedSourceUrl(input.sourceUrl);
  const requestedBy = clean(input.requestedBy, "requester", 200);
  const rubricVersion = clean(input.rubricVersion || AI_READINESS_RUBRIC_V1, "rubric", 100);
  const idempotencyKey = clean(input.idempotencyKey || readinessScanIdempotencyKey({ organizationId, propertyId, sourceUrl, rubricVersion }), "idempotency key", 2_500);
  const scheduledFor = input.scheduledFor ?? new Date();

  return withTenantDatabaseContext({ kind: "tenant", organizationId, actor: requestedBy }, async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    const property = await db.property.findFirst({ where: { id: propertyId, organizationId }, select: { id: true } });
    if (!property) throw new Error("Readiness property is not available in this tenant.");
    const existing = await db.readinessScan.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;
    return db.readinessScan.create({
      data: {
        organizationId,
        propertyId,
        sourceUrl,
        rubricVersion,
        idempotencyKey,
        requestPayload: input.requestPayload,
        requestedBy,
        nextRunAt: scheduledFor,
        maxAttempts: MAX_SCAN_ATTEMPTS
      }
    });
  });
}

/** Claims a small leased batch. The caller must execute only the claimed ids. */
export async function claimDueReadinessScans(input: ClaimReadinessScansInput): Promise<ReadinessScan[]> {
  const workerId = clean(input.workerId, "worker", 200);
  const now = input.now ?? new Date();
  const take = Math.max(1, Math.min(input.take ?? MAX_CLAIM_BATCH, MAX_CLAIM_BATCH));
  const leaseSeconds = Math.max(30, Math.min(input.leaseSeconds ?? 120, MAX_LEASE_SECONDS));
  const leaseExpiresAt = new Date(now.getTime() + leaseSeconds * 1000);

  return withSystemDatabaseIdentity(`readiness-worker:${workerId}`, "ai-readiness-scan-worker", async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    const candidates = await db.readinessScan.findMany({
      where: {
        OR: [
          { status: ReadinessScanStatus.QUEUED, nextRunAt: { lte: now } },
          { status: ReadinessScanStatus.RUNNING, leaseExpiresAt: { lt: now } }
        ]
      },
      orderBy: [{ nextRunAt: "asc" }, { createdAt: "asc" }],
      take
    });
    const claimedIds: string[] = [];
    for (const candidate of candidates) {
      const resumed = candidate.status === ReadinessScanStatus.RUNNING;
      const result = await db.readinessScan.updateMany({
        where: resumed
          ? { id: candidate.id, status: ReadinessScanStatus.RUNNING, leaseExpiresAt: { lt: now } }
          : { id: candidate.id, status: ReadinessScanStatus.QUEUED, nextRunAt: { lte: now } },
        data: {
          status: ReadinessScanStatus.RUNNING,
          lockedAt: now,
          lockedBy: workerId,
          leaseExpiresAt,
          startedAt: candidate.startedAt ?? now,
          attemptCount: { increment: 1 },
          lastError: null
        }
      });
      if (result.count === 1) claimedIds.push(candidate.id);
    }
    if (!claimedIds.length) return [];
    return db.readinessScan.findMany({ where: { id: { in: claimedIds } }, orderBy: { createdAt: "asc" } });
  });
}

export async function completeReadinessScan(scanId: string, workerId: string, result: Prisma.InputJsonValue) {
  return updateClaimedScan(scanId, workerId, {
    status: ReadinessScanStatus.SUCCEEDED,
    result,
    completedAt: new Date(),
    lockedAt: null,
    lockedBy: null,
    leaseExpiresAt: null,
    lastError: null
  });
}

export async function failReadinessScan(scan: Pick<ReadinessScan, "id" | "attemptCount" | "maxAttempts">, workerId: string, error: unknown) {
  const message = clean(error instanceof Error ? error.message : String(error), "worker error", 2_000);
  const now = new Date();
  const terminal = scan.attemptCount >= scan.maxAttempts;
  return updateClaimedScan(scan.id, workerId, terminal
    ? { status: ReadinessScanStatus.FAILED, completedAt: now, lockedAt: null, lockedBy: null, leaseExpiresAt: null, lastError: message }
    : { status: ReadinessScanStatus.QUEUED, nextRunAt: new Date(now.getTime() + readinessRetryDelayMs(scan.attemptCount)), lockedAt: null, lockedBy: null, leaseExpiresAt: null, lastError: message }
  );
}

async function updateClaimedScan(scanId: string, workerId: string, data: Prisma.ReadinessScanUpdateManyMutationInput) {
  const id = clean(scanId, "scan id", 200);
  const worker = clean(workerId, "worker", 200);
  return withSystemDatabaseIdentity(`readiness-worker:${worker}`, "ai-readiness-scan-worker", async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    const result = await db.readinessScan.updateMany({
      where: { id, status: ReadinessScanStatus.RUNNING, lockedBy: worker, leaseExpiresAt: { gt: new Date() } },
      data
    });
    if (result.count !== 1) throw new Error("Readiness scan lease was lost; result was not recorded.");
    return db.readinessScan.findUnique({ where: { id } });
  });
}

export async function cancelReadinessScan(input: { organizationId: string; scanId: string; canceledBy: string; reason: string }) {
  const organizationId = clean(input.organizationId, "organization", 200);
  const scanId = clean(input.scanId, "scan id", 200);
  const canceledBy = clean(input.canceledBy, "canceler", 200);
  const reason = clean(input.reason, "cancellation reason", 2_000);
  return withTenantDatabaseContext({ kind: "tenant", organizationId, actor: canceledBy }, async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    return db.readinessScan.updateMany({
      where: { id: scanId, organizationId, status: { in: [...ACTIVE_SCAN_STATUSES] } },
      data: { status: ReadinessScanStatus.CANCELED, canceledAt: new Date(), canceledBy, cancellationReason: reason, completedAt: new Date(), lockedAt: null, lockedBy: null, leaseExpiresAt: null }
    });
  });
}
