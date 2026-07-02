import { getDb } from "@/lib/db";
import {
  DEFAULT_WHATSAPP_BOT_CONFIGURATION,
  normalizeWhatsAppBotConfiguration,
  type WhatsAppBotConfiguration,
  type WhatsAppBotConfigurationInput
} from "@/lib/whatsapp-bot-config";

export async function getWhatsAppBotConfigurationForProperty(propertySlug: string) {
  const db = getDb();
  if (!db) return DEFAULT_WHATSAPP_BOT_CONFIGURATION;

  const property = await db.property.findUnique({
    where: { slug: propertySlug },
    select: {
      organization: {
        select: { botConfiguration: true }
      }
    }
  });

  return normalizeWhatsAppBotConfiguration(property?.organization?.botConfiguration as WhatsAppBotConfigurationInput | null);
}

export async function saveOrganizationWhatsAppBotConfiguration(input: {
  organizationId: string;
  plan: string;
  configuration: WhatsAppBotConfiguration;
  updatedBy: string;
}) {
  const db = getDb();
  if (!db) return null;

  const configuration = normalizeWhatsAppBotConfiguration(input.configuration);
  await db.$transaction([
    db.organization.update({
      where: { id: input.organizationId },
      data: { plan: input.plan }
    }),
    db.whatsAppBotConfiguration.upsert({
      where: { organizationId: input.organizationId },
      update: { ...configuration, updatedBy: input.updatedBy },
      create: { organizationId: input.organizationId, ...configuration, updatedBy: input.updatedBy }
    }),
    db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.updatedBy,
        action: "WHATSAPP_BOT_CONFIGURED",
        detail: `${input.plan}: ${configuration.serviceBuckets.join(", ") || "No automated service replies"}`
      }
    })
  ]);

  return db.organization.findUnique({
    where: { id: input.organizationId },
    include: { botConfiguration: true }
  });
}
