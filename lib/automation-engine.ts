import { getDb } from "@/lib/db";
import { Prisma, type AutomationJob } from "../generated/prisma/client";

export const AUTOMATION_JOB_STATUS = {
  QUEUED: "QUEUED",
  RUNNING: "RUNNING",
  RETRY: "RETRY",
  SUCCEEDED: "SUCCEEDED",
  DEAD: "DEAD",
  CANCELED: "CANCELED"
} as const;

export type AutomationJobStatus = (typeof AUTOMATION_JOB_STATUS)[keyof typeof AUTOMATION_JOB_STATUS];

export const AUTOMATION_ACTION_TYPE = {
  INTERNAL_NOTE: "INTERNAL_NOTE",
  FOLLOW_UP_REMINDER: "FOLLOW_UP_REMINDER",
  HUMAN_HANDOFF: "HUMAN_HANDOFF",
  DAILY_DIGEST_SIMULATION: "DAILY_DIGEST_SIMULATION",
  FAIL_VERIFICATION: "FAIL_VERIFICATION"
} as const;

export type AutomationActionType = (typeof AUTOMATION_ACTION_TYPE)[keyof typeof AUTOMATION_ACTION_TYPE];

export type AutomationQueueSummary = {
  total: number;
  queued: number;
  running: number;
  retry: number;
  succeeded24h: number;
  dead: number;
  dueNow: number;
  nextDueAt: Date | null;
};

export type EnqueueAutomationJobInput = {
  propertyId: string;
  workflowId: string;
  workflowVersion?: number;
  triggerType: string;
  triggerRef?: string | null;
  actionType: AutomationActionType;
  payload?: Prisma.InputJsonValue;
  idempotencyKey: string;
  scheduledFor?: Date;
  priority?: number;
  maxAttempts?: number;
  createdBy?: string | null;
};

export type ClaimAutomationJobsInput = {
  propertyId?: string;
  workerId: string;
  take?: number;
  leaseSeconds?: number;
  now?: Date;
};

export type RunAutomationJobsInput = ClaimAutomationJobsInput & {
  dryRun?: boolean;
};

const ACTIVE_STATUSES = [
  AUTOMATION_JOB_STATUS.QUEUED,
  AUTOMATION_JOB_STATUS.RETRY,
  AUTOMATION_JOB_STATUS.RUNNING
];

function normalizePayload(payload: Prisma.InputJsonValue | undefined): Prisma.InputJsonValue {
  return payload ?? {};
}

function nextBackoff(attemptCount: number) {
  return Math.min(60, Math.max(2, 2 ** Math.max(attemptCount - 1, 0))) * 60 * 1000;
}

export async function enqueueAutomationJob(input: EnqueueAutomationJobInput) {
  const db = getDb();
  if (!db) return null;
  const scheduledFor = input.scheduledFor ?? new Date();

  return db.automationJob.upsert({
    where: { idempotencyKey: input.idempotencyKey },
    update: {},
    create: {
      propertyId: input.propertyId,
      workflowId: input.workflowId,
      workflowVersion: input.workflowVersion ?? 1,
      triggerType: input.triggerType,
      triggerRef: input.triggerRef || null,
      actionType: input.actionType,
      payload: normalizePayload(input.payload),
      idempotencyKey: input.idempotencyKey,
      scheduledFor,
      nextRunAt: scheduledFor,
      priority: input.priority ?? 5,
      maxAttempts: input.maxAttempts ?? 3,
      createdBy: input.createdBy || null
    }
  });
}

export async function claimDueAutomationJobs(input: ClaimAutomationJobsInput) {
  const db = getDb();
  if (!db) return [];
  const now = input.now ?? new Date();
  const leaseExpiresAt = new Date(now.getTime() + (input.leaseSeconds ?? 60) * 1000);
  const take = Math.max(1, Math.min(input.take ?? 10, 50));

  const candidates = await db.automationJob.findMany({
    where: {
      ...(input.propertyId ? { propertyId: input.propertyId } : {}),
      OR: [
        { status: { in: [AUTOMATION_JOB_STATUS.QUEUED, AUTOMATION_JOB_STATUS.RETRY] }, nextRunAt: { lte: now } },
        { status: AUTOMATION_JOB_STATUS.RUNNING, leaseExpiresAt: { lt: now } }
      ]
    },
    orderBy: [{ priority: "asc" }, { nextRunAt: "asc" }, { createdAt: "asc" }],
    take
  });

  const claimedIds: string[] = [];
  for (const candidate of candidates) {
    const where = candidate.status === AUTOMATION_JOB_STATUS.RUNNING
      ? { id: candidate.id, status: AUTOMATION_JOB_STATUS.RUNNING, leaseExpiresAt: { lt: now } }
      : { id: candidate.id, status: { in: [AUTOMATION_JOB_STATUS.QUEUED, AUTOMATION_JOB_STATUS.RETRY] }, nextRunAt: { lte: now } };

    const result = await db.automationJob.updateMany({
      where,
      data: {
        status: AUTOMATION_JOB_STATUS.RUNNING,
        lockedAt: now,
        lockedBy: input.workerId,
        leaseExpiresAt,
        attemptCount: { increment: 1 },
        lastError: null
      }
    });
    if (result.count === 1) claimedIds.push(candidate.id);
  }

  if (!claimedIds.length) return [];
  return db.automationJob.findMany({
    where: { id: { in: claimedIds } },
    orderBy: [{ priority: "asc" }, { nextRunAt: "asc" }, { createdAt: "asc" }]
  });
}

