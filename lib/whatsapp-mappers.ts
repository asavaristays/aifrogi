import type { WhatsAppIntegration as AppWhatsAppIntegration } from "@/types";
import type { WhatsAppIntegrationModel } from "../generated/prisma/models/WhatsAppIntegration";

function formatDate(date?: Date | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

export function mapWhatsAppIntegrationRecord(record: WhatsAppIntegrationModel): AppWhatsAppIntegration {
  return {
    id: record.id,
    provider: record.provider,
    businessAccountId: record.businessAccountId,
    phoneNumberId: record.phoneNumberId,
    displayPhoneNumber: record.displayPhoneNumber,
    webhookVerifyToken: record.webhookVerifyToken,
    status: record.status,
    approvedBy: record.approvedBy,
    approvedAtLabel: formatDate(record.approvedAt),
    lastValidatedAtLabel: formatDate(record.lastValidatedAt),
    notes: record.notes,
    aiModeEnabled: record.aiModeEnabled
  };
}
