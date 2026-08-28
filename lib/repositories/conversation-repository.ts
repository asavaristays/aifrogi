import { getDb } from "@/lib/db";
import type {
  ChannelConnectionStatus,
  ChannelKind,
  ConversationStatus,
  NeutralMessageDirection,
  ParticipantKind
} from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

function database() {
  const db = getDb();
  if (!db) throw new Error("Database connection is unavailable");
  return db;
}

export async function saveChannelConnection(input: {
  propertyId: string;
  kind: ChannelKind;
  externalId?: string;
  displayName?: string;
  status?: ChannelConnectionStatus;
  enabled?: boolean;
  configuration?: Prisma.InputJsonValue;
  credentialsReference?: string;
}) {
  const db = database();
  const data = {
    displayName: input.displayName,
    status: input.status,
    enabled: input.enabled,
    configuration: input.configuration,
    credentialsReference: input.credentialsReference
  };
  if (!input.externalId) {
    return db.channelConnection.create({
      data: { propertyId: input.propertyId, kind: input.kind, ...data }
    });
  }
  return db.channelConnection.upsert({
    where: {
      propertyId_kind_externalId: {
        propertyId: input.propertyId,
        kind: input.kind,
        externalId: input.externalId
      }
    },
    update: data,
    create: {
      propertyId: input.propertyId,
      kind: input.kind,
      externalId: input.externalId,
      ...data
    }
  });
}

