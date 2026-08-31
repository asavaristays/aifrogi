ALTER TABLE "SovereignAnswerEvidence"
ADD COLUMN "personaCategory" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "personaVersion" TEXT NOT NULL DEFAULT 'UNKNOWN',
ADD COLUMN "retrievalCandidates" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "retrievedClaimIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "usedClaimIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "nearMissClaimIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "failureClassification" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "safeResolution" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "evidencePipelineVersion" TEXT NOT NULL DEFAULT '1.0';

CREATE TABLE "SovereignReplayCase" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "sourceEvidenceId" TEXT NOT NULL,
  "personaCategory" TEXT NOT NULL,
  "personaVersion" TEXT NOT NULL,
  "anonymizedQuestion" TEXT NOT NULL,
  "anonymizedPriorTurns" JSONB NOT NULL DEFAULT '[]',
  "expectedDisposition" TEXT NOT NULL,
  "expectedClaimIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "failureClassification" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
  "anonymizationVersion" TEXT NOT NULL DEFAULT '1.0',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "SovereignReplayCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SovereignReplayCase_sourceEvidenceId_key" ON "SovereignReplayCase"("sourceEvidenceId");
CREATE INDEX "SovereignReplayCase_propertyId_status_createdAt_idx" ON "SovereignReplayCase"("propertyId", "status", "createdAt");
CREATE INDEX "SovereignReplayCase_personaCategory_status_createdAt_idx" ON "SovereignReplayCase"("personaCategory", "status", "createdAt");
CREATE INDEX "SovereignAnswerEvidence_personaCategory_safeResolution_createdAt_idx" ON "SovereignAnswerEvidence"("personaCategory", "safeResolution", "createdAt");
CREATE INDEX "SovereignAnswerEvidence_propertyId_failureClassification_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "failureClassification", "createdAt");

ALTER TABLE "SovereignReplayCase" ADD CONSTRAINT "SovereignReplayCase_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SovereignReplayCase" ADD CONSTRAINT "SovereignReplayCase_sourceEvidenceId_fkey" FOREIGN KEY ("sourceEvidenceId") REFERENCES "SovereignAnswerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;
