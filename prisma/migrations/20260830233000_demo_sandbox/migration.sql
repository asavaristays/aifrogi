ALTER TABLE "Organization"
ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "demoKey" TEXT;

CREATE UNIQUE INDEX "Organization_demoKey_key" ON "Organization"("demoKey");

CREATE TABLE "DemoSandbox" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" "BotCategory" NOT NULL,
  "fixtureVersion" TEXT NOT NULL DEFAULT '1.0',
  "fixture" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'READY',
  "resetCount" INTEGER NOT NULL DEFAULT 0,
  "lastResetAt" TIMESTAMP(3),
  "lastResetBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DemoSandbox_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DemoSandbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DemoSandbox_organizationId_key" ON "DemoSandbox"("organizationId");
CREATE INDEX "DemoSandbox_category_status_idx" ON "DemoSandbox"("category", "status");

CREATE TABLE "DemoConnectorEvent" (
  "id" TEXT NOT NULL,
  "demoSandboxId" TEXT NOT NULL,
  "connectorKey" TEXT NOT NULL,
  "operation" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "request" JSONB NOT NULL,
  "response" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DemoConnectorEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DemoConnectorEvent_demoSandboxId_fkey" FOREIGN KEY ("demoSandboxId") REFERENCES "DemoSandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "DemoConnectorEvent_demoSandboxId_idempotencyKey_key" ON "DemoConnectorEvent"("demoSandboxId", "idempotencyKey");
CREATE INDEX "DemoConnectorEvent_demoSandboxId_createdAt_idx" ON "DemoConnectorEvent"("demoSandboxId", "createdAt");
CREATE INDEX "DemoConnectorEvent_connectorKey_status_idx" ON "DemoConnectorEvent"("connectorKey", "status");
