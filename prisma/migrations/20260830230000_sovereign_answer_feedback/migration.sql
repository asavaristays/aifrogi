CREATE TABLE "SovereignAnswerFeedback" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "evidenceId" TEXT NOT NULL,
  "leadId" TEXT,
  "helpful" BOOLEAN NOT NULL,
  "reason" TEXT,
  "source" TEXT NOT NULL DEFAULT 'WEBSITE_WIDGET',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SovereignAnswerFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SovereignAnswerFeedback_evidenceId_key" ON "SovereignAnswerFeedback"("evidenceId");
CREATE INDEX "SovereignAnswerFeedback_propertyId_helpful_createdAt_idx" ON "SovereignAnswerFeedback"("propertyId", "helpful", "createdAt");
CREATE INDEX "SovereignAnswerFeedback_leadId_createdAt_idx" ON "SovereignAnswerFeedback"("leadId", "createdAt");
ALTER TABLE "SovereignAnswerFeedback" ADD CONSTRAINT "SovereignAnswerFeedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SovereignAnswerFeedback" ADD CONSTRAINT "SovereignAnswerFeedback_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "SovereignAnswerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
