CREATE TABLE "AgentGatewayClient" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "scopes" TEXT[] NOT NULL DEFAULT ARRAY['profile:read', 'availability:read']::TEXT[],
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "lastUsedAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedBy" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AgentGatewayClient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentGatewayClient_tokenHash_key" ON "AgentGatewayClient"("tokenHash");
CREATE INDEX "AgentGatewayClient_organizationId_enabled_revokedAt_idx" ON "AgentGatewayClient"("organizationId", "enabled", "revokedAt");
CREATE INDEX "AgentGatewayClient_expiresAt_revokedAt_idx" ON "AgentGatewayClient"("expiresAt", "revokedAt");
ALTER TABLE "AgentGatewayClient" ADD CONSTRAINT "AgentGatewayClient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
