ALTER TABLE "BotConnectorConfiguration"
  ADD COLUMN "apiBaseUrl" TEXT,
  ADD COLUMN "authType" TEXT NOT NULL DEFAULT 'BEARER',
  ADD COLUMN "operationMapping" JSONB,
  ADD COLUMN "lastHealthStatus" TEXT,
  ADD COLUMN "lastHealthCode" INTEGER,
  ADD COLUMN "lastHealthAt" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT;

CREATE TABLE "BotConnectorCredential" (
  "id" TEXT NOT NULL,
  "connectorId" TEXT NOT NULL,
  "secretEncrypted" TEXT NOT NULL,
  "updatedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BotConnectorCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BotConnectorCredential_connectorId_key" ON "BotConnectorCredential"("connectorId");
ALTER TABLE "BotConnectorCredential" ADD CONSTRAINT "BotConnectorCredential_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "BotConnectorConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
