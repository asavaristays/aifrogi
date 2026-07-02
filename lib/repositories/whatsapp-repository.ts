import { getDb } from "@/lib/db";
import { decryptSecretValue, encryptSecretValue } from "@/lib/field-encryption";

export async function getWhatsAppIntegrationForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return null;

  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    include: { whatsappIntegration: true }
  });

  const integration = property?.whatsappIntegration ?? null;
  if (!integration) return null;

  return {
    ...integration,
    webhookVerifyToken: decryptSecretValue(integration.webhookVerifyToken),
    accessToken: decryptSecretValue(integration.accessToken),
  };
}

export async function getWhatsAppWorkspaceByPhoneNumberId(phoneNumberId: string) {
  const db = getDb();
  if (!db || !phoneNumberId) return null;

  return db.whatsAppIntegration.findFirst({
    where: { phoneNumberId },
    select: {
      property: {
        select: { slug: true }
      }
    }
  });
}

export async function listWhatsAppVerifyTokens() {
  const db = getDb();
  if (!db) return [];

  const records = await db.whatsAppIntegration.findMany({
    select: { webhookVerifyToken: true }
  });

  return records
    .map((record) => decryptSecretValue(record.webhookVerifyToken))
    .filter((token): token is string => Boolean(token));
}

export async function upsertWhatsAppIntegrationForProperty(
  propertyId: string,
  input: {
    provider: string;
    businessAccountId: string | null;
    phoneNumberId: string | null;
    displayPhoneNumber: string | null;
    webhookVerifyToken: string | null;
    accessToken: string | null;
    notes: string | null;
    approvedBy: string | null;
    aiModeEnabled: boolean;
  }
) {
  const db = getDb();
  if (!db) return null;

  return db.whatsAppIntegration.upsert({
    where: { propertyId },
    update: {
      provider: input.provider,
      businessAccountId: input.businessAccountId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      webhookVerifyToken: encryptSecretValue(input.webhookVerifyToken),
      accessToken: encryptSecretValue(input.accessToken),
      notes: input.notes,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedBy ? new Date() : null,
      status: input.accessToken ? "CONNECTED" : "CONFIGURED",
      aiModeEnabled: input.aiModeEnabled,
      lastValidatedAt: new Date()
    },
    create: {
      propertyId,
      provider: input.provider,
      businessAccountId: input.businessAccountId,
      phoneNumberId: input.phoneNumberId,
      displayPhoneNumber: input.displayPhoneNumber,
      webhookVerifyToken: encryptSecretValue(input.webhookVerifyToken),
      accessToken: encryptSecretValue(input.accessToken),
      notes: input.notes,
      approvedBy: input.approvedBy,
      approvedAt: input.approvedBy ? new Date() : null,
      status: input.accessToken ? "CONNECTED" : "CONFIGURED",
      aiModeEnabled: input.aiModeEnabled,
      lastValidatedAt: new Date()
    }
  });
}
