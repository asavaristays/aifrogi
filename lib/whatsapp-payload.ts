import type { WhatsAppIntegrationInput } from "@/types";

export function validateWhatsAppIntegrationInput(input: Partial<WhatsAppIntegrationInput>) {
  if (!input.provider || String(input.provider).trim() === "") {
    return "provider is required";
  }

  if (String(input.provider).trim() === "META_CLOUD_API") {
    if (!input.businessAccountId || String(input.businessAccountId).trim() === "") {
      return "businessAccountId is required";
    }

    if (!input.phoneNumberId || String(input.phoneNumberId).trim() === "") {
      return "phoneNumberId is required";
    }
  }

  return null;
}

export function normalizeWhatsAppIntegrationInput(input: WhatsAppIntegrationInput) {
  return {
    provider: input.provider.trim(),
    businessAccountId: input.businessAccountId?.trim() || null,
    phoneNumberId: input.phoneNumberId?.trim() || null,
    displayPhoneNumber: input.displayPhoneNumber?.trim() || null,
    webhookVerifyToken: input.webhookVerifyToken?.trim() || null,
    accessToken: input.accessToken?.trim() || null,
    notes: input.notes?.trim() || null,
    approvedBy: input.approvedBy?.trim() || null,
    aiModeEnabled: input.aiModeEnabled ?? true
  };
}
