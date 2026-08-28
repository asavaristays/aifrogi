CREATE TYPE "ChannelKind" AS ENUM ('WHATSAPP', 'WEBSITE', 'EMAIL', 'INSTAGRAM', 'API', 'VOICE');
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('DRAFT', 'CONNECTING', 'CONNECTED', 'DEGRADED', 'DISABLED', 'ERROR');
CREATE TYPE "ParticipantKind" AS ENUM ('CUSTOMER', 'HUMAN', 'BOT', 'SYSTEM');
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'BOT_ACTIVE', 'HUMAN_OWNED', 'RESOLVED', 'CLOSED');
CREATE TYPE "NeutralMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'SYSTEM');

CREATE TABLE "ChannelConnection" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "kind" "ChannelKind" NOT NULL,
  "externalId" TEXT,
  "displayName" TEXT,
  "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'DRAFT',
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "configuration" JSONB,
  "credentialsReference" TEXT,
  "lastHealthyAt" TIMESTAMP(3),
  "lastErrorAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Participant" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "kind" "ParticipantKind" NOT NULL DEFAULT 'CUSTOMER',
  "externalKey" TEXT NOT NULL,
  "displayName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "channelConnectionId" TEXT,
  "legacyLeadId" TEXT,
  "externalConversationId" TEXT,
  "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
  "botPaused" BOOLEAN NOT NULL DEFAULT false,
  "humanOwnerEmail" TEXT,
  "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationParticipant" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leftAt" TIMESTAMP(3),
  CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "legacyLeadMessageId" TEXT,
  "externalMessageId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "direction" "NeutralMessageDirection" NOT NULL,
  "senderParticipantId" TEXT,
  "body" TEXT NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'text',
  "deliveryStatus" TEXT,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChannelConnection_propertyId_kind_externalId_key" ON "ChannelConnection"("propertyId", "kind", "externalId");
CREATE INDEX "ChannelConnection_propertyId_kind_enabled_idx" ON "ChannelConnection"("propertyId", "kind", "enabled");
CREATE INDEX "ChannelConnection_status_lastHealthyAt_idx" ON "ChannelConnection"("status", "lastHealthyAt");
CREATE UNIQUE INDEX "Participant_propertyId_kind_externalKey_key" ON "Participant"("propertyId", "kind", "externalKey");
CREATE INDEX "Participant_propertyId_phone_idx" ON "Participant"("propertyId", "phone");
CREATE INDEX "Participant_propertyId_email_idx" ON "Participant"("propertyId", "email");
CREATE UNIQUE INDEX "Conversation_channelConnectionId_externalConversationId_key" ON "Conversation"("channelConnectionId", "externalConversationId");
CREATE INDEX "Conversation_propertyId_status_lastMessageAt_idx" ON "Conversation"("propertyId", "status", "lastMessageAt");
CREATE INDEX "Conversation_legacyLeadId_idx" ON "Conversation"("legacyLeadId");
CREATE INDEX "Conversation_humanOwnerEmail_status_idx" ON "Conversation"("humanOwnerEmail", "status");
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_participantId_key" ON "ConversationParticipant"("conversationId", "participantId");
CREATE INDEX "ConversationParticipant_participantId_joinedAt_idx" ON "ConversationParticipant"("participantId", "joinedAt");
CREATE UNIQUE INDEX "Message_legacyLeadMessageId_key" ON "Message"("legacyLeadMessageId");
CREATE UNIQUE INDEX "Message_propertyId_idempotencyKey_key" ON "Message"("propertyId", "idempotencyKey");
CREATE UNIQUE INDEX "Message_conversationId_externalMessageId_key" ON "Message"("conversationId", "externalMessageId");
CREATE INDEX "Message_propertyId_occurredAt_idx" ON "Message"("propertyId", "occurredAt");
CREATE INDEX "Message_conversationId_occurredAt_idx" ON "Message"("conversationId", "occurredAt");
CREATE INDEX "Message_senderParticipantId_idx" ON "Message"("senderParticipantId");

ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_legacyLeadId_fkey" FOREIGN KEY ("legacyLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_legacyLeadMessageId_fkey" FOREIGN KEY ("legacyLeadMessageId") REFERENCES "LeadMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderParticipantId_fkey" FOREIGN KEY ("senderParticipantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
