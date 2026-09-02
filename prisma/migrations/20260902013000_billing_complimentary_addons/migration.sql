ALTER TABLE "Subscription"
  ADD COLUMN "complimentaryEndsAt" TIMESTAMP(3),
  ADD COLUMN "complimentaryReason" TEXT,
  ADD COLUMN "complimentaryGrantedBy" TEXT;

CREATE TABLE "BillingAddon" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "setupFeePaisa" INTEGER NOT NULL DEFAULT 0,
  "recurringFeePaisa" INTEGER NOT NULL DEFAULT 0,
  "externalFeeNote" TEXT,
  "billingInterval" TEXT NOT NULL DEFAULT 'ONE_TIME',
  "provisioningStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
  "paymentStatus" TEXT NOT NULL DEFAULT 'UNBILLED',
  "activatedAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingAddon_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BillingAddon_organizationId_provisioningStatus_idx" ON "BillingAddon"("organizationId", "provisioningStatus");
CREATE INDEX "BillingAddon_paymentStatus_idx" ON "BillingAddon"("paymentStatus");
ALTER TABLE "BillingAddon" ADD CONSTRAINT "BillingAddon_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
