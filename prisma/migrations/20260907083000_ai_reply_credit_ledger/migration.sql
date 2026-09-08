CREATE TABLE "AiCreditTransaction" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "credits" INTEGER NOT NULL,
  "packCode" TEXT,
  "amountPaisa" INTEGER NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "expiresAt" TIMESTAMP(3),
  "paymentReference" TEXT,
  "reason" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiCreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AiCreditTransaction_paymentReference_key" ON "AiCreditTransaction"("paymentReference");
CREATE INDEX "AiCreditTransaction_organizationId_expiresAt_idx" ON "AiCreditTransaction"("organizationId", "expiresAt");
CREATE INDEX "AiCreditTransaction_organizationId_kind_createdAt_idx" ON "AiCreditTransaction"("organizationId", "kind", "createdAt");
ALTER TABLE "AiCreditTransaction" ADD CONSTRAINT "AiCreditTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