export async function saveParticipant(input: {
  propertyId: string;
  kind: ParticipantKind;
  externalKey: string;
  displayName?: string;
  phone?: string;
  email?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const db = database();
  const identity = {
    propertyId: input.propertyId,
    kind: input.kind,
    externalKey: input.externalKey
  };
  return db.participant.upsert({
    where: { propertyId_kind_externalKey: identity },
    update: {
      displayName: input.displayName,
      phone: input.phone,
      email: input.email,
      metadata: input.metadata
    },
    create: { ...identity, displayName: input.displayName, phone: input.phone, email: input.email, metadata: input.metadata }
  });
}

export async function createConversation(input: {
  propertyId: string;
  channelConnectionId?: string;
  legacyLeadId?: string;
  externalConversationId?: string;
  status?: ConversationStatus;
  participantIds?: string[];
  metadata?: Prisma.InputJsonValue;
}) {
  const db = database();
  return db.$transaction(async (tx) => {
    if (input.channelConnectionId) {
      const connection = await tx.channelConnection.findFirst({
        where: { id: input.channelConnectionId, propertyId: input.propertyId },
        select: { id: true }
      });
      if (!connection) throw new Error("Cross-workspace channel connection rejected");
    }
    if (input.legacyLeadId) {
      const lead = await tx.lead.findFirst({
        where: { id: input.legacyLeadId, propertyId: input.propertyId },
        select: { id: true }
      });
      if (!lead) throw new Error("Cross-workspace legacy lead rejected");
    }
    const participantIds = Array.from(new Set(input.participantIds || []));
    if (participantIds.length) {
      const owned = await tx.participant.count({
        where: { propertyId: input.propertyId, id: { in: participantIds } }
      });
      if (owned !== participantIds.length) throw new Error("Cross-workspace participant rejected");
    }
    return tx.conversation.create({
      data: {
        propertyId: input.propertyId,
        channelConnectionId: input.channelConnectionId,
        legacyLeadId: input.legacyLeadId,
        externalConversationId: input.externalConversationId,
        status: input.status,
        metadata: input.metadata,
        participants: participantIds.length ? {
          create: participantIds.map((participantId) => ({ participantId }))
        } : undefined
      },
      include: { participants: true }
    });
  });
}

export async function appendConversationMessage(input: {
  propertyId: string;
  conversationId: string;
  legacyLeadMessageId?: string;
  externalMessageId?: string;
  idempotencyKey: string;
  direction: NeutralMessageDirection;
  senderParticipantId?: string;
  body: string;
  contentType?: string;
  deliveryStatus?: string;
  occurredAt: Date;
  metadata?: Prisma.InputJsonValue;
}) {
  const db = database();
  return db.$transaction(async (tx) => {
    const conversation = await tx.conversation.findFirst({
      where: { id: input.conversationId, propertyId: input.propertyId },
      select: { id: true }
    });
    if (!conversation) throw new Error("Cross-workspace conversation access rejected");
    if (input.senderParticipantId) {
      const sender = await tx.participant.findFirst({
        where: { id: input.senderParticipantId, propertyId: input.propertyId },
        select: { id: true }
      });
      if (!sender) throw new Error("Cross-workspace message sender rejected");
    }
    return tx.message.upsert({
      where: {
        propertyId_idempotencyKey: {
          propertyId: input.propertyId,
          idempotencyKey: input.idempotencyKey
        }
      },
      update: {},
      create: {
        propertyId: input.propertyId,
        conversationId: input.conversationId,
        legacyLeadMessageId: input.legacyLeadMessageId,
        externalMessageId: input.externalMessageId,
        idempotencyKey: input.idempotencyKey,
        direction: input.direction,
        senderParticipantId: input.senderParticipantId,
        body: input.body,
        contentType: input.contentType || "text",
        deliveryStatus: input.deliveryStatus,
        occurredAt: input.occurredAt,
        metadata: input.metadata
      }
    });
  });
}

export async function listWorkspaceConversations(input: {
  propertyId: string;
  status?: ConversationStatus;
  take?: number;
}) {
  return database().conversation.findMany({
    where: { propertyId: input.propertyId, status: input.status },
    include: {
      channelConnection: { select: { id: true, kind: true, displayName: true, status: true } },
      participants: { include: { participant: true } },
      messages: { orderBy: { occurredAt: "desc" }, take: 1 }
    },
    orderBy: { lastMessageAt: "desc" },
    take: Math.min(Math.max(input.take || 50, 1), 100)
  });
}

export async function mirrorLegacyWhatsAppInbound(input: {
  propertySlug: string;
  legacyLeadId: string;
  participantExternalKey: string;
  displayName?: string;
  body: string;
  externalMessageId?: string;
  occurredAt: Date;
}) {
  const db = database();
  return db.$transaction(async (tx) => {
    const property = await tx.property.findUnique({
      where: { slug: input.propertySlug },
      select: { id: true }
    });
    if (!property) throw new Error("WhatsApp shadow workspace was not found");

    const lead = await tx.lead.findFirst({
      where: { id: input.legacyLeadId, propertyId: property.id },
      select: { id: true }
    });
    if (!lead) throw new Error("Cross-workspace WhatsApp shadow write rejected");

    const connection = await tx.channelConnection.upsert({
      where: {
        propertyId_kind_externalId: {
          propertyId: property.id,
          kind: "WHATSAPP",
          externalId: "legacy-whatsapp"
        }
      },
      update: { status: "CONNECTED", enabled: true },
      create: {
        propertyId: property.id,
        kind: "WHATSAPP",
        externalId: "legacy-whatsapp",
        displayName: "Existing WhatsApp connector",
        status: "CONNECTED",
        enabled: true
      }
    });

    const participant = await tx.participant.upsert({
      where: {
        propertyId_kind_externalKey: {
          propertyId: property.id,
          kind: "CUSTOMER",
          externalKey: input.participantExternalKey
        }
      },
      update: { displayName: input.displayName, phone: input.participantExternalKey },
      create: {
        propertyId: property.id,
        kind: "CUSTOMER",
        externalKey: input.participantExternalKey,
        displayName: input.displayName,
        phone: input.participantExternalKey
      }
    });

    const conversation = await tx.conversation.upsert({
      where: {
        channelConnectionId_externalConversationId: {
          channelConnectionId: connection.id,
          externalConversationId: lead.id
        }
      },
      update: { lastMessageAt: input.occurredAt, legacyLeadId: lead.id },
      create: {
        propertyId: property.id,
        channelConnectionId: connection.id,
        legacyLeadId: lead.id,
        externalConversationId: lead.id,
        lastMessageAt: input.occurredAt
      }
    });

    await tx.conversationParticipant.upsert({
      where: {
        conversationId_participantId: {
          conversationId: conversation.id,
          participantId: participant.id
        }
      },
      update: { leftAt: null },
      create: { conversationId: conversation.id, participantId: participant.id }
    });

    const legacyMessage = await tx.leadMessage.findFirst({
      where: input.externalMessageId
        ? { leadId: lead.id, externalMessageId: input.externalMessageId }
        : { leadId: lead.id, sender: "GUEST", body: input.body, sentAt: input.occurredAt },
      select: { id: true }
    });
    if (!legacyMessage) throw new Error("Legacy WhatsApp message was not found for shadow mapping");

    const idempotencyKey = `WHATSAPP:${input.externalMessageId || legacyMessage.id}`;
    const message = await tx.message.upsert({
      where: {
        propertyId_idempotencyKey: {
          propertyId: property.id,
          idempotencyKey
        }
      },
      update: {},
      create: {
        propertyId: property.id,
        conversationId: conversation.id,
        legacyLeadMessageId: legacyMessage.id,
        externalMessageId: input.externalMessageId,
        idempotencyKey,
        direction: "INBOUND",
        senderParticipantId: participant.id,
        body: input.body,
        occurredAt: input.occurredAt
      }
    });

    return { connection, participant, conversation, message };
  });
}
