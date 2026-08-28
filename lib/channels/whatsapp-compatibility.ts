import type { SendStructuredMessageInput } from "@/lib/channels/contracts";
import type { WhatsAppCompatibilityPort } from "@/lib/channels/whatsapp-adapter";
import { sendWhatsAppTemplateMessage } from "@/lib/services/whatsapp-service";

export function createWhatsAppCompatibilityPort(): WhatsAppCompatibilityPort {
  return {
    async sendText() {
      return {
        accepted: false,
        deliveryState: "FAILED",
        errorCode: "TEMPLATE_REQUIRED",
        errorMessage: "The current WhatsApp compatibility path requires an approved template outside the reply window"
      };
    },
    async sendTemplate(input: SendStructuredMessageInput) {
      try {
        const sent = await sendWhatsAppTemplateMessage({
          to: input.participantExternalKey,
          templateName: input.template,
          languageCode: input.locale,
          bodyVariables: input.variables,
          propertySlug: typeof input.metadata?.propertySlug === "string" ? input.metadata.propertySlug : undefined
        });
        if (sent.error || !sent.result) {
          return {
            accepted: false,
            deliveryState: "FAILED",
            errorCode: `WHATSAPP_${sent.status}`,
            errorMessage: sent.error || "WhatsApp rejected the template message"
          };
        }
        return {
          accepted: true,
          externalMessageId: sent.result.sid || undefined,
          deliveryState: "QUEUED"
        };
      } catch (error) {
        return {
          accepted: false,
          deliveryState: "FAILED",
          errorCode: "WHATSAPP_ERROR",
          errorMessage: error instanceof Error ? error.message : "Unknown WhatsApp error"
        };
      }
    }
  };
}
