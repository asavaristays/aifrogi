import { getDb } from "@/lib/db";
import { Prisma, type AutomationJob } from "../generated/prisma/client";
import { sendWhatsAppTemplateMessage } from "@/lib/services/whatsapp-service";
import { finalizeCampaignRun, recordCampaignRecipientResult } from "@/lib/repositories/campaign-repository";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";

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
  WHATSAPP_TEMPLATE_CAMPAIGN: "WHATSAPP_TEMPLATE_CAMPAIGN",
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
  excludeActionTypes?: string[];
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
      ...(input.excludeActionTypes?.length ? { actionType: { notIn: input.excludeActionTypes } } : {}),
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

  if (job.actionType === AUTOMATION_ACTION_TYPE.WHATSAPP_TEMPLATE_CAMPAIGN) {
    return executeScheduledWhatsAppCampaign(job, options);
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

async function executeScheduledWhatsAppCampaign(job: AutomationJob, options: { dryRun?: boolean }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload)
    ? job.payload as Record<string, unknown>
    : {};
  const campaignId = String(payload.campaignId || job.triggerRef || "");
  const campaign = await db.campaign.findFirst({
    where: { id: campaignId, propertyId: job.propertyId },
    include: { recipients: true, property: true }
  });
  if (!campaign) throw new Error("Scheduled campaign no longer exists.");
  if (campaign.status === "CANCELED") return completeAutomationJob(job.id, { skipped: true, reason: "Campaign canceled" });
  if (!["SCHEDULED", "SENDING"].includes(campaign.status)) throw new Error(`Campaign is ${campaign.status}, not executable.`);
  if (!campaign.property.organizationId) throw new Error("Campaign workspace is not attached to an organization.");

  const subscription = await getOrganizationSubscriptionAccess(campaign.property.organizationId);
  if (subscription && !subscription.canUsePaidActions) throw new Error("Subscription is paused; scheduled campaign was not sent.");
  if (campaign.templateStatus !== "APPROVED" || !campaign.templateName) throw new Error("Approved template is required.");
  if (!campaign.consentSource || !campaign.consentProof || !campaign.consentConfirmedAt) throw new Error("Consent evidence is incomplete.");

  const localHour = Number(new Intl.DateTimeFormat("en", {
    hour: "numeric",
    hourCycle: "h23",
    timeZone: campaign.property.timezone || "Asia/Kolkata"
  }).format(new Date()));
  if (localHour < 9 || localHour >= 20) {
    await db.automationJob.update({
      where: { id: job.id },
      data: {
        status: AUTOMATION_JOB_STATUS.QUEUED,
        nextRunAt: new Date(Date.now() + 60 * 60 * 1000),
        attemptCount: { decrement: 1 },
        lockedAt: null,
        lockedBy: null,
        leaseExpiresAt: null,
        lastError: "Quiet hours active; deferred without consuming a retry."
      }
    });
    return null;
  }

  if (options.dryRun) {
    return completeAutomationJob(job.id, { dryRun: true, campaignId, recipients: campaign.recipients.length });
  }

  const snapshot = (() => {
    try { return JSON.parse(campaign.audienceSnapshot || "{}") as { bodyVariables?: string[]; headerImageUrl?: string }; }
    catch { return {}; }
  })();
  let sent = campaign.recipients.filter((recipient) => ["ACCEPTED", "DELIVERED", "READ"].includes(recipient.status)).length;
  let failed = campaign.recipients.filter((recipient) => ["SUPPRESSED", "SENDING"].includes(recipient.status)).length;
  const errors: string[] = [];
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (campaign.status === "SCHEDULED") await db.campaign.update({ where: { id: campaign.id }, data: { status: "SENDING" } });
  for (const recipient of campaign.recipients) {
    if (["ACCEPTED", "DELIVERED", "READ", "SUPPRESSED", "SENDING"].includes(recipient.status)) continue;
    const [optedOutLead, recentSend] = await Promise.all([
      db.lead.findFirst({
        where: {
          propertyId: campaign.propertyId,
          phone: recipient.phone,
          tags: { some: { value: { in: ["STOP", "OPTED_OUT", "DO_NOT_CONTACT"], mode: "insensitive" } } }
        },
        select: { id: true }
      }),
      db.campaignRecipient.findFirst({
        where: {
          phone: recipient.phone,
          campaign: { propertyId: campaign.propertyId },
          sentAt: { gte: oneDayAgo },
          campaignId: { not: campaign.id }
        },
        select: { id: true }
      })
    ]);
    if (optedOutLead || recentSend) {
      const reason = optedOutLead ? "Recipient opted out." : "24-hour frequency cap applied.";
      await db.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "SUPPRESSED", suppressionReason: reason } });
      failed += 1;
      errors.push(reason);
      continue;
    }

    await db.campaignRecipient.update({ where: { id: recipient.id }, data: { status: "SENDING" } });
    const result = await sendWhatsAppTemplateMessage({
      to: recipient.phone,
      templateName: campaign.templateName,
      languageCode: campaign.languageCode,
      propertySlug: campaign.property.slug,
      bodyVariables: snapshot.bodyVariables || [],
      headerImageUrl: snapshot.headerImageUrl || ""
    });
    await recordCampaignRecipientResult({
      campaignId: campaign.id,
      phone: recipient.phone,
      ok: !result.error,
      externalMessageId: result.result?.sid || null,
      error: result.error || null
    });
    if (result.error) { failed += 1; errors.push(result.error); } else { sent += 1; }
  }

  await finalizeCampaignRun({
    campaignId: campaign.id,
    sentCount: sent,
    failedCount: failed,
    errorSummary: Array.from(new Set(errors)).join(" | ").slice(0, 1000) || null
  });
  return completeAutomationJob(job.id, { campaignId, sent, failed });
}

export async function runDueAutomationJobs(input: RunAutomationJobsInput) {
  const claimed = await claimDueAutomationJobs({
    ...input,
    excludeActionTypes: input.dryRun ? [AUTOMATION_ACTION_TYPE.WHATSAPP_TEMPLATE_CAMPAIGN] : input.excludeActionTypes
  });
  const completed: string[] = [];
  const failed: string[] = [];

  for (const job of claimed) {
    try {
      const execution = await executeAutomationJob(job, { dryRun: input.dryRun });
      if (execution) completed.push(job.id);
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
