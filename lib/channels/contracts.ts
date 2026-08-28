export const CHANNEL_KINDS = ["WHATSAPP", "WEBSITE", "EMAIL", "INSTAGRAM", "API", "VOICE"] as const;
export type ChannelKind = typeof CHANNEL_KINDS[number];

export type MessageDirection = "INBOUND" | "OUTBOUND" | "SYSTEM";
export type ParticipantKind = "CUSTOMER" | "HUMAN" | "BOT" | "SYSTEM";
export type DeliveryState = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED" | "UNKNOWN";

export type ChannelConnectionRef = {
  id: string;
  workspaceId: string;
  kind: ChannelKind;
  externalId?: string | null;
  enabled: boolean;
};

export type ChannelInboundEvent = {
  workspaceId: string;
  connectionId: string;
  externalEventId: string;
  receivedAt: Date;
  payload: unknown;
};

export type NormalizedParticipant = {
  externalKey: string;
  kind: ParticipantKind;
  displayName?: string;
  phone?: string;
  email?: string;
  metadata?: Record<string, unknown>;
};

export type NormalizedMessage = {
  externalMessageId?: string;
  idempotencyKey: string;
  direction: MessageDirection;
  body: string;
  contentType: string;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
};

export type NormalizedInbound = {
  workspaceId: string;
  connectionId: string;
  channel: ChannelKind;
  participant: NormalizedParticipant;
  message: NormalizedMessage;
};

export type SendMessageInput = {
  workspaceId: string;
  connection: ChannelConnectionRef;
  participantExternalKey: string;
  body: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type SendStructuredMessageInput = SendMessageInput & {
  template: string;
  locale?: string;
  variables?: string[];
};

export type ChannelSendResult = {
  accepted: boolean;
  externalMessageId?: string;
  deliveryState: DeliveryState;
  errorCode?: string;
  errorMessage?: string;
};

export type OutboundPolicyResult = {
  allowed: boolean;
  reason?: string;
  requiresConfirmation?: boolean;
};

export type ChannelSessionState = {
  active: boolean;
  replyWindowClosesAt?: Date;
  metadata?: Record<string, unknown>;
};

export interface ChannelAdapter {
  readonly kind: ChannelKind;
  receiveInboundEvent(event: ChannelInboundEvent): Promise<NormalizedInbound[]>;
  normalizeParticipant(input: unknown): NormalizedParticipant;
  normalizeMessage(input: unknown): NormalizedMessage;
  sendMessage(input: SendMessageInput): Promise<ChannelSendResult>;
  sendStructuredMessage(input: SendStructuredMessageInput): Promise<ChannelSendResult>;
  getSessionState(input: { workspaceId: string; participantExternalKey: string }): Promise<ChannelSessionState>;
  validateOutboundPolicy(input: SendMessageInput | SendStructuredMessageInput): Promise<OutboundPolicyResult>;
  mapDeliveryStatus(status: string): DeliveryState;
  handleChannelError(error: unknown): ChannelSendResult;
}