export async function completeAutomationJob(jobId: string, result: Prisma.InputJsonValue = {}) {
  const db = getDb();
  if (!db) return null;
  return db.automationJob.update({
    where: { id: jobId },
    data: {
      status: AUTOMATION_JOB_STATUS.SUCCEEDED,
      result,
      completedAt: new Date(),
      leaseExpiresAt: null,
      lockedAt: null,
      lockedBy: null,
      lastError: null
    }
  });
}

export async function failAutomationJob(job: AutomationJob, error: unknown) {
  const db = getDb();
  if (!db) return null;
  const message = error instanceof Error ? error.message : String(error);
  const now = new Date();
  const shouldDeadLetter = job.attemptCount >= job.maxAttempts;

  return db.automationJob.update({
    where: { id: job.id },
    data: shouldDeadLetter
      ? {
          status: AUTOMATION_JOB_STATUS.DEAD,
          deadLetterReason: message,
          lastError: message,
          completedAt: now,
          leaseExpiresAt: null,
          lockedAt: null,
          lockedBy: null
        }
      : {
          status: AUTOMATION_JOB_STATUS.RETRY,
          lastError: message,
          nextRunAt: new Date(now.getTime() + nextBackoff(job.attemptCount)),
          leaseExpiresAt: null,
          lockedAt: null,
          lockedBy: null
        }
  });
}

export async function cancelAutomationJob(jobId: string, reason: string) {
  const db = getDb();
  if (!db) return null;
  return db.automationJob.update({
    where: { id: jobId },
    data: {
      status: AUTOMATION_JOB_STATUS.CANCELED,
      deadLetterReason: reason,
      completedAt: new Date(),
      leaseExpiresAt: null,
      lockedAt: null,
      lockedBy: null
    }
  });
}

export async function executeAutomationJob(job: AutomationJob, options: { dryRun?: boolean } = {}) {
  if (job.actionType === AUTOMATION_ACTION_TYPE.FAIL_VERIFICATION) {
    throw new Error("Verification failure requested by automation test.");
  }

  const result = {
    dryRun: Boolean(options.dryRun),
    actionType: job.actionType,
    workflowId: job.workflowId,
    message: automationActionMessage(job.actionType),
    executedAt: new Date().toISOString()
  };

  return completeAutomationJob(job.id, result);
}

export async function runDueAutomationJobs(input: RunAutomationJobsInput) {
  const claimed = await claimDueAutomationJobs(input);
  const completed: string[] = [];
  const failed: string[] = [];

  for (const job of claimed) {
    try {
      await executeAutomationJob(job, { dryRun: input.dryRun });
      completed.push(job.id);
    } catch (error) {
      await failAutomationJob(job, error);
      failed.push(job.id);
    }
  }

  return { claimed: claimed.length, completed: completed.length, failed: failed.length, completedIds: completed, failedIds: failed };
}

export async function getAutomationQueueSummary(propertyId: string): Promise<AutomationQueueSummary> {
  const db = getDb();
  if (!db) {
    return { total: 0, queued: 0, running: 0, retry: 0, succeeded24h: 0, dead: 0, dueNow: 0, nextDueAt: null };
  }
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [jobs, dueNow, nextDue] = await Promise.all([
    db.automationJob.groupBy({
      by: ["status"],
      where: { propertyId },
      _count: { _all: true }
    }),
    db.automationJob.count({
      where: { propertyId, status: { in: ACTIVE_STATUSES }, nextRunAt: { lte: now } }
    }),
    db.automationJob.findFirst({
      where: { propertyId, status: { in: ACTIVE_STATUSES }, nextRunAt: { gt: now } },
      orderBy: { nextRunAt: "asc" },
      select: { nextRunAt: true }
    })
  ]);

  const count = (status: AutomationJobStatus) => jobs.find((item) => item.status === status)?._count._all ?? 0;
  const succeeded24h = await db.automationJob.count({
    where: { propertyId, status: AUTOMATION_JOB_STATUS.SUCCEEDED, completedAt: { gte: yesterday } }
  });

  return {
    total: jobs.reduce((sum, item) => sum + item._count._all, 0),
    queued: count(AUTOMATION_JOB_STATUS.QUEUED),
    running: count(AUTOMATION_JOB_STATUS.RUNNING),
    retry: count(AUTOMATION_JOB_STATUS.RETRY),
    succeeded24h,
    dead: count(AUTOMATION_JOB_STATUS.DEAD),
    dueNow,
    nextDueAt: nextDue?.nextRunAt ?? null
  };
}

export async function listAutomationJobs(propertyId: string, take = 12) {
  const db = getDb();
  if (!db) return [];
  return db.automationJob.findMany({
    where: { propertyId },
    orderBy: [{ createdAt: "desc" }],
    take
  });
}

function automationActionMessage(actionType: string) {
  switch (actionType) {
    case AUTOMATION_ACTION_TYPE.INTERNAL_NOTE:
      return "Internal note reserved and recorded.";
    case AUTOMATION_ACTION_TYPE.FOLLOW_UP_REMINDER:
      return "Follow-up reminder prepared for operator review.";
    case AUTOMATION_ACTION_TYPE.HUMAN_HANDOFF:
      return "Conversation routed to human intervention queue.";
    case AUTOMATION_ACTION_TYPE.DAILY_DIGEST_SIMULATION:
      return "Daily digest summary prepared without sending externally.";
    default:
      return "Automation action completed.";
  }
}
