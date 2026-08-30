ALTER TABLE "SovereignAnswerEvidence"
ADD COLUMN "observedBehavior" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "decisionConsistent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "consistencyReason" TEXT;

CREATE INDEX "SovereignAnswerEvidence_propertyId_decisionConsistent_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "decisionConsistent", "createdAt");
