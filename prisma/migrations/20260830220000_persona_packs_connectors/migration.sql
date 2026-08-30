ALTER TABLE "BotProfile"
ADD COLUMN "personaPackVersion" TEXT NOT NULL DEFAULT '1.0';

CREATE TABLE "BotConnectorConfiguration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "connectorKey" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  "requiredFor" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "lifecycle" TEXT NOT NULL DEFAULT 'REQUESTED',
  "readOperations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "writeOperations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "unavailableBehavior" TEXT NOT NULL,
  "lastVerifiedAt" TIMESTAMP(3),
  "configuredBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotConnectorConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BotConnectorConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "BotConnectorConfiguration_organizationId_connectorKey_key" ON "BotConnectorConfiguration"("organizationId", "connectorKey");
CREATE INDEX "BotConnectorConfiguration_organizationId_lifecycle_idx" ON "BotConnectorConfiguration"("organizationId", "lifecycle");
CREATE INDEX "BotConnectorConfiguration_organizationId_required_enabled_idx" ON "BotConnectorConfiguration"("organizationId", "required", "enabled");
