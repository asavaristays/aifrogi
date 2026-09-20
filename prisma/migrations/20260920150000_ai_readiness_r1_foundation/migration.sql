-- Internal AI Readiness R1: tenant-owned scan/evidence/workflow foundation.
-- No public route, bot answer path, booking path, or automatic website mutation
-- is introduced by this migration.

CREATE TYPE "ReadinessScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');
CREATE TYPE "ReadinessEvidenceStatus" AS ENUM ('PASS', 'FAIL', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE');
CREATE TYPE "ReadinessIssueStatus" AS ENUM ('DETECTED', 'REVIEW_REQUIRED', 'APPROVED', 'DECLINED', 'NOT_APPLICABLE', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED');
CREATE TYPE "ReadinessDeliveryRoute" AS ENUM ('AIFROGI_MANAGED', 'AGENCY_HANDOFF', 'CLIENT_GUIDANCE');

CREATE TABLE "ReadinessScan" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "sourceUrl" TEXT NOT NULL,
  "status" "ReadinessScanStatus" NOT NULL DEFAULT 'QUEUED',
  "idempotencyKey" TEXT NOT NULL,
  "requestPayload" JSONB,
  "result" JSONB,
  "requestedBy" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lockedAt" TIMESTAMP(3),
  "lockedBy" TEXT,
  "leaseExpiresAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "canceledBy" TEXT,
  "cancellationReason" TEXT,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReadinessScan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessEvidence" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scanId" TEXT NOT NULL,
  "pillar" TEXT NOT NULL,
  "checkKey" TEXT NOT NULL,
  "status" "ReadinessEvidenceStatus" NOT NULL,
  "observedValue" JSONB,
  "canonicalComparison" JSONB,
  "sourceUrl" TEXT,
  "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "evidenceHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessEvidence_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessIssue" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "scanId" TEXT NOT NULL,
  "evidenceId" TEXT,
  "pillar" TEXT NOT NULL,
  "checkKey" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "status" "ReadinessIssueStatus" NOT NULL DEFAULT 'DETECTED',
  "summary" TEXT NOT NULL,
  "proposedRemedy" TEXT,
  "remediationType" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReadinessIssue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessWorkItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "deliveryRoute" "ReadinessDeliveryRoute" NOT NULL,
  "owner" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3),
  "acceptanceCriterion" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "approvedBy" TEXT,
  "approvedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "completedAt" TIMESTAMP(3),
  "completionRecord" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReadinessWorkItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReadinessVerification" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "beforeScanId" TEXT NOT NULL,
  "afterScanId" TEXT NOT NULL,
  "rubricVersion" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "evidenceRefs" JSONB NOT NULL,
  "verifiedBy" TEXT NOT NULL,
  "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReadinessVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReadinessScan_idempotencyKey_key" ON "ReadinessScan"("idempotencyKey");
CREATE INDEX "ReadinessScan_organizationId_status_nextRunAt_idx" ON "ReadinessScan"("organizationId", "status", "nextRunAt");
CREATE INDEX "ReadinessScan_propertyId_createdAt_idx" ON "ReadinessScan"("propertyId", "createdAt");
CREATE INDEX "ReadinessScan_status_leaseExpiresAt_idx" ON "ReadinessScan"("status", "leaseExpiresAt");
CREATE UNIQUE INDEX "ReadinessEvidence_scanId_checkKey_key" ON "ReadinessEvidence"("scanId", "checkKey");
CREATE INDEX "ReadinessEvidence_organizationId_pillar_status_idx" ON "ReadinessEvidence"("organizationId", "pillar", "status");
CREATE UNIQUE INDEX "ReadinessIssue_evidenceId_key" ON "ReadinessIssue"("evidenceId");
CREATE INDEX "ReadinessIssue_organizationId_status_severity_idx" ON "ReadinessIssue"("organizationId", "status", "severity");
CREATE INDEX "ReadinessIssue_scanId_pillar_idx" ON "ReadinessIssue"("scanId", "pillar");
CREATE INDEX "ReadinessWorkItem_organizationId_status_dueAt_idx" ON "ReadinessWorkItem"("organizationId", "status", "dueAt");
CREATE INDEX "ReadinessWorkItem_propertyId_createdAt_idx" ON "ReadinessWorkItem"("propertyId", "createdAt");
CREATE INDEX "ReadinessWorkItem_issueId_idx" ON "ReadinessWorkItem"("issueId");
CREATE UNIQUE INDEX "ReadinessVerification_workItemId_key" ON "ReadinessVerification"("workItemId");
CREATE INDEX "ReadinessVerification_organizationId_verifiedAt_idx" ON "ReadinessVerification"("organizationId", "verifiedAt");
CREATE INDEX "ReadinessVerification_propertyId_rubricVersion_idx" ON "ReadinessVerification"("propertyId", "rubricVersion");

ALTER TABLE "ReadinessScan" ADD CONSTRAINT "ReadinessScan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessScan" ADD CONSTRAINT "ReadinessScan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessEvidence" ADD CONSTRAINT "ReadinessEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessEvidence" ADD CONSTRAINT "ReadinessEvidence_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ReadinessScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ReadinessScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "ReadinessEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ReadinessIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "ReadinessWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_beforeScanId_fkey" FOREIGN KEY ("beforeScanId") REFERENCES "ReadinessScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_afterScanId_fkey" FOREIGN KEY ("afterScanId") REFERENCES "ReadinessScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- A tenant may never create a readiness row that points at another tenant's
-- property, scan, issue or work item. Prisma relations alone cannot express
-- every multi-parent ownership invariant, so the database enforces them.
CREATE OR REPLACE FUNCTION aifrogi_security.enforce_readiness_organization_integrity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_TABLE_NAME = 'ReadinessScan' AND NOT EXISTS (
    SELECT 1 FROM "Property" p WHERE p.id = NEW."propertyId" AND p."organizationId" = NEW."organizationId"
  ) THEN RAISE EXCEPTION 'ReadinessScan property must belong to its organization'; END IF;

  IF TG_TABLE_NAME = 'ReadinessEvidence' AND NOT EXISTS (
    SELECT 1 FROM "ReadinessScan" s WHERE s.id = NEW."scanId" AND s."organizationId" = NEW."organizationId"
  ) THEN RAISE EXCEPTION 'ReadinessEvidence scan must belong to its organization'; END IF;

  IF TG_TABLE_NAME = 'ReadinessIssue' AND NOT EXISTS (
    SELECT 1 FROM "ReadinessScan" s WHERE s.id = NEW."scanId" AND s."organizationId" = NEW."organizationId"
  ) THEN RAISE EXCEPTION 'ReadinessIssue scan must belong to its organization'; END IF;

  IF TG_TABLE_NAME = 'ReadinessWorkItem' AND (
    NOT EXISTS (SELECT 1 FROM "Property" p WHERE p.id = NEW."propertyId" AND p."organizationId" = NEW."organizationId")
    OR NOT EXISTS (SELECT 1 FROM "ReadinessIssue" i WHERE i.id = NEW."issueId" AND i."organizationId" = NEW."organizationId")
  ) THEN RAISE EXCEPTION 'ReadinessWorkItem parents must belong to its organization'; END IF;

  IF TG_TABLE_NAME = 'ReadinessVerification' AND (
    NOT EXISTS (SELECT 1 FROM "Property" p WHERE p.id = NEW."propertyId" AND p."organizationId" = NEW."organizationId")
    OR NOT EXISTS (SELECT 1 FROM "ReadinessWorkItem" w WHERE w.id = NEW."workItemId" AND w."organizationId" = NEW."organizationId")
    OR NOT EXISTS (SELECT 1 FROM "ReadinessScan" b WHERE b.id = NEW."beforeScanId" AND b."organizationId" = NEW."organizationId")
    OR NOT EXISTS (SELECT 1 FROM "ReadinessScan" a WHERE a.id = NEW."afterScanId" AND a."organizationId" = NEW."organizationId")
  ) THEN RAISE EXCEPTION 'ReadinessVerification parents must belong to its organization'; END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER readiness_scan_organization_integrity BEFORE INSERT OR UPDATE ON "ReadinessScan" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.enforce_readiness_organization_integrity();
CREATE TRIGGER readiness_evidence_organization_integrity BEFORE INSERT OR UPDATE ON "ReadinessEvidence" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.enforce_readiness_organization_integrity();
CREATE TRIGGER readiness_issue_organization_integrity BEFORE INSERT OR UPDATE ON "ReadinessIssue" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.enforce_readiness_organization_integrity();
CREATE TRIGGER readiness_work_item_organization_integrity BEFORE INSERT OR UPDATE ON "ReadinessWorkItem" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.enforce_readiness_organization_integrity();
CREATE TRIGGER readiness_verification_organization_integrity BEFORE INSERT OR UPDATE ON "ReadinessVerification" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.enforce_readiness_organization_integrity();

-- Scan evidence is append-only. A correction is represented by a new scan and
-- linked verification, never by rewriting the original observation.
CREATE OR REPLACE FUNCTION aifrogi_security.prevent_readiness_evidence_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Readiness evidence is immutable; create a new scan evidence record instead';
END;
$$;
CREATE TRIGGER readiness_evidence_immutable BEFORE UPDATE ON "ReadinessEvidence" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.prevent_readiness_evidence_update();
