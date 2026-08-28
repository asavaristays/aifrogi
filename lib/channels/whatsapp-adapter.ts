import type {
  ChannelAdapter,
  ChannelInboundEvent,
  ChannelSendResult,
  DeliveryState,
  NormalizedInbound,
  NormalizedMessage,
  NormalizedParticipant,
  SendMessageInput,
  SendStructuredMessageInput
} from "@/lib/channels/contracts";

type WhatsAppInboundPayload = {
  messages?: Array<{
    id?: string;
    from?: string;
    body?: string;
    type?: string;
    timestamp?: string | number | Date;
    profileName?: string;
  }>;
};

export type WhatsAppCompatibilityPort = {
  sendText(input: SendMessageInput): Promise<ChannelSendResult>;
  sendTemplate(input: SendStructuredMessageInput): Promise<ChannelSendResult>;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function date(value: unknown) {
  if (value instanceof Date) return value;
  const parsed = new Date(typeof value === "number" ? value : text(value));
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

export class WhatsAppChannelAdapter implements ChannelAdapter {
  readonly kind = "WHATSAPP" as const;

  constructor(private readonly compatibility: WhatsAppCompatibilityPort) {}

  async receiveInboundEvent(event: ChannelInboundEvent): Promise<NormalizedInbound[]> {
    const payload = record(event.payload) as WhatsAppInboundPayload;
    return (payload.messages || []).map((message) => ({
      workspaceId: event.workspaceId,
      connectionId: event.connectionId,
      channel: this.kind,
      participant: this.normalizeParticipant(message),
      message: this.normalizeMessage({ ...message, fallbackEventId: event.externalEventId })
    }));
  }

  normalizeParticipant(input: unknown): NormalizedParticipant {
    const value = record(input);
    const phone = text(value.from);
    if (!phone) throw new Error("WhatsApp participant phone is required");
    return {
      externalKey: phone,
      kind: "CUSTOMER",
      displayName: text(value.profileName) || undefined,
      phone
    };
  }

  normalizeMessage(input: unknown): NormalizedMessage {
    const value = record(input);
    const externalMessageId = text(value.id) || undefined;
    const fallbackEventId = text(value.fallbackEventId);
    const body = text(value.body);
    return {
      externalMessageId,
      idempotencyKey: `WHATSAPP:${externalMessageId || fallbackEventId}`,
      direction: "INBOUND",
      body,
      contentType: text(value.type) || "text",
      occurredAt: date(value.timestamp),
      metadata: body ? undefined : { emptyBody: true }
    };
  }

  sendMessage(input: SendMessageInput) {
    return this.compatibility.sendText(input);
  }

  sendStructuredMessage(input: SendStructuredMessageInput) {
    return this.compatibility.sendTemplate(input);
  }

  async getSessionState() {
    return { active: true };
  }

  async validateOutboundPolicy(input: SendMessageInput | SendStructuredMessageInput) {
    if (!input.idempotencyKey.trim()) return { allowed: false, reason: "Idempotency key is required" };
    if (!input.participantExternalKey.trim()) return { allowed: false, reason: "Recipient is required" };
    if (!("template" in input) && !input.body.trim()) return { allowed: false, reason: "Message body is required" };
    return { allowed: true };
  }

  mapDeliveryStatus(status: string): DeliveryState {
    const normalized = status.trim().toLowerCase();
    if (normalized === "queued" || normalized === "accepted") return "QUEUED";
    if (normalized === "sent") return "SENT";
    if (normalized === "delivered") return "DELIVERED";
    if (normalized === "read") return "READ";
    if (["failed", "undelivered", "rejected"].includes(normalized)) return "FAILED";
    return "UNKNOWN";
  }

  handleChannelError(error: unknown): ChannelSendResult {
    return {
      accepted: false,
      deliveryState: "FAILED",
      errorCode: "WHATSAPP_ERROR",
      errorMessage: error instanceof Error ? error.message : "Unknown WhatsApp error"
    };
  }
}

