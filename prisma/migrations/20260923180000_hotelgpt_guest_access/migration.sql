CREATE TABLE "HotelGuestAccessRequest" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "requestTokenHash" TEXT NOT NULL,
  "guestName" TEXT NOT NULL,
  "roomNumber" TEXT NOT NULL,
  "requestedCheckIn" TIMESTAMP(3) NOT NULL,
  "requestedCheckOut" TIMESTAMP(3) NOT NULL,
  "approvedCheckOut" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "activatedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokedBy" TEXT,
  "leadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HotelGuestAccessRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HotelGuestAccessRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "HotelGuestAccessRequest_requestTokenHash_key" ON "HotelGuestAccessRequest"("requestTokenHash");
CREATE INDEX "HotelGuestAccessRequest_propertyId_status_createdAt_idx" ON "HotelGuestAccessRequest"("propertyId", "status", "createdAt");
CREATE INDEX "HotelGuestAccessRequest_approvedCheckOut_status_idx" ON "HotelGuestAccessRequest"("approvedCheckOut", "status");
CREATE INDEX "HotelGuestAccessRequest_leadId_idx" ON "HotelGuestAccessRequest"("leadId");

ALTER TABLE "HotelGuestAccessRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HotelGuestAccessRequest" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_tenant_isolation ON "HotelGuestAccessRequest"
USING (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "Property" p WHERE p.id = "HotelGuestAccessRequest"."propertyId" AND p."organizationId" = aifrogi_security.current_organization_id()))
WITH CHECK (aifrogi_security.has_platform_authority() OR EXISTS (SELECT 1 FROM "Property" p WHERE p.id = "HotelGuestAccessRequest"."propertyId" AND p."organizationId" = aifrogi_security.current_organization_id()));
