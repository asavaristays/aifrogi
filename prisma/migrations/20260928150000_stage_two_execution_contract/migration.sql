ALTER TABLE "SovereignAnswerEvidence"
ADD COLUMN "executionContractVersion" TEXT NOT NULL DEFAULT '1.0',
ADD COLUMN "terminalOutcome" TEXT NOT NULL DEFAULT 'ANSWERED',
ADD COLUMN "authorityLevel" TEXT NOT NULL DEFAULT 'INFORMATION',
ADD COLUMN "flowId" TEXT,
ADD COLUMN "flowVersion" INTEGER,
ADD COLUMN "flowNodeId" TEXT,
ADD COLUMN "endpointKey" TEXT,
ADD COLUMN "endpointVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "completionClaimAllowed" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "SovereignAnswerEvidence_propertyId_terminalOutcome_createdAt_idx"
ON "SovereignAnswerEvidence"("propertyId", "terminalOutcome", "createdAt");

CREATE INDEX "SovereignAnswerEvidence_propertyId_endpointVerified_createdAt_idx"
ON "SovereignAnswerEvidence"("propertyId", "endpointVerified", "createdAt");
