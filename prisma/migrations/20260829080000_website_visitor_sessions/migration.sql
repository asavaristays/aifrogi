CREATE TABLE "WebsiteVisitorSession" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sessionIdHash" TEXT NOT NULL,
    "capabilityHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AI_READY',
    "contactName" TEXT,
    "contactValue" TEXT,
    "consentText" TEXT,
    "consentedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastDeliveredAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WebsiteVisitorSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "WebsiteVisitorSession_leadId_key" ON "WebsiteVisitorSession"("leadId");
CREATE UNIQUE INDEX "WebsiteVisitorSession_capabilityHash_key" ON "WebsiteVisitorSession"("capabilityHash");
CREATE UNIQUE INDEX "WebsiteVisitorSession_propertyId_sessionIdHash_key" ON "WebsiteVisitorSession"("propertyId", "sessionIdHash");
CREATE INDEX "WebsiteVisitorSession_propertyId_status_updatedAt_idx" ON "WebsiteVisitorSession"("propertyId", "status", "updatedAt");
CREATE INDEX "WebsiteVisitorSession_expiresAt_revokedAt_idx" ON "WebsiteVisitorSession"("expiresAt", "revokedAt");
ALTER TABLE "WebsiteVisitorSession" ADD CONSTRAINT "WebsiteVisitorSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebsiteVisitorSession" ADD CONSTRAINT "WebsiteVisitorSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
