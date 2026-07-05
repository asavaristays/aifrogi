import { getDb } from "@/lib/db";

export async function createCampaignRun(input: {
  propertyId: string;
  name: string;
  templateName?: string;
  languageCode: string;
  messageType: string;
  metaChargeCategory?: string;
  estimatedCostPaisa: number;
  requestedCount: number;
  templateStatus?: string;
  consentSource?: string;
  consentProof?: string;
  consentConfirmedBy?: string;
  audienceSnapshot?: string;
  testMode?: boolean;
  createdBy?: string;
  recipients: string[];
  scheduledFor?: Date | null;
  initialStatus?: "SENDING" | "SCHEDULED";
}) {
  const db = getDb();
  if (!db) return null;
  return db.campaign.create({
    data: {
      propertyId: input.propertyId,
      name: input.name,
      templateName: input.templateName || null,
      languageCode: input.languageCode,
      messageType: input.messageType,
      metaChargeCategory: input.metaChargeCategory || null,
      estimatedReach: input.requestedCount,
      estimatedCostPaisa: input.estimatedCostPaisa,
      requestedCount: input.requestedCount,
      templateStatus: input.templateStatus || "UNKNOWN",
      consentSource: input.consentSource || null,
      consentProof: input.consentProof || null,
      consentConfirmedAt: input.consentSource ? new Date() : null,
      consentConfirmedBy: input.consentConfirmedBy || null,
      audienceSnapshot: input.audienceSnapshot || null,
      testMode: Boolean(input.testMode),
      createdBy: input.createdBy || null,
      scheduledFor: input.scheduledFor || null,
      status: input.initialStatus || "SENDING",
      recipients: {
        create: input.recipients.map((phone) => ({
          phone,
          consentStatus: input.consentSource ? "CONFIRMED" : "UNVERIFIED",
          consentSource: input.consentSource || null,
          consentProof: input.consentProof || null
        }))
      }
    },
    include: { recipients: true }
  });
}

export async function cancelScheduledCampaign(input: { campaignId: string; propertyId: string; actorEmail: string }) {
  const db = getDb();
  if (!db) return null;
  const campaign = await db.campaign.findFirst({
    where: { id: input.campaignId, propertyId: input.propertyId, status: "SCHEDULED" }
  });
  if (!campaign) return null;
  return db.$transaction(async (tx) => {
    const updated = await tx.campaign.update({ where: { id: campaign.id }, data: { status: "CANCELED" } });
    await tx.automationJob.updateMany({
      where: { propertyId: input.propertyId, triggerRef: campaign.id, status: { in: ["QUEUED", "RETRY"] } },
      data: { status: "CANCELED", completedAt: new Date(), deadLetterReason: `Canceled by ${input.actorEmail}` }
    });
    return updated;
  });
}

export async function recordCampaignRecipientResult(input: {
  campaignId: string;
  phone: string;
  ok: boolean;
  externalMessageId?: string | null;
  error?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  return db.campaignRecipient.update({
    where: { campaignId_phone: { campaignId: input.campaignId, phone: input.phone } },
    data: {
      status: input.ok ? "ACCEPTED" : "FAILED",
      externalMessageId: input.externalMessageId || null,
      error: input.error || null,
      sentAt: input.ok ? new Date() : null
    }
  });
}

export async function suppressCampaignRecipient(input: { campaignId: string; phone: string; reason: string }) {
  const db = getDb();
  if (!db) return null;
  return db.campaignRecipient.update({
    where: { campaignId_phone: { campaignId: input.campaignId, phone: input.phone } },
    data: { status: "SUPPRESSED", suppressionReason: input.reason }
  });
}

export async function finalizeCampaignRun(input: {
  campaignId: string;
  sentCount: number;
  failedCount: number;
  errorSummary?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  return db.campaign.update({
    where: { id: input.campaignId },
    data: {
      sentCount: input.sentCount,
      failedCount: input.failedCount,
      status: input.failedCount === 0 ? "SENT" : input.sentCount > 0 ? "PARTIAL" : "FAILED",
      errorSummary: input.errorSummary || null
    }
  });
}

export async function updateCampaignDeliveryStatus(externalMessageId: string, status: string, at: Date) {
  const db = getDb();
  if (!db) return null;
  const recipient = await db.campaignRecipient.findUnique({ where: { externalMessageId } });
  if (!recipient) return null;

  const normalized = status.toUpperCase();
  if (recipient.status === normalized) return true;
  await db.$transaction([
    db.campaignRecipient.update({
      where: { id: recipient.id },
      data: {
        status: normalized,
        deliveredAt: normalized === "DELIVERED" || normalized === "READ" ? at : recipient.deliveredAt,
        readAt: normalized === "READ" ? at : recipient.readAt
      }
    }),
    db.campaign.update({
      where: { id: recipient.campaignId },
      data: normalized === "READ"
        ? { readCount: { increment: 1 } }
        : normalized === "DELIVERED"
          ? { deliveredCount: { increment: 1 } }
          : normalized.startsWith("FAILED")
            ? { failedCount: { increment: 1 } }
            : {}
    })
  ]);
  return true;
}

export async function listCampaignRuns(propertyId: string, take = 20) {
  const db = getDb();
  if (!db) return [];
  return db.campaign.findMany({
    where: { propertyId },
    include: { recipients: true },
    orderBy: { createdAt: "desc" },
    take
  });
}

export async function getCampaignSummary(propertyId: string) {
  const db = getDb();
  if (!db) {
    return { total: 0, sent: 0, failed: 0, delivered: 0, read: 0, estimatedCostPaisa: 0 };
  }

  const campaigns = await db.campaign.findMany({
    where: { propertyId },
    select: {
      status: true,
      sentCount: true,
      failedCount: true,
      deliveredCount: true,
      readCount: true,
      estimatedCostPaisa: true
    }
  });

  return campaigns.reduce(
    (summary, campaign) => ({
      total: summary.total + 1,
      sent: summary.sent + campaign.sentCount,
      failed: summary.failed + campaign.failedCount,
      delivered: summary.delivered + campaign.deliveredCount,
      read: summary.read + campaign.readCount,
      estimatedCostPaisa: summary.estimatedCostPaisa + campaign.estimatedCostPaisa
    }),
    { total: 0, sent: 0, failed: 0, delivered: 0, read: 0, estimatedCostPaisa: 0 }
  );
}
