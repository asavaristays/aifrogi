CREATE TABLE "AiOperation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'FOLLOW_UP',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "assignedTo" TEXT,
    "dueAt" TIMESTAMP(3),
    "outcomeType" TEXT,
    "outcomeValuePaisa" INTEGER,
    "outcomeEvidence" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AiOperation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AiOperation_propertyId_status_dueAt_idx" ON "AiOperation"("propertyId", "status", "dueAt");
CREATE INDEX "AiOperation_leadId_createdAt_idx" ON "AiOperation"("leadId", "createdAt");
CREATE INDEX "AiOperation_propertyId_outcomeType_completedAt_idx" ON "AiOperation"("propertyId", "outcomeType", "completedAt");

ALTER TABLE "AiOperation" ADD CONSTRAINT "AiOperation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AiOperation" ADD CONSTRAINT "AiOperation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
