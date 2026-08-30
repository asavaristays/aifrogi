ALTER TABLE "SovereignAnswerEvidence"
ADD COLUMN "failureLayer" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "failureCode" TEXT,
ADD COLUMN "latencyMs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "escalationTier" TEXT NOT NULL DEFAULT 'TIER_0_SELF_RESOLVE',
ADD COLUMN "degradedMode" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SovereignAnswerEvidence_propertyId_failureLayer_createdAt_idx"
ON "SovereignAnswerEvidence"("propertyId", "failureLayer", "createdAt");

CREATE INDEX "SovereignAnswerEvidence_propertyId_escalationTier_createdAt_idx"
ON "SovereignAnswerEvidence"("propertyId", "escalationTier", "createdAt");
