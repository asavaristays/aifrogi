CREATE TYPE "BotCategory" AS ENUM ('BUSINESS_AI', 'PINGBOOK', 'FLOWCART', 'STAY', 'CUSTOM');
CREATE TYPE "BotOperatingMode" AS ENUM ('ANSWER_ONLY', 'LEAD_CAPTURE', 'APPROVED_ACTIONS', 'HUMAN_APPROVAL');

CREATE TABLE "BotProfile" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" "BotCategory" NOT NULL DEFAULT 'BUSINESS_AI',
  "operatingMode" "BotOperatingMode" NOT NULL DEFAULT 'LEAD_CAPTURE',
  "channels" "ChannelKind"[] NOT NULL DEFAULT ARRAY['WEBSITE']::"ChannelKind"[],
  "capabilities" TEXT[] NOT NULL DEFAULT ARRAY['ANSWER_QUESTIONS', 'CAPTURE_LEADS']::TEXT[],
  "humanHandoffEnabled" BOOLEAN NOT NULL DEFAULT true,
  "actionApprovalNeeded" BOOLEAN NOT NULL DEFAULT true,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "configuredBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotProfile_organizationId_key" ON "BotProfile"("organizationId");
ALTER TABLE "BotProfile" ADD CONSTRAINT "BotProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
