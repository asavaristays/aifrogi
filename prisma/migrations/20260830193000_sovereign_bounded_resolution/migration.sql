ALTER TABLE "WebsiteVisitorSession" ADD COLUMN "resolutionState" JSONB;

ALTER TABLE "SovereignAnswerEvidence"
  ADD COLUMN "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "safetyClassification" TEXT NOT NULL DEFAULT 'STANDARD',
  ADD COLUMN "permittedOperation" TEXT NOT NULL DEFAULT 'ANSWER',
  ADD COLUMN "resolutionState" TEXT NOT NULL DEFAULT 'RESOLVED',
  ADD COLUMN "clarifyCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "circuitBreaker" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "circuitBreakerReason" TEXT,
  ADD COLUMN "evaluationVersion" TEXT NOT NULL DEFAULT '1.1';

CREATE INDEX "SovereignAnswerEvidence_propertyId_circuitBreaker_createdAt_idx"
  ON "SovereignAnswerEvidence"("propertyId", "circuitBreaker", "createdAt");
