import { featureFlags } from "@/lib/feature-flags";
import { mirrorLegacyWhatsAppInbound } from "@/lib/repositories/conversation-repository";

export type WhatsAppShadowInput = {
  propertySlug: string;
  legacyLeadId: string;
  participantExternalKey: string;
  displayName?: string;
  body: string;
  externalMessageId?: string;
  occurredAt: Date;
};

type ShadowWriter = (input: WhatsAppShadowInput) => Promise<unknown>;

export async function shadowWhatsAppInbound(
  input: WhatsAppShadowInput,
  options: { enabled?: boolean; write?: ShadowWriter } = {}
) {
  const enabled = options.enabled ?? featureFlags.channelShadowWriteForWorkspace(input.propertySlug);
  if (!enabled) return { attempted: false, mirrored: false } as const;

  try {
    await (options.write ?? mirrorLegacyWhatsAppInbound)(input);
    return { attempted: true, mirrored: true } as const;
  } catch (error) {
    console.error("Neutral WhatsApp shadow write failed", {
      propertySlug: input.propertySlug,
      externalMessageId: input.externalMessageId,
      error: error instanceof Error ? error.message : "Unknown shadow-write error"
    });
    return { attempted: true, mirrored: false } as const;
  }
}
