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
  createdBy?: string;
  recipients: string[];
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
      createdBy: input.createdBy || null,
      status: "SENDING",
      recipients: { create: input.recipients.map((phone) => ({ phone })) }
    },
    include: { recipients: true }
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
