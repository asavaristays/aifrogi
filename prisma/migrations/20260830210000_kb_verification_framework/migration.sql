ALTER TABLE "BotProfile"
  ADD COLUMN "kbGateVersion" TEXT,
  ADD COLUMN "kbCoverageMinimum" INTEGER NOT NULL DEFAULT 80;

ALTER TABLE "SovereignAnswerEvidence"
  ADD COLUMN "knowledgeClaimIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "KnowledgeEntry"
  ADD COLUMN "claimKey" TEXT,
  ADD COLUMN "claimType" TEXT NOT NULL DEFAULT 'FACT',
  ADD COLUMN "valueType" TEXT NOT NULL DEFAULT 'TEXT',
  ADD COLUMN "currency" TEXT,
  ADD COLUMN "effectiveAt" TIMESTAMP(3),
  ADD COLUMN "expiresAt" TIMESTAMP(3),
  ADD COLUMN "refreshDays" INTEGER NOT NULL DEFAULT 90,
  ADD COLUMN "reliability" TEXT NOT NULL DEFAULT 'CLIENT_CONFIRMED',
  ADD COLUMN "authorityLevel" TEXT NOT NULL DEFAULT 'CLIENT_APPROVED_STRUCTURED',
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "supersedesId" TEXT,
  ADD COLUMN "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "validationErrors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "conflictStatus" TEXT NOT NULL DEFAULT 'CLEAR',
  ADD COLUMN "fieldApprovedBy" TEXT,
  ADD COLUMN "fieldApprovedAt" TIMESTAMP(3),
  ADD COLUMN "previewApprovedBy" TEXT,
  ADD COLUMN "previewApprovedAt" TIMESTAMP(3),
  ADD COLUMN "publishedAt" TIMESTAMP(3),
  ADD COLUMN "pausedAt" TIMESTAMP(3),
  ADD COLUMN "pauseReason" TEXT,
  ADD COLUMN "lastConfirmedAt" TIMESTAMP(3);

CREATE TABLE "KnowledgePreview" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "entryId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "generatedAnswer" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectedReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgePreview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeAnswerFlag" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "entryId" TEXT,
  "evidenceId" TEXT,
  "reporterType" TEXT NOT NULL DEFAULT 'CLIENT_ADMIN',
  "reporterId" TEXT,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "acknowledgeDueAt" TIMESTAMP(3) NOT NULL,
  "resolveDueAt" TIMESTAMP(3) NOT NULL,
  "acknowledgedAt" TIMESTAMP(3),
  "acknowledgedBy" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "resolvedBy" TEXT,
  "resolution" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeAnswerFlag_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "KnowledgeEntry_propertyId_claimKey_version_idx" ON "KnowledgeEntry"("propertyId", "claimKey", "version");
CREATE INDEX "KnowledgeEntry_propertyId_expiresAt_status_idx" ON "KnowledgeEntry"("propertyId", "expiresAt", "status");
CREATE INDEX "KnowledgeEntry_supersedesId_idx" ON "KnowledgeEntry"("supersedesId");
CREATE INDEX "KnowledgePreview_propertyId_status_createdAt_idx" ON "KnowledgePreview"("propertyId", "status", "createdAt");
CREATE INDEX "KnowledgePreview_entryId_status_idx" ON "KnowledgePreview"("entryId", "status");
CREATE INDEX "KnowledgeAnswerFlag_propertyId_status_resolveDueAt_idx" ON "KnowledgeAnswerFlag"("propertyId", "status", "resolveDueAt");
CREATE INDEX "KnowledgeAnswerFlag_entryId_status_idx" ON "KnowledgeAnswerFlag"("entryId", "status");
CREATE INDEX "KnowledgeAnswerFlag_evidenceId_idx" ON "KnowledgeAnswerFlag"("evidenceId");

ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "KnowledgePreview" ADD CONSTRAINT "KnowledgePreview_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgePreview" ADD CONSTRAINT "KnowledgePreview_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeAnswerFlag" ADD CONSTRAINT "KnowledgeAnswerFlag_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeAnswerFlag" ADD CONSTRAINT "KnowledgeAnswerFlag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
