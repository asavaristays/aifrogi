-- Generated from repository base 99fb911 to the complete v6 Prisma proposal.

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('WEBSITE', 'PDF', 'SPREADSHEET', 'FORM', 'OWNER_CORRECTION', 'CONNECTOR');

-- CreateEnum
CREATE TYPE "KnowledgeSourceState" AS ENUM ('DRAFT', 'AUTHORIZED', 'PAUSED', 'REVOKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "KnowledgeAudience" AS ENUM ('PUBLIC', 'STAFF', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ClaimRevisionState" AS ENUM ('DRAFT', 'SEALED');

-- CreateEnum
CREATE TYPE "ClaimVerificationStatus" AS ENUM ('SUPPORTED', 'PARTIAL', 'CONTRADICTED', 'UNSUPPORTED');

-- CreateEnum
CREATE TYPE "CaptureState" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "KnowledgeObjectState" AS ENUM ('STAGED', 'USABLE', 'QUARANTINED', 'RETAINED_ORPHAN');

-- CreateEnum
CREATE TYPE "ApprovalPurpose" AS ENUM ('PREVIEW_ACKNOWLEDGEMENT', 'PUBLICATION_AUTHORIZATION', 'PUBLICATION_REVOCATION', 'SOURCE_CORRECTION');

-- CreateEnum
CREATE TYPE "ApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PublicationState" AS ENUM ('CANDIDATE', 'SEALED', 'REVOKED');

-- CreateEnum
CREATE TYPE "PreviewState" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "KnowledgePolicyMode" AS ENUM ('LEGACY', 'CLAIMS_ONLY', 'BLOCKED');

-- CreateEnum
CREATE TYPE "KnowledgeEventType" AS ENUM ('SUPERSEDED', 'WITHDRAWN', 'AUTHORITY_REVOKED');

-- CreateEnum
CREATE TYPE "OutboxState" AS ENUM ('PENDING', 'LEASED', 'DISPATCHED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "JobAttemptState" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "AnswerDeliveryState" AS ENUM ('PENDING', 'DELIVERED', 'SUPPRESSED', 'FAILED', 'HANDOVER');

-- CreateEnum
CREATE TYPE "HandoverState" AS ENUM ('RECORDED', 'QUEUED', 'PROVIDER_ACCEPTED', 'STAFF_ACKNOWLEDGED', 'RESOLVED', 'REOPENED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RetentionState" AS ENUM ('RETAIN', 'DISPOSAL_PROPOSED', 'DISPOSAL_APPROVED', 'DISPOSED');

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WebsiteSourceConsentStatus" AS ENUM ('TRIAL_AUTHORIZED', 'POST_TRIAL_APPROVED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "WebsiteSourceApprovalMethod" AS ENUM ('EMAIL', 'SIGNED_LETTER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
DECLARE actual text[];
BEGIN
  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO actual
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid=t.oid
   WHERE t.typname='WebsiteSourceConsentStatus';
  IF actual IS DISTINCT FROM ARRAY['TRIAL_AUTHORIZED','POST_TRIAL_APPROVED','REVOKED']::text[] THEN
    RAISE EXCEPTION 'INCOMPATIBLE_WEBSITE_CONSENT_STATUS_ENUM';
  END IF;
  SELECT array_agg(e.enumlabel ORDER BY e.enumsortorder)
    INTO actual
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid=t.oid
   WHERE t.typname='WebsiteSourceApprovalMethod';
  IF actual IS DISTINCT FROM ARRAY['EMAIL','SIGNED_LETTER']::text[] THEN
    RAISE EXCEPTION 'INCOMPATIBLE_WEBSITE_APPROVAL_METHOD_ENUM';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "ConversationParticipant" DROP CONSTRAINT "ConversationParticipant_participantId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderParticipantId_fkey";

-- DropIndex
DROP INDEX "ConversationParticipant_conversationId_participantId_key";

-- AlterTable
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "websiteConsentEnforcedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "KnowledgeEntry" ADD COLUMN     "audience" "KnowledgeAudience",
ADD COLUMN     "claimIdentityId" TEXT,
ADD COLUMN     "effectiveFrom" TIMESTAMP(3),
ADD COLUMN     "effectiveUntil" TIMESTAMP(3),
ADD COLUMN     "normalizedValue" JSONB,
ADD COLUMN     "quoteText" TEXT,
ADD COLUMN     "requiredComponents" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "revisionNumber" INTEGER,
ADD COLUMN     "revisionState" "ClaimRevisionState" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "sealManifestHash" TEXT,
ADD COLUMN     "sealPolicyVersion" TEXT,
ADD COLUMN     "sealedAt" TIMESTAMP(3),
ADD COLUMN     "sealedBy" TEXT,
ADD COLUMN     "valueHash" TEXT,
ADD COLUMN     "verificationStatus" "ClaimVerificationStatus";

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "propertyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "AutomationJob" ADD COLUMN     "canonicalInputHash" TEXT,
ADD COLUMN     "fencingToken" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "inputGeneration" BIGINT NOT NULL DEFAULT 1,
ADD COLUMN     "operationKey" TEXT,
ADD COLUMN     "operationType" TEXT,
ADD COLUMN     "operationVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "KnowledgeClaimIdentity" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "stableKey" TEXT NOT NULL,
    "entityKey" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "qualifiers" JSONB NOT NULL,
    "keyVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeClaimIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSource" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "canonicalIdentity" TEXT NOT NULL,
    "canonicalIdentityHash" TEXT NOT NULL,
    "state" "KnowledgeSourceState" NOT NULL DEFAULT 'DRAFT',
    "audienceCeiling" "KnowledgeAudience" NOT NULL,
    "currentRevision" INTEGER NOT NULL DEFAULT 0,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeSourceRevision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "configuration" JSONB NOT NULL,
    "configurationHash" TEXT NOT NULL,
    "consentId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeSourceRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceCapture" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "sourceRevisionId" TEXT NOT NULL,
    "requestedGeneration" BIGINT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "status" "CaptureState" NOT NULL DEFAULT 'QUEUED',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SourceCapture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeObject" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "storageNamespace" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "byteSize" BIGINT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "state" "KnowledgeObjectState" NOT NULL DEFAULT 'STAGED',
    "stagingTokenHash" TEXT NOT NULL,
    "finalizedByJobId" TEXT,
    "finalizedFence" BIGINT,
    "retainUntil" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usableAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeObjectReference" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "retainUntil" TIMESTAMP(3),
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeObjectReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaptureVersion" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaptureVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeExtractionRun" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "captureVersionId" TEXT NOT NULL,
    "extractorVersion" TEXT NOT NULL,
    "normalizationVersion" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "status" "CaptureState" NOT NULL DEFAULT 'QUEUED',
    "resultManifestHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "KnowledgeExtractionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeClaimEvidence" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "captureVersionId" TEXT NOT NULL,
    "locator" JSONB NOT NULL,
    "locatorHash" TEXT NOT NULL,
    "quotation" TEXT NOT NULL,
    "quotationHash" TEXT NOT NULL,
    "supportedComponents" TEXT[],
    "bindingHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeClaimEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRevisionEvidenceBinding" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "evidenceId" TEXT NOT NULL,
    "bindingHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRevisionEvidenceBinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeClaimConflict" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "lowerEntryId" TEXT NOT NULL,
    "higherEntryId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "blocking" BOOLEAN NOT NULL DEFAULT true,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeClaimConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeApprovalEvidence" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "purpose" "ApprovalPurpose" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "scopeManifest" JSONB NOT NULL,
    "scopeHash" TEXT NOT NULL,
    "audience" "KnowledgeAudience",
    "policyVersion" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorEmailHash" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "supersedesId" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeApprovalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePublication" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "audience" "KnowledgeAudience" NOT NULL,
    "manifestHash" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "evidencePolicyVersion" TEXT NOT NULL,
    "approvalId" TEXT NOT NULL,
    "state" "PublicationState" NOT NULL DEFAULT 'CANDIDATE',
    "sealedAt" TIMESTAMP(3),
    "membershipClosedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePublicationClaim" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "claimIdentityId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "sealManifestHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePublicationClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeServingPointer" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "audience" "KnowledgeAudience" NOT NULL,
    "publicationId" TEXT NOT NULL,
    "pointerGeneration" BIGINT NOT NULL DEFAULT 1,
    "eligibilityGeneration" BIGINT NOT NULL DEFAULT 1,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeServingPointer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePolicyVersion" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "mode" "KnowledgePolicyMode" NOT NULL,
    "owner" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "publicationAutomation" BOOLEAN NOT NULL DEFAULT false,
    "freshnessRules" JSONB NOT NULL,
    "evidenceRules" JSONB NOT NULL,
    "policyHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyIntelligencePolicy" (
    "propertyId" TEXT NOT NULL,
    "currentPolicyVersionId" TEXT NOT NULL,
    "eligibilityGeneration" BIGINT NOT NULL DEFAULT 1,
    "reviewRequired" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyIntelligencePolicy_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "KnowledgePreviewSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "createdByMemberId" TEXT NOT NULL,
    "accessScope" JSONB NOT NULL,
    "accessScopeHash" TEXT NOT NULL,
    "candidateGeneration" BIGINT NOT NULL,
    "state" "PreviewState" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePreviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePreviewClaim" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "previewSessionId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "candidateGeneration" BIGINT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgePreviewClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeGuestSession" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "sessionHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeGuestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRevisionEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "eventType" "KnowledgeEventType" NOT NULL,
    "relatedEntryId" TEXT,
    "reason" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRevisionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAnswerAudit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "guestSessionId" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "pointerGeneration" BIGINT NOT NULL,
    "eligibilityGeneration" BIGINT NOT NULL,
    "selectedManifest" JSONB NOT NULL,
    "selectedManifestHash" TEXT NOT NULL,
    "validationResult" JSONB NOT NULL,
    "deliveryState" "AnswerDeliveryState" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeAnswerAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeAnswerOutcome" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "answerAuditId" TEXT NOT NULL,
    "deliveryKey" TEXT NOT NULL,
    "state" "AnswerDeliveryState" NOT NULL,
    "detail" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeAnswerOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeHandoverRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "guestSessionId" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeHandoverRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeHandoverEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "state" "HandoverState" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "attemptNumber" INTEGER,
    "provider" TEXT,
    "deliveryId" TEXT,
    "errorCode" TEXT,
    "actorId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeHandoverEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeOutboxEvent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "operationKey" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "state" "OutboxState" NOT NULL DEFAULT 'PENDING',
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseOwner" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "dispatchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeOutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJobAttempt" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "workerId" TEXT NOT NULL,
    "fencingToken" BIGINT NOT NULL,
    "state" "JobAttemptState" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "errorCode" TEXT,

    CONSTRAINT "AutomationJobAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeCertificationRun" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "policyVersionId" TEXT NOT NULL,
    "publicationId" TEXT,
    "suiteVersion" TEXT NOT NULL,
    "caseManifestHash" TEXT NOT NULL,
    "resultManifest" JSONB NOT NULL,
    "resultHash" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeCertificationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRetentionDecision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "objectReferenceId" TEXT NOT NULL,
    "state" "RetentionState" NOT NULL DEFAULT 'RETAIN',
    "policyVersion" TEXT NOT NULL,
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "decidedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRetentionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeMigrationDecision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "legacyEntryId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "proposedStableKey" TEXT,
    "sourceHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeMigrationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeMigrationArtifactDecision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "artifactType" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "sourcePathHash" TEXT,
    "contentHash" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "sourceId" TEXT,
    "objectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeMigrationArtifactDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRuntimePrincipalGrant" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "principalId" TEXT NOT NULL,
    "databaseRole" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeRuntimePrincipalGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "WebsiteSourceConsent" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceUrlHash" TEXT,
    "termsVersion" TEXT NOT NULL,
    "status" "WebsiteSourceConsentStatus" NOT NULL DEFAULT 'TRIAL_AUTHORIZED',
    "trialAuthorizedAt" TIMESTAMP(3) NOT NULL,
    "trialExpiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedByEmail" TEXT NOT NULL,
    "acceptedIpHash" TEXT,
    "postTrialMethod" "WebsiteSourceApprovalMethod",
    "postTrialApprovedBy" TEXT,
    "postTrialApprovedAt" TIMESTAMP(3),
    "approvalEvidenceRef" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL DEFAULT 'WEBSITE',
    "canonicalIdentity" TEXT,
    "canonicalIdentityHash" TEXT,
    "sourceId" TEXT,
    "authorityScope" JSONB,
    "audienceCeiling" "KnowledgeAudience" NOT NULL DEFAULT 'RESTRICTED',
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),

    CONSTRAINT "WebsiteSourceConsent_pkey" PRIMARY KEY ("id")
);

-- Production already contains the earlier consent ledger. Preserve its rows
-- and extend it to the canonical v6 shape instead of recreating it.
ALTER TABLE "WebsiteSourceConsent"
  ADD COLUMN IF NOT EXISTS "sourceType" "KnowledgeSourceType" NOT NULL DEFAULT 'WEBSITE',
  ADD COLUMN IF NOT EXISTS "canonicalIdentity" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalIdentityHash" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceId" TEXT,
  ADD COLUMN IF NOT EXISTS "authorityScope" JSONB,
  ADD COLUMN IF NOT EXISTS "audienceCeiling" "KnowledgeAudience" NOT NULL DEFAULT 'RESTRICTED',
  ADD COLUMN IF NOT EXISTS "effectiveFrom" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "effectiveUntil" TIMESTAMP(3);
ALTER TABLE "WebsiteSourceConsent"
  ALTER COLUMN "sourceUrl" DROP NOT NULL,
  ALTER COLUMN "sourceUrlHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "KnowledgeClaimIdentity_propertyId_entityKey_fieldKey_idx" ON "KnowledgeClaimIdentity"("propertyId", "entityKey", "fieldKey");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimIdentity_propertyId_stableKey_key" ON "KnowledgeClaimIdentity"("propertyId", "stableKey");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimIdentity_propertyId_id_key" ON "KnowledgeClaimIdentity"("propertyId", "id");

-- CreateIndex
CREATE INDEX "KnowledgeSource_propertyId_state_idx" ON "KnowledgeSource"("propertyId", "state");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSource_propertyId_sourceType_canonicalIdentityHash_key" ON "KnowledgeSource"("propertyId", "sourceType", "canonicalIdentityHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSource_propertyId_id_key" ON "KnowledgeSource"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSourceRevision_propertyId_sourceId_revision_key" ON "KnowledgeSourceRevision"("propertyId", "sourceId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSourceRevision_propertyId_sourceId_id_key" ON "KnowledgeSourceRevision"("propertyId", "sourceId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeSourceRevision_propertyId_id_key" ON "KnowledgeSourceRevision"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "SourceCapture_operationKey_key" ON "SourceCapture"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "SourceCapture_propertyId_sourceId_requestedGeneration_key" ON "SourceCapture"("propertyId", "sourceId", "requestedGeneration");

-- CreateIndex
CREATE UNIQUE INDEX "SourceCapture_propertyId_id_key" ON "SourceCapture"("propertyId", "id");

-- CreateIndex
CREATE INDEX "KnowledgeObject_propertyId_state_createdAt_idx" ON "KnowledgeObject"("propertyId", "state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeObject_propertyId_objectKey_key" ON "KnowledgeObject"("propertyId", "objectKey");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeObject_propertyId_checksum_key" ON "KnowledgeObject"("propertyId", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeObject_propertyId_id_key" ON "KnowledgeObject"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeObjectReference_propertyId_objectId_sourceId_purpo_key" ON "KnowledgeObjectReference"("propertyId", "objectId", "sourceId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeObjectReference_propertyId_id_key" ON "KnowledgeObjectReference"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureVersion_propertyId_captureId_checksum_key" ON "CaptureVersion"("propertyId", "captureId", "checksum");

-- CreateIndex
CREATE UNIQUE INDEX "CaptureVersion_propertyId_id_key" ON "CaptureVersion"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeExtractionRun_operationKey_key" ON "KnowledgeExtractionRun"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeExtractionRun_propertyId_captureVersionId_extracto_key" ON "KnowledgeExtractionRun"("propertyId", "captureVersionId", "extractorVersion", "normalizationVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeExtractionRun_propertyId_id_key" ON "KnowledgeExtractionRun"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimEvidence_propertyId_entryId_captureVersionId__key" ON "KnowledgeClaimEvidence"("propertyId", "entryId", "captureVersionId", "locatorHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimEvidence_propertyId_entryId_id_key" ON "KnowledgeClaimEvidence"("propertyId", "entryId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimEvidence_propertyId_id_key" ON "KnowledgeClaimEvidence"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRevisionEvidenceBinding_propertyId_entryId_evidenc_key" ON "KnowledgeRevisionEvidenceBinding"("propertyId", "entryId", "evidenceId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRevisionEvidenceBinding_propertyId_entryId_binding_key" ON "KnowledgeRevisionEvidenceBinding"("propertyId", "entryId", "bindingHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimConflict_propertyId_lowerEntryId_higherEntryI_key" ON "KnowledgeClaimConflict"("propertyId", "lowerEntryId", "higherEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeClaimConflict_propertyId_id_key" ON "KnowledgeClaimConflict"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeApprovalEvidence_propertyId_purpose_scopeHash_deci_key" ON "KnowledgeApprovalEvidence"("propertyId", "purpose", "scopeHash", "decision", "policyVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeApprovalEvidence_propertyId_id_key" ON "KnowledgeApprovalEvidence"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePublication_propertyId_audience_manifestHash_polic_key" ON "KnowledgePublication"("propertyId", "audience", "manifestHash", "policyVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePublication_propertyId_audience_id_key" ON "KnowledgePublication"("propertyId", "audience", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePublication_propertyId_id_key" ON "KnowledgePublication"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePublicationClaim_propertyId_publicationId_claimIde_key" ON "KnowledgePublicationClaim"("propertyId", "publicationId", "claimIdentityId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePublicationClaim_propertyId_publicationId_entryId_key" ON "KnowledgePublicationClaim"("propertyId", "publicationId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeServingPointer_propertyId_audience_key" ON "KnowledgeServingPointer"("propertyId", "audience");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePolicyVersion_propertyId_version_key" ON "KnowledgePolicyVersion"("propertyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePolicyVersion_propertyId_id_key" ON "KnowledgePolicyVersion"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyIntelligencePolicy_propertyId_currentPolicyVersionI_key" ON "PropertyIntelligencePolicy"("propertyId", "currentPolicyVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePreviewSession_propertyId_id_key" ON "KnowledgePreviewSession"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePreviewSession_propertyId_id_candidateGeneration_key" ON "KnowledgePreviewSession"("propertyId", "id", "candidateGeneration");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePreviewClaim_propertyId_previewSessionId_entryId_key" ON "KnowledgePreviewClaim"("propertyId", "previewSessionId", "entryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeGuestSession_propertyId_sessionHash_key" ON "KnowledgeGuestSession"("propertyId", "sessionHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeGuestSession_propertyId_conversationId_id_key" ON "KnowledgeGuestSession"("propertyId", "conversationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRevisionEvent_propertyId_entryId_eventType_related_key" ON "KnowledgeRevisionEvent"("propertyId", "entryId", "eventType", "relatedEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRevisionEvent_propertyId_id_key" ON "KnowledgeRevisionEvent"("propertyId", "id");

-- CreateIndex
CREATE INDEX "KnowledgeAnswerAudit_propertyId_conversationId_createdAt_idx" ON "KnowledgeAnswerAudit"("propertyId", "conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAnswerAudit_propertyId_id_key" ON "KnowledgeAnswerAudit"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeAnswerOutcome_propertyId_answerAuditId_deliveryKey_key" ON "KnowledgeAnswerOutcome"("propertyId", "answerAuditId", "deliveryKey");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeHandoverRequest_propertyId_requestHash_key" ON "KnowledgeHandoverRequest"("propertyId", "requestHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeHandoverRequest_propertyId_id_key" ON "KnowledgeHandoverRequest"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeHandoverEvent_propertyId_requestId_sequence_key" ON "KnowledgeHandoverEvent"("propertyId", "requestId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeHandoverEvent_provider_deliveryId_key" ON "KnowledgeHandoverEvent"("provider", "deliveryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeOutboxEvent_propertyId_operationKey_eventType_sche_key" ON "KnowledgeOutboxEvent"("propertyId", "operationKey", "eventType", "schemaVersion");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeOutboxEvent_propertyId_id_key" ON "KnowledgeOutboxEvent"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationJobAttempt_propertyId_jobId_attemptNumber_key" ON "AutomationJobAttempt"("propertyId", "jobId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationJobAttempt_propertyId_jobId_fencingToken_key" ON "AutomationJobAttempt"("propertyId", "jobId", "fencingToken");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCertificationRun_propertyId_policyVersionId_public_key" ON "KnowledgeCertificationRun"("propertyId", "policyVersionId", "publicationId", "suiteVersion", "caseManifestHash");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeCertificationRun_propertyId_id_key" ON "KnowledgeCertificationRun"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRetentionDecision_propertyId_objectReferenceId_pol_key" ON "KnowledgeRetentionDecision"("propertyId", "objectReferenceId", "policyVersion", "state");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRetentionDecision_propertyId_id_key" ON "KnowledgeRetentionDecision"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeMigrationDecision_batchId_legacyEntryId_key" ON "KnowledgeMigrationDecision"("batchId", "legacyEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeMigrationDecision_propertyId_id_key" ON "KnowledgeMigrationDecision"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeMigrationArtifactDecision_batchId_artifactType_leg_key" ON "KnowledgeMigrationArtifactDecision"("batchId", "artifactType", "legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeMigrationArtifactDecision_propertyId_id_key" ON "KnowledgeMigrationArtifactDecision"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRuntimePrincipalGrant_propertyId_principalId_datab_key" ON "KnowledgeRuntimePrincipalGrant"("propertyId", "principalId", "databaseRole", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRuntimePrincipalGrant_propertyId_id_key" ON "KnowledgeRuntimePrincipalGrant"("propertyId", "id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WebsiteSourceConsent_propertyId_status_trialExpiresAt_idx" ON "WebsiteSourceConsent"("propertyId", "status", "trialExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteSourceConsent_propertyId_sourceUrlHash_key" ON "WebsiteSourceConsent"("propertyId", "sourceUrlHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteSourceConsent_propertyId_sourceType_canonicalIdentit_key" ON "WebsiteSourceConsent"("propertyId", "sourceType", "canonicalIdentityHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WebsiteSourceConsent_propertyId_id_key" ON "WebsiteSourceConsent"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Property_id_organizationId_key" ON "Property"("id", "organizationId");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_propertyId_claimIdentityId_sealedAt_idx" ON "KnowledgeEntry"("propertyId", "claimIdentityId", "sealedAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntry_propertyId_id_key" ON "KnowledgeEntry"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntry_propertyId_claimIdentityId_revisionNumber_key" ON "KnowledgeEntry"("propertyId", "claimIdentityId", "revisionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeEntry_propertyId_claimIdentityId_id_sealManifestHa_key" ON "KnowledgeEntry"("propertyId", "claimIdentityId", "id", "sealManifestHash");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_id_key" ON "OrganizationMember"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_propertyId_id_key" ON "Participant"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_propertyId_id_key" ON "Conversation"("propertyId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_propertyId_conversationId_participa_key" ON "ConversationParticipant"("propertyId", "conversationId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationJob_operationKey_key" ON "AutomationJob"("operationKey");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationJob_propertyId_id_key" ON "AutomationJob"("propertyId", "id");

-- AddForeignKey
ALTER TABLE "KnowledgeClaimIdentity" ADD CONSTRAINT "KnowledgeClaimIdentity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceRevision" ADD CONSTRAINT "KnowledgeSourceRevision_propertyId_sourceId_fkey" FOREIGN KEY ("propertyId", "sourceId") REFERENCES "KnowledgeSource"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeSourceRevision" ADD CONSTRAINT "KnowledgeSourceRevision_propertyId_consentId_fkey" FOREIGN KEY ("propertyId", "consentId") REFERENCES "WebsiteSourceConsent"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCapture" ADD CONSTRAINT "SourceCapture_propertyId_sourceId_fkey" FOREIGN KEY ("propertyId", "sourceId") REFERENCES "KnowledgeSource"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceCapture" ADD CONSTRAINT "SourceCapture_propertyId_sourceId_sourceRevisionId_fkey" FOREIGN KEY ("propertyId", "sourceId", "sourceRevisionId") REFERENCES "KnowledgeSourceRevision"("propertyId", "sourceId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeObject" ADD CONSTRAINT "KnowledgeObject_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeObject" ADD CONSTRAINT "KnowledgeObject_propertyId_finalizedByJobId_fkey" FOREIGN KEY ("propertyId", "finalizedByJobId") REFERENCES "AutomationJob"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeObjectReference" ADD CONSTRAINT "KnowledgeObjectReference_propertyId_objectId_fkey" FOREIGN KEY ("propertyId", "objectId") REFERENCES "KnowledgeObject"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeObjectReference" ADD CONSTRAINT "KnowledgeObjectReference_propertyId_sourceId_fkey" FOREIGN KEY ("propertyId", "sourceId") REFERENCES "KnowledgeSource"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureVersion" ADD CONSTRAINT "CaptureVersion_propertyId_captureId_fkey" FOREIGN KEY ("propertyId", "captureId") REFERENCES "SourceCapture"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaptureVersion" ADD CONSTRAINT "CaptureVersion_propertyId_objectId_fkey" FOREIGN KEY ("propertyId", "objectId") REFERENCES "KnowledgeObject"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeExtractionRun" ADD CONSTRAINT "KnowledgeExtractionRun_propertyId_captureVersionId_fkey" FOREIGN KEY ("propertyId", "captureVersionId") REFERENCES "CaptureVersion"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeClaimEvidence" ADD CONSTRAINT "KnowledgeClaimEvidence_propertyId_entryId_fkey" FOREIGN KEY ("propertyId", "entryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeClaimEvidence" ADD CONSTRAINT "KnowledgeClaimEvidence_propertyId_captureVersionId_fkey" FOREIGN KEY ("propertyId", "captureVersionId") REFERENCES "CaptureVersion"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRevisionEvidenceBinding" ADD CONSTRAINT "KnowledgeRevisionEvidenceBinding_propertyId_entryId_fkey" FOREIGN KEY ("propertyId", "entryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRevisionEvidenceBinding" ADD CONSTRAINT "KnowledgeRevisionEvidenceBinding_propertyId_entryId_eviden_fkey" FOREIGN KEY ("propertyId", "entryId", "evidenceId") REFERENCES "KnowledgeClaimEvidence"("propertyId", "entryId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeClaimConflict" ADD CONSTRAINT "KnowledgeClaimConflict_propertyId_lowerEntryId_fkey" FOREIGN KEY ("propertyId", "lowerEntryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeClaimConflict" ADD CONSTRAINT "KnowledgeClaimConflict_propertyId_higherEntryId_fkey" FOREIGN KEY ("propertyId", "higherEntryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeApprovalEvidence" ADD CONSTRAINT "KnowledgeApprovalEvidence_propertyId_supersedesId_fkey" FOREIGN KEY ("propertyId", "supersedesId") REFERENCES "KnowledgeApprovalEvidence"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePublication" ADD CONSTRAINT "KnowledgePublication_propertyId_approvalId_fkey" FOREIGN KEY ("propertyId", "approvalId") REFERENCES "KnowledgeApprovalEvidence"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePublicationClaim" ADD CONSTRAINT "KnowledgePublicationClaim_propertyId_publicationId_fkey" FOREIGN KEY ("propertyId", "publicationId") REFERENCES "KnowledgePublication"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePublicationClaim" ADD CONSTRAINT "KnowledgePublicationClaim_propertyId_claimIdentityId_fkey" FOREIGN KEY ("propertyId", "claimIdentityId") REFERENCES "KnowledgeClaimIdentity"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePublicationClaim" ADD CONSTRAINT "KnowledgePublicationClaim_propertyId_claimIdentityId_entry_fkey" FOREIGN KEY ("propertyId", "claimIdentityId", "entryId", "sealManifestHash") REFERENCES "KnowledgeEntry"("propertyId", "claimIdentityId", "id", "sealManifestHash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeServingPointer" ADD CONSTRAINT "KnowledgeServingPointer_propertyId_audience_publicationId_fkey" FOREIGN KEY ("propertyId", "audience", "publicationId") REFERENCES "KnowledgePublication"("propertyId", "audience", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePolicyVersion" ADD CONSTRAINT "KnowledgePolicyVersion_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIntelligencePolicy" ADD CONSTRAINT "PropertyIntelligencePolicy_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyIntelligencePolicy" ADD CONSTRAINT "PropertyIntelligencePolicy_propertyId_currentPolicyVersion_fkey" FOREIGN KEY ("propertyId", "currentPolicyVersionId") REFERENCES "KnowledgePolicyVersion"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreviewSession" ADD CONSTRAINT "KnowledgePreviewSession_propertyId_organizationId_fkey" FOREIGN KEY ("propertyId", "organizationId") REFERENCES "Property"("id", "organizationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreviewSession" ADD CONSTRAINT "KnowledgePreviewSession_organizationId_createdByMemberId_fkey" FOREIGN KEY ("organizationId", "createdByMemberId") REFERENCES "OrganizationMember"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreviewClaim" ADD CONSTRAINT "KnowledgePreviewClaim_propertyId_previewSessionId_candidat_fkey" FOREIGN KEY ("propertyId", "previewSessionId", "candidateGeneration") REFERENCES "KnowledgePreviewSession"("propertyId", "id", "candidateGeneration") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreviewClaim" ADD CONSTRAINT "KnowledgePreviewClaim_propertyId_entryId_fkey" FOREIGN KEY ("propertyId", "entryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGuestSession" ADD CONSTRAINT "KnowledgeGuestSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGuestSession" ADD CONSTRAINT "KnowledgeGuestSession_propertyId_conversationId_fkey" FOREIGN KEY ("propertyId", "conversationId") REFERENCES "Conversation"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRevisionEvent" ADD CONSTRAINT "KnowledgeRevisionEvent_propertyId_entryId_fkey" FOREIGN KEY ("propertyId", "entryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRevisionEvent" ADD CONSTRAINT "KnowledgeRevisionEvent_propertyId_relatedEntryId_fkey" FOREIGN KEY ("propertyId", "relatedEntryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerAudit" ADD CONSTRAINT "KnowledgeAnswerAudit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerAudit" ADD CONSTRAINT "KnowledgeAnswerAudit_propertyId_conversationId_fkey" FOREIGN KEY ("propertyId", "conversationId") REFERENCES "Conversation"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerAudit" ADD CONSTRAINT "KnowledgeAnswerAudit_propertyId_conversationId_guestSessio_fkey" FOREIGN KEY ("propertyId", "conversationId", "guestSessionId") REFERENCES "KnowledgeGuestSession"("propertyId", "conversationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerAudit" ADD CONSTRAINT "KnowledgeAnswerAudit_propertyId_publicationId_fkey" FOREIGN KEY ("propertyId", "publicationId") REFERENCES "KnowledgePublication"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerOutcome" ADD CONSTRAINT "KnowledgeAnswerOutcome_propertyId_answerAuditId_fkey" FOREIGN KEY ("propertyId", "answerAuditId") REFERENCES "KnowledgeAnswerAudit"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeHandoverRequest" ADD CONSTRAINT "KnowledgeHandoverRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeHandoverRequest" ADD CONSTRAINT "KnowledgeHandoverRequest_propertyId_conversationId_fkey" FOREIGN KEY ("propertyId", "conversationId") REFERENCES "Conversation"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeHandoverRequest" ADD CONSTRAINT "KnowledgeHandoverRequest_propertyId_conversationId_guestSe_fkey" FOREIGN KEY ("propertyId", "conversationId", "guestSessionId") REFERENCES "KnowledgeGuestSession"("propertyId", "conversationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeHandoverEvent" ADD CONSTRAINT "KnowledgeHandoverEvent_propertyId_requestId_fkey" FOREIGN KEY ("propertyId", "requestId") REFERENCES "KnowledgeHandoverRequest"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJobAttempt" ADD CONSTRAINT "AutomationJobAttempt_propertyId_jobId_fkey" FOREIGN KEY ("propertyId", "jobId") REFERENCES "AutomationJob"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCertificationRun" ADD CONSTRAINT "KnowledgeCertificationRun_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCertificationRun" ADD CONSTRAINT "KnowledgeCertificationRun_propertyId_policyVersionId_fkey" FOREIGN KEY ("propertyId", "policyVersionId") REFERENCES "KnowledgePolicyVersion"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeCertificationRun" ADD CONSTRAINT "KnowledgeCertificationRun_propertyId_publicationId_fkey" FOREIGN KEY ("propertyId", "publicationId") REFERENCES "KnowledgePublication"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRetentionDecision" ADD CONSTRAINT "KnowledgeRetentionDecision_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRetentionDecision" ADD CONSTRAINT "KnowledgeRetentionDecision_propertyId_objectReferenceId_fkey" FOREIGN KEY ("propertyId", "objectReferenceId") REFERENCES "KnowledgeObjectReference"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeMigrationDecision" ADD CONSTRAINT "KnowledgeMigrationDecision_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeMigrationDecision" ADD CONSTRAINT "KnowledgeMigrationDecision_propertyId_legacyEntryId_fkey" FOREIGN KEY ("propertyId", "legacyEntryId") REFERENCES "KnowledgeEntry"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeMigrationArtifactDecision" ADD CONSTRAINT "KnowledgeMigrationArtifactDecision_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRuntimePrincipalGrant" ADD CONSTRAINT "KnowledgeRuntimePrincipalGrant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSourceConsent" DROP CONSTRAINT IF EXISTS "WebsiteSourceConsent_propertyId_fkey";
ALTER TABLE "WebsiteSourceConsent" ADD CONSTRAINT "WebsiteSourceConsent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteSourceConsent" ADD CONSTRAINT "WebsiteSourceConsent_propertyId_sourceId_fkey" FOREIGN KEY ("propertyId", "sourceId") REFERENCES "KnowledgeSource"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_propertyId_claimIdentityId_fkey" FOREIGN KEY ("propertyId", "claimIdentityId") REFERENCES "KnowledgeClaimIdentity"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_propertyId_conversationId_fkey" FOREIGN KEY ("propertyId", "conversationId") REFERENCES "Conversation"("propertyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_propertyId_participantId_fkey" FOREIGN KEY ("propertyId", "participantId") REFERENCES "Participant"("propertyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_propertyId_conversationId_fkey" FOREIGN KEY ("propertyId", "conversationId") REFERENCES "Conversation"("propertyId", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_propertyId_senderParticipantId_fkey" FOREIGN KEY ("propertyId", "senderParticipantId") REFERENCES "Participant"("propertyId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- P2-A v4 hand-written constraints, triggers, routines, RLS and privileges.
-- This section is part of the proposed DDL, not deferred application prose.
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS aifrogi_security;
REVOKE ALL ON SCHEMA aifrogi_security FROM PUBLIC;

ALTER TABLE "KnowledgeEntry" ALTER COLUMN "requiredComponents" SET NOT NULL;

ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_effective_order"
  CHECK ("effectiveUntil" IS NULL OR "effectiveFrom" IS NULL OR "effectiveUntil">"effectiveFrom");
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_revision_shape" CHECK (
  ("sealedAt" IS NULL AND "revisionState"='DRAFT') OR
  ("sealedAt" IS NOT NULL AND "revisionState"='SEALED' AND "claimIdentityId" IS NOT NULL
   AND "revisionNumber" IS NOT NULL AND "normalizedValue" IS NOT NULL AND "valueHash" IS NOT NULL
   AND audience IS NOT NULL AND "verificationStatus"='SUPPORTED' AND cardinality("requiredComponents")>0
   AND "sealManifestHash" IS NOT NULL AND "sealPolicyVersion" IS NOT NULL AND "sealedBy" IS NOT NULL)
);
ALTER TABLE "KnowledgeSource" ADD CONSTRAINT "KnowledgeSource_revocation_shape"
  CHECK ((state='REVOKED')=("revokedAt" IS NOT NULL));
ALTER TABLE "WebsiteSourceConsent" ADD CONSTRAINT "WebsiteSourceConsent_effective_order"
  CHECK ("effectiveUntil" IS NULL OR "effectiveFrom" IS NULL OR "effectiveUntil">"effectiveFrom");
ALTER TABLE "KnowledgeObject" ADD CONSTRAINT "KnowledgeObject_size" CHECK ("byteSize">=0);
ALTER TABLE "KnowledgeObject" ADD CONSTRAINT "KnowledgeObject_usable_shape" CHECK (
  state<>'USABLE' OR ("usableAt" IS NOT NULL AND "finalizedByJobId" IS NOT NULL AND "finalizedFence" IS NOT NULL)
);
ALTER TABLE "KnowledgePublication" ADD CONSTRAINT "KnowledgePublication_sealed_shape" CHECK (
  (state='CANDIDATE' AND "sealedAt" IS NULL AND "membershipClosedAt" IS NULL) OR
  (state='SEALED' AND "sealedAt" IS NOT NULL AND "membershipClosedAt" IS NOT NULL AND "revokedAt" IS NULL) OR
  (state='REVOKED' AND "sealedAt" IS NOT NULL AND "membershipClosedAt" IS NOT NULL AND "revokedAt" IS NOT NULL)
);
ALTER TABLE "KnowledgePreviewSession" ADD CONSTRAINT "KnowledgePreviewSession_time" CHECK ("expiresAt">"createdAt");
ALTER TABLE "KnowledgeGuestSession" ADD CONSTRAINT "KnowledgeGuestSession_time" CHECK ("expiresAt">"createdAt");
ALTER TABLE "KnowledgeClaimConflict" ADD CONSTRAINT "KnowledgeClaimConflict_order" CHECK ("lowerEntryId"<"higherEntryId");
ALTER TABLE "KnowledgePolicyVersion" ADD CONSTRAINT "KnowledgePolicy_no_auto_publication" CHECK ("publicationAutomation"=false);
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_knowledge_operation_shape" CHECK (
  "operationType" IS NULL OR
  ("operationType" IN ('KNOWLEDGE_CAPTURE','KNOWLEDGE_EXTRACTION','KNOWLEDGE_FINALIZE')
   AND "operationKey" IS NOT NULL AND "canonicalInputHash" IS NOT NULL AND "inputGeneration">0)
);

CREATE OR REPLACE FUNCTION aifrogi_security.current_property_id() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.property_id',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.current_organization_id() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.organization_id',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.has_platform_authority() RETURNS boolean
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT COALESCE(NULLIF(current_setting('app.platform_authority',true),'')::boolean,false)
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.hash_json(p_value jsonb) RETURNS text
LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public AS $$
  SELECT encode(public.digest(pg_catalog.convert_to(p_value::text,'UTF8'),'sha256'),'hex')
$$;
COMMENT ON FUNCTION aifrogi_security.hash_json(jsonb) IS
  'PG14_JSONB_V1: SHA-256 of PostgreSQL jsonb canonical text; version is embedded in every manifest.';

CREATE OR REPLACE FUNCTION aifrogi_security.guard_sealed_entry() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF OLD."sealedAt" IS NOT NULL THEN RAISE EXCEPTION 'SEALED_REVISION_IMMUTABLE'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER "KnowledgeEntry_sealed_immutable" BEFORE UPDATE OR DELETE ON "KnowledgeEntry"
FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_sealed_entry();

CREATE OR REPLACE FUNCTION aifrogi_security.guard_sealed_evidence() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE v_property text; v_entry text;
BEGIN
  IF TG_OP='DELETE' THEN v_property:=OLD."propertyId"; v_entry:=OLD."entryId";
  ELSE v_property:=NEW."propertyId"; v_entry:=NEW."entryId"; END IF;
  IF EXISTS (SELECT 1 FROM public."KnowledgeEntry" e WHERE e."propertyId"=v_property AND e.id=v_entry AND e."sealedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'SEALED_EVIDENCE_SET_IMMUTABLE'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER "KnowledgeClaimEvidence_sealed_guard" BEFORE INSERT OR UPDATE OR DELETE ON "KnowledgeClaimEvidence"
FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_sealed_evidence();
CREATE TRIGGER "KnowledgeRevisionEvidenceBinding_sealed_guard" BEFORE INSERT OR UPDATE OR DELETE ON "KnowledgeRevisionEvidenceBinding"
FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_sealed_evidence();

CREATE OR REPLACE FUNCTION aifrogi_security.guard_append_only() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN RAISE EXCEPTION '%_APPEND_ONLY',TG_TABLE_NAME; END $$;
CREATE TRIGGER "KnowledgeRevisionEvent_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeRevisionEvent" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeSourceRevision_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeSourceRevision" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "CaptureVersion_append_only" BEFORE UPDATE OR DELETE ON "CaptureVersion" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeApprovalEvidence_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeApprovalEvidence" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeAnswerAudit_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeAnswerAudit" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeAnswerOutcome_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeAnswerOutcome" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeHandoverRequest_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeHandoverRequest" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeHandoverEvent_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeHandoverEvent" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeCertificationRun_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeCertificationRun" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();
CREATE TRIGGER "KnowledgeRetentionDecision_append_only" BEFORE UPDATE OR DELETE ON "KnowledgeRetentionDecision" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_append_only();

CREATE OR REPLACE FUNCTION aifrogi_security.block_object_disposal() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_TABLE_NAME='KnowledgeObjectReference' THEN
  IF OLD."legalHold" OR OLD."releasedAt" IS NULL OR OLD."retainUntil" IS NULL OR OLD."retainUntil">clock_timestamp()
     OR NOT EXISTS (SELECT 1 FROM public."KnowledgeRetentionDecision" d WHERE d."propertyId"=OLD."propertyId" AND d."objectReferenceId"=OLD.id AND d.state='DISPOSAL_APPROVED' AND NOT d."legalHold")
  THEN RAISE EXCEPTION 'OBJECT_REFERENCE_RETENTION_BLOCK'; END IF;
 ELSE
  IF OLD."legalHold" OR OLD."retainUntil" IS NULL OR OLD."retainUntil">clock_timestamp()
     OR EXISTS (SELECT 1 FROM public."KnowledgeObjectReference" r WHERE r."propertyId"=OLD."propertyId" AND r."objectId"=OLD.id)
  THEN RAISE EXCEPTION 'OBJECT_RETENTION_BLOCK'; END IF;
 END IF;
 RETURN OLD;
END $$;
CREATE TRIGGER "KnowledgeObject_delete_guard" BEFORE DELETE ON "KnowledgeObject" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.block_object_disposal();
CREATE TRIGGER "KnowledgeObjectReference_delete_guard" BEFORE DELETE ON "KnowledgeObjectReference" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.block_object_disposal();

CREATE OR REPLACE FUNCTION aifrogi_security.validate_source_consent() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE s public."KnowledgeSource"%ROWTYPE; c public."WebsiteSourceConsent"%ROWTYPE;
BEGIN
  IF TG_TABLE_NAME='WebsiteSourceConsent' THEN
    IF NEW."sourceId" IS NULL THEN RETURN NEW; END IF;
    SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId";
    IF NEW."sourceType"<>s."sourceType" OR NEW."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash"
    THEN RAISE EXCEPTION 'CONSENT_SOURCE_IDENTITY_MISMATCH'; END IF;
  ELSE
    SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId";
    SELECT * INTO STRICT c FROM public."WebsiteSourceConsent" WHERE "propertyId"=NEW."propertyId" AND id=NEW."consentId";
    IF c."sourceId" IS DISTINCT FROM s.id OR c."sourceType"<>s."sourceType"
       OR c."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash"
    THEN RAISE EXCEPTION 'REVISION_CONSENT_SOURCE_MISMATCH'; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER "WebsiteSourceConsent_source_match" AFTER INSERT OR UPDATE ON "WebsiteSourceConsent"
DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION aifrogi_security.validate_source_consent();
CREATE CONSTRAINT TRIGGER "KnowledgeSourceRevision_consent_match" AFTER INSERT OR UPDATE ON "KnowledgeSourceRevision"
DEFERRABLE INITIALLY IMMEDIATE FOR EACH ROW EXECUTE FUNCTION aifrogi_security.validate_source_consent();

CREATE OR REPLACE FUNCTION aifrogi_security.seal_claim_revision(p_property text,p_entry text,p_actor text,p_policy text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public."KnowledgeEntry"%ROWTYPE; v_required text[]; v_covered text[]; v_bindings jsonb; v_manifest jsonb; v_hash text;
BEGIN
  IF p_property IS DISTINCT FROM aifrogi_security.current_property_id() AND NOT aifrogi_security.has_platform_authority() THEN RAISE EXCEPTION 'PROPERTY_CONTEXT_MISMATCH'; END IF;
  SELECT * INTO STRICT e FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=p_entry FOR UPDATE;
  IF e."sealedAt" IS NOT NULL OR e."revisionState"<>'DRAFT' THEN RAISE EXCEPTION 'REVISION_NOT_DRAFT'; END IF;
  IF e."claimIdentityId" IS NULL OR e."revisionNumber" IS NULL OR e."normalizedValue" IS NULL OR e."valueHash" IS NULL OR e.audience IS NULL OR e."verificationStatus"<>'SUPPORTED' OR cardinality(e."requiredComponents")=0 THEN RAISE EXCEPTION 'REVISION_INCOMPLETE'; END IF;
  SELECT COALESCE(array_agg(DISTINCT component ORDER BY component),ARRAY[]::text[])
  INTO v_covered
  FROM (SELECT b."evidenceId",ev."captureVersionId",ev."locatorHash",ev."quotationHash",ev."supportedComponents",b."bindingHash"
        FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON ev."propertyId"=b."propertyId" AND ev.id=b."evidenceId"
        WHERE b."propertyId"=p_property AND b."entryId"=p_entry) x
  LEFT JOIN LATERAL unnest(x."supportedComponents") component ON true;
  SELECT COALESCE(jsonb_agg(jsonb_build_object('evidenceId',x."evidenceId",'captureVersionId',x."captureVersionId",'locatorHash',x."locatorHash",'quotationHash',x."quotationHash",'supportedComponents',x."supportedComponents",'bindingHash',x."bindingHash") ORDER BY x."bindingHash"),'[]'::jsonb)
  INTO v_bindings
  FROM (SELECT b."evidenceId",ev."captureVersionId",ev."locatorHash",ev."quotationHash",ev."supportedComponents",b."bindingHash"
        FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON ev."propertyId"=b."propertyId" AND ev.id=b."evidenceId"
        WHERE b."propertyId"=p_property AND b."entryId"=p_entry) x;
  v_required:=ARRAY(SELECT DISTINCT x FROM unnest(e."requiredComponents") x ORDER BY x);
  IF v_bindings='[]'::jsonb OR NOT (v_covered @> v_required) THEN RAISE EXCEPTION 'FULL_STATEMENT_EVIDENCE_INSUFFICIENT'; END IF;
  v_manifest:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',e."propertyId",'claimIdentityId',e."claimIdentityId",'revisionNumber',e."revisionNumber",'normalizedValue',e."normalizedValue",'valueHash',e."valueHash",'quoteText',e."quoteText",'audience',e.audience,'effectiveFrom',e."effectiveFrom",'effectiveUntil',e."effectiveUntil",'policyVersion',p_policy,'requiredComponents',v_required,'bindings',v_bindings);
  v_hash:=aifrogi_security.hash_json(v_manifest);
  UPDATE public."KnowledgeEntry" SET "sealManifestHash"=v_hash,"sealPolicyVersion"=p_policy,"sealedAt"=clock_timestamp(),"sealedBy"=p_actor,"revisionState"='SEALED' WHERE "propertyId"=p_property AND id=p_entry;
  RETURN v_hash;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.eligible_claim(p_property text,p_entry text,p_audience public."KnowledgeAudience",p_as_of timestamptz,p_generation bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
SELECT EXISTS (
 SELECT 1 FROM public."KnowledgeEntry" e
 JOIN public."PropertyIntelligencePolicy" pip ON pip."propertyId"=e."propertyId" AND pip."eligibilityGeneration"=p_generation
 JOIN public."KnowledgePolicyVersion" pv ON pv."propertyId"=pip."propertyId" AND pv.id=pip."currentPolicyVersionId" AND pv.mode='CLAIMS_ONLY'
 WHERE e."propertyId"=p_property AND e.id=p_entry AND e."sealedAt" IS NOT NULL AND e."revisionState"='SEALED'
 AND e."verificationStatus"='SUPPORTED' AND e.audience=p_audience
 AND (e."effectiveFrom" IS NULL OR e."effectiveFrom"<=p_as_of) AND (e."effectiveUntil" IS NULL OR e."effectiveUntil">p_as_of)
 AND NOT EXISTS (SELECT 1 FROM public."KnowledgeRevisionEvent" re WHERE re."propertyId"=e."propertyId" AND re."entryId"=e.id AND re."eventType" IN ('WITHDRAWN','SUPERSEDED'))
 AND NOT EXISTS (SELECT 1 FROM public."KnowledgeClaimConflict" cc WHERE cc."propertyId"=e."propertyId" AND cc.blocking AND cc."resolvedAt" IS NULL AND e.id IN (cc."lowerEntryId",cc."higherEntryId"))
 AND e."requiredComponents" <@ ARRAY(
   SELECT DISTINCT comp FROM public."KnowledgeRevisionEvidenceBinding" b
   JOIN public."KnowledgeClaimEvidence" ev ON ev."propertyId"=b."propertyId" AND ev.id=b."evidenceId"
   JOIN public."CaptureVersion" cv ON cv."propertyId"=ev."propertyId" AND cv.id=ev."captureVersionId"
   JOIN public."KnowledgeObject" ko ON ko."propertyId"=cv."propertyId" AND ko.id=cv."objectId" AND ko.state='USABLE'
   JOIN public."SourceCapture" sc ON sc."propertyId"=cv."propertyId" AND sc.id=cv."captureId" AND sc.status='SUCCEEDED'
   JOIN public."KnowledgeSource" ks ON ks."propertyId"=sc."propertyId" AND ks.id=sc."sourceId" AND ks.state='AUTHORIZED'
   JOIN public."KnowledgeSourceRevision" sr ON sr."propertyId"=sc."propertyId" AND sr."sourceId"=sc."sourceId" AND sr.id=sc."sourceRevisionId"
   JOIN public."WebsiteSourceConsent" c ON c."propertyId"=sr."propertyId" AND c.id=sr."consentId" AND c."sourceId"=ks.id AND c."sourceType"=ks."sourceType" AND c."canonicalIdentityHash"=ks."canonicalIdentityHash"
   CROSS JOIN LATERAL unnest(ev."supportedComponents") comp
   WHERE b."propertyId"=e."propertyId" AND b."entryId"=e.id
     AND c.status<>'REVOKED' AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=p_as_of
     AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>p_as_of
     AND (p_audience<>'PUBLIC' OR c.status='POST_TRIAL_APPROVED')
     AND CASE c."audienceCeiling" WHEN 'PUBLIC' THEN 3 WHEN 'STAFF' THEN 2 ELSE 1 END >= CASE p_audience WHEN 'PUBLIC' THEN 3 WHEN 'STAFF' THEN 2 ELSE 1 END
     AND cv."capturedAt">=p_as_of-(COALESCE((pv."freshnessRules"->>'maxAgeDays')::int,e."refreshDays")*interval '1 day')
 )
)
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.guard_publication_membership() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE v_property text; v_publication text;
BEGIN
 IF TG_OP='DELETE' THEN v_property:=OLD."propertyId";v_publication:=OLD."publicationId"; ELSE v_property:=NEW."propertyId";v_publication:=NEW."publicationId"; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublication" p WHERE p."propertyId"=v_property AND p.id=v_publication AND p."membershipClosedAt" IS NOT NULL) THEN RAISE EXCEPTION 'PUBLICATION_MEMBERSHIP_CLOSED'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;
CREATE TRIGGER "KnowledgePublicationClaim_membership_guard" BEFORE INSERT OR UPDATE OR DELETE ON "KnowledgePublicationClaim" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_publication_membership();
CREATE OR REPLACE FUNCTION aifrogi_security.guard_sealed_publication() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN IF OLD."membershipClosedAt" IS NOT NULL THEN RAISE EXCEPTION 'SEALED_PUBLICATION_IMMUTABLE'; END IF; IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW; END $$;
CREATE TRIGGER "KnowledgePublication_immutable" BEFORE UPDATE OR DELETE ON "KnowledgePublication" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.guard_sealed_publication();

CREATE OR REPLACE FUNCTION aifrogi_security.seal_publication(p_property text,p_publication text,p_actor text,p_generation bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; v_members jsonb; v_manifest jsonb; v_hash text;
BEGIN
 IF p_property IS DISTINCT FROM aifrogi_security.current_property_id() AND NOT aifrogi_security.has_platform_authority() THEN RAISE EXCEPTION 'PROPERTY_CONTEXT_MISMATCH'; END IF;
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR UPDATE;
 IF p.state<>'CANDIDATE' OR p."membershipClosedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_NOT_CANDIDATE'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" WHERE "propertyId"=p_property AND "publicationId"=p_publication) THEN RAISE EXCEPTION 'EMPTY_PUBLICATION'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p.audience,clock_timestamp(),p_generation)) THEN RAISE EXCEPTION 'PUBLICATION_HAS_INELIGIBLE_CLAIM'; END IF;
 SELECT jsonb_agg(jsonb_build_object('claimIdentityId',pc."claimIdentityId",'entryId',pc."entryId",'sealManifestHash',pc."sealManifestHash") ORDER BY pc."claimIdentityId") INTO v_members FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication;
 v_manifest:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',p."propertyId",'audience',p.audience,'policyVersion',p."policyVersion",'evidencePolicyVersion',p."evidencePolicyVersion",'approvalId',p."approvalId",'claims',v_members);
 v_hash:=aifrogi_security.hash_json(v_manifest);
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeApprovalEvidence" a WHERE a."propertyId"=p_property AND a.id=p."approvalId" AND a.purpose='PUBLICATION_AUTHORIZATION' AND a.decision='APPROVED' AND a.audience=p.audience AND a."policyVersion"=p."policyVersion" AND a."scopeHash"=v_hash) THEN RAISE EXCEPTION 'EXACT_PUBLICATION_AUTHORIZATION_MISSING'; END IF;
 UPDATE public."KnowledgePublication" SET "manifestHash"=v_hash,state='SEALED',"sealedAt"=clock_timestamp(),"membershipClosedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_publication;
 RETURN v_hash;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.advance_serving_pointer(p_property text,p_audience public."KnowledgeAudience",p_publication text,p_expected_generation bigint,p_actor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; g bigint; eg bigint;
BEGIN
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR SHARE;
 SELECT "eligibilityGeneration" INTO STRICT eg FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 IF p.audience<>p_audience OR p.state<>'SEALED' OR p."membershipClosedAt" IS NULL OR p."revokedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_NOT_SERVABLE'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p_audience,clock_timestamp(),eg)) THEN RAISE EXCEPTION 'PUBLICATION_CURRENTLY_INELIGIBLE'; END IF;
 UPDATE public."KnowledgeServingPointer" SET "publicationId"=p_publication,"pointerGeneration"="pointerGeneration"+1,"eligibilityGeneration"=eg,"updatedBy"=p_actor,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND audience=p_audience AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO g;
 IF FOUND THEN RETURN g; END IF;
 IF p_expected_generation<>0 THEN RAISE EXCEPTION 'POINTER_GENERATION_CONFLICT'; END IF;
 INSERT INTO public."KnowledgeServingPointer"(id,"propertyId",audience,"publicationId","pointerGeneration","eligibilityGeneration","updatedBy","updatedAt") VALUES (gen_random_uuid()::text,p_property,p_audience,p_publication,1,eg,p_actor,clock_timestamp()) RETURNING "pointerGeneration" INTO g;
 RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.revoke_source(p_property text,p_source text,p_actor text,p_reason text,p_operation_key text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE g bigint;
BEGIN
 PERFORM 1 FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND id=p_source FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_NOT_FOUND'; END IF;
 UPDATE public."KnowledgeSource" SET state='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_source;
 UPDATE public."WebsiteSourceConsent" SET status='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"revokedBy"=p_actor,"revocationReason"=p_reason,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "sourceId"=p_source AND status<>'REVOKED';
 UPDATE public."PropertyIntelligencePolicy" SET "eligibilityGeneration"="eligibilityGeneration"+1,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property RETURNING "eligibilityGeneration" INTO STRICT g;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt","attempts","createdAt") VALUES (gen_random_uuid()::text,p_property,p_operation_key,'KNOWLEDGE_SOURCE_REVOKED',1,jsonb_build_object('sourceId',p_source,'generation',g),'PENDING',clock_timestamp(),0,clock_timestamp()) ON CONFLICT ("propertyId","operationKey","eventType","schemaVersion") DO NOTHING;
 RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.claim_job(p_property text,p_worker text,p_lease_seconds int)
RETURNS TABLE(job_id text,fence bigint,attempt_number int) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public."AutomationJob"%ROWTYPE;
BEGIN
 IF p_lease_seconds<1 OR p_lease_seconds>900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF;
 SELECT * INTO j FROM public."AutomationJob" WHERE "propertyId"=p_property AND status='QUEUED' AND "operationKey" IS NOT NULL AND "nextRunAt"<=clock_timestamp() ORDER BY priority DESC,"nextRunAt",id FOR UPDATE SKIP LOCKED LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 UPDATE public."AutomationJob" SET status='RUNNING',"lockedAt"=clock_timestamp(),"lockedBy"=p_worker,"leaseExpiresAt"=clock_timestamp()+make_interval(secs=>p_lease_seconds),"fencingToken"="fencingToken"+1,"attemptCount"="attemptCount"+1,"updatedAt"=clock_timestamp() WHERE id=j.id RETURNING id,"fencingToken","attemptCount" INTO job_id,fence,attempt_number;
 INSERT INTO public."AutomationJobAttempt"(id,"propertyId","jobId","attemptNumber","workerId","fencingToken",state,"startedAt") VALUES(gen_random_uuid()::text,p_property,job_id,attempt_number,p_worker,fence,'RUNNING',clock_timestamp());
 RETURN NEXT;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.renew_job(p_property text,p_job text,p_worker text,p_fence bigint,p_lease_seconds int)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE x timestamptz; BEGIN
 UPDATE public."AutomationJob" SET "leaseExpiresAt"=clock_timestamp()+make_interval(secs=>p_lease_seconds),"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_job AND status='RUNNING' AND "lockedBy"=p_worker AND "fencingToken"=p_fence AND "leaseExpiresAt">clock_timestamp() RETURNING "leaseExpiresAt" INTO x;
 IF NOT FOUND THEN RAISE EXCEPTION 'STALE_JOB_FENCE'; END IF; RETURN x;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.reclaim_job(p_property text,p_job text,p_worker text,p_lease_seconds int)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE old_fence bigint; new_fence bigint; n int; BEGIN
 SELECT "fencingToken" INTO STRICT old_fence FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job AND status='RUNNING' AND "leaseExpiresAt"<=clock_timestamp() FOR UPDATE;
 UPDATE public."AutomationJobAttempt" SET state='ABANDONED',"finishedAt"=clock_timestamp(),"errorCode"='LEASE_EXPIRED' WHERE "propertyId"=p_property AND "jobId"=p_job AND "fencingToken"=old_fence AND state='RUNNING';
 UPDATE public."AutomationJob" SET "lockedBy"=p_worker,"lockedAt"=clock_timestamp(),"leaseExpiresAt"=clock_timestamp()+make_interval(secs=>p_lease_seconds),"fencingToken"="fencingToken"+1,"attemptCount"="attemptCount"+1,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_job RETURNING "fencingToken","attemptCount" INTO new_fence,n;
 INSERT INTO public."AutomationJobAttempt"(id,"propertyId","jobId","attemptNumber","workerId","fencingToken",state,"startedAt") VALUES(gen_random_uuid()::text,p_property,p_job,n,p_worker,new_fence,'RUNNING',clock_timestamp()); RETURN new_fence;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.finalize_capture(p_property text,p_job text,p_worker text,p_fence bigint,p_generation int,p_object text,p_staging_hash text,p_capture text,p_capture_version text,p_manifest jsonb,p_event_type text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public."AutomationJob"%ROWTYPE; c public."SourceCapture"%ROWTYPE; o public."KnowledgeObject"%ROWTYPE;
BEGIN
 SELECT * INTO STRICT j FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job FOR UPDATE;
 IF j.status<>'RUNNING' OR j."lockedBy"<>p_worker OR j."fencingToken"<>p_fence OR j."leaseExpiresAt"<=clock_timestamp() OR j."inputGeneration"<>p_generation THEN RAISE EXCEPTION 'STALE_JOB_FENCE_OR_GENERATION'; END IF;
 SELECT * INTO STRICT c FROM public."SourceCapture" WHERE "propertyId"=p_property AND id=p_capture AND "operationKey"=j."operationKey" FOR UPDATE;
 SELECT * INTO STRICT o FROM public."KnowledgeObject" WHERE "propertyId"=p_property AND id=p_object AND state='STAGED' AND "stagingTokenHash"=p_staging_hash FOR UPDATE;
 UPDATE public."KnowledgeObject" SET state='USABLE',"finalizedByJobId"=p_job,"finalizedFence"=p_fence,"usableAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_object;
 INSERT INTO public."CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt","createdAt") VALUES(p_capture_version,p_property,p_capture,p_object,o.checksum,p_manifest,clock_timestamp(),clock_timestamp());
 UPDATE public."SourceCapture" SET status='SUCCEEDED',"completedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_capture;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt",attempts,"createdAt") VALUES(gen_random_uuid()::text,p_property,j."operationKey",p_event_type,1,jsonb_build_object('captureVersionId',p_capture_version),'PENDING',clock_timestamp(),0,clock_timestamp());
 UPDATE public."AutomationJobAttempt" SET state='SUCCEEDED',"finishedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "jobId"=p_job AND "fencingToken"=p_fence AND state='RUNNING';
 UPDATE public."AutomationJob" SET status='SUCCEEDED',result=jsonb_build_object('captureVersionId',p_capture_version),"completedAt"=clock_timestamp(),"leaseExpiresAt"=NULL,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_job;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.validate_handover_transition() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE prior public."HandoverState"; prior_seq int;
BEGIN
 SELECT state,sequence INTO prior,prior_seq FROM public."KnowledgeHandoverEvent" WHERE "propertyId"=NEW."propertyId" AND "requestId"=NEW."requestId" ORDER BY sequence DESC LIMIT 1 FOR SHARE;
 IF prior_seq IS NULL THEN IF NEW.sequence<>1 OR NEW.state<>'RECORDED' THEN RAISE EXCEPTION 'HANDOVER_MUST_START_RECORDED'; END IF;
 ELSE
  IF NEW.sequence<>prior_seq+1 THEN RAISE EXCEPTION 'HANDOVER_SEQUENCE_GAP'; END IF;
  IF NOT ((prior='RECORDED' AND NEW.state IN ('QUEUED','CANCELED')) OR (prior='QUEUED' AND NEW.state IN ('PROVIDER_ACCEPTED','QUEUED','CANCELED')) OR (prior='PROVIDER_ACCEPTED' AND NEW.state IN ('STAFF_ACKNOWLEDGED','QUEUED')) OR (prior='STAFF_ACKNOWLEDGED' AND NEW.state IN ('RESOLVED','REOPENED')) OR (prior='RESOLVED' AND NEW.state='REOPENED') OR (prior='REOPENED' AND NEW.state='QUEUED')) THEN RAISE EXCEPTION 'INVALID_HANDOVER_TRANSITION'; END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER "KnowledgeHandoverEvent_transition" BEFORE INSERT ON "KnowledgeHandoverEvent" FOR EACH ROW EXECUTE FUNCTION aifrogi_security.validate_handover_transition();

CREATE OR REPLACE FUNCTION aifrogi_security.authorize_guest(p_property text,p_conversation text,p_session_hash text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s."conversationId"=p_conversation AND s."sessionHash"=p_session_hash AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp())
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_pending(p_property text,p_conversation text,p_session_hash text,p_publication text,p_pointer_generation bigint,p_eligibility_generation bigint,p_selected jsonb,p_validation jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text; aid text:=gen_random_uuid()::text;
BEGIN
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 SELECT id INTO STRICT sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "conversationId"=p_conversation AND "sessionHash"=p_session_hash AND "revokedAt" IS NULL AND "expiresAt">clock_timestamp();
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeServingPointer" WHERE "propertyId"=p_property AND audience='PUBLIC' AND "publicationId"=p_publication AND "pointerGeneration"=p_pointer_generation AND "eligibilityGeneration"=p_eligibility_generation) THEN RAISE EXCEPTION 'ANSWER_POINTER_STALE'; END IF;
 INSERT INTO public."KnowledgeAnswerAudit"(id,"propertyId","conversationId","guestSessionId","publicationId","pointerGeneration","eligibilityGeneration","selectedManifest","selectedManifestHash","validationResult","deliveryState","createdAt") VALUES(aid,p_property,p_conversation,sid,p_publication,p_pointer_generation,p_eligibility_generation,p_selected,aifrogi_security.hash_json(p_selected),p_validation,'PENDING',clock_timestamp());
 RETURN aid;
END $$;
CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_outcome(p_property text,p_answer text,p_delivery_key text,p_state public."AnswerDeliveryState",p_detail jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE oid text:=gen_random_uuid()::text;
BEGIN
 IF p_state='PENDING' THEN RAISE EXCEPTION 'OUTCOME_CANNOT_BE_PENDING'; END IF;
 PERFORM 1 FROM public."KnowledgeAnswerAudit" WHERE "propertyId"=p_property AND id=p_answer;
 IF NOT FOUND THEN RAISE EXCEPTION 'ANSWER_AUDIT_NOT_FOUND'; END IF;
 INSERT INTO public."KnowledgeAnswerOutcome"(id,"propertyId","answerAuditId","deliveryKey",state,detail,"occurredAt") VALUES(oid,p_property,p_answer,p_delivery_key,p_state,p_detail,clock_timestamp()) ON CONFLICT ("propertyId","answerAuditId","deliveryKey") DO NOTHING;
 SELECT id INTO STRICT oid FROM public."KnowledgeAnswerOutcome" WHERE "propertyId"=p_property AND "answerAuditId"=p_answer AND "deliveryKey"=p_delivery_key;
 RETURN oid;
END $$;
CREATE OR REPLACE FUNCTION aifrogi_security.record_handover(p_property text,p_conversation text,p_session_hash text,p_request_hash text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text; rid text:=gen_random_uuid()::text;
BEGIN
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 SELECT id INTO STRICT sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "conversationId"=p_conversation AND "sessionHash"=p_session_hash;
 INSERT INTO public."KnowledgeHandoverRequest"(id,"propertyId","conversationId","guestSessionId","requestHash","recordedAt") VALUES(rid,p_property,p_conversation,sid,p_request_hash,clock_timestamp()) ON CONFLICT ("propertyId","requestHash") DO NOTHING;
 SELECT id INTO STRICT rid FROM public."KnowledgeHandoverRequest" WHERE "propertyId"=p_property AND "requestHash"=p_request_hash;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeHandoverEvent" WHERE "propertyId"=p_property AND "requestId"=rid) THEN INSERT INTO public."KnowledgeHandoverEvent"(id,"propertyId","requestId",state,sequence,"actorId","occurredAt") VALUES(gen_random_uuid()::text,p_property,rid,'RECORDED',1,p_actor,clock_timestamp()); END IF;
 RETURN rid;
END $$;
CREATE OR REPLACE FUNCTION aifrogi_security.append_handover_event(p_property text,p_request text,p_state public."HandoverState",p_attempt int,p_provider text,p_delivery text,p_error text,p_actor text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE n int;
BEGIN
 PERFORM 1 FROM public."KnowledgeHandoverRequest" WHERE "propertyId"=p_property AND id=p_request FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'HANDOVER_NOT_FOUND'; END IF;
 SELECT COALESCE(max(sequence),0)+1 INTO n FROM public."KnowledgeHandoverEvent" WHERE "propertyId"=p_property AND "requestId"=p_request;
 INSERT INTO public."KnowledgeHandoverEvent"(id,"propertyId","requestId",state,sequence,"attemptNumber",provider,"deliveryId","errorCode","actorId","occurredAt") VALUES(gen_random_uuid()::text,p_property,p_request,p_state,n,p_attempt,p_provider,p_delivery,p_error,p_actor,clock_timestamp()); RETURN n;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.eligible_public_claims(p_property text,p_expected_generation bigint)
RETURNS TABLE(entry_id text,claim_identity_id text,normalized_value jsonb,quote_text text,seal_hash text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.id,e."claimIdentityId",e."normalizedValue",e."quoteText",e."sealManifestHash"
 FROM public."KnowledgeServingPointer" sp JOIN public."KnowledgePublication" p ON p."propertyId"=sp."propertyId" AND p.audience=sp.audience AND p.id=sp."publicationId"
 JOIN public."KnowledgePublicationClaim" pc ON pc."propertyId"=p."propertyId" AND pc."publicationId"=p.id
 JOIN public."KnowledgeEntry" e ON e."propertyId"=pc."propertyId" AND e.id=pc."entryId"
 WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND sp."eligibilityGeneration"=p_expected_generation AND p.state='SEALED' AND p."revokedAt" IS NULL
 AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),p_expected_generation)
$$;

-- All property-owned tables exist before this complete RLS pass.
DO $rls$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY[
 'KnowledgeClaimIdentity','KnowledgeSource','KnowledgeSourceRevision','SourceCapture','KnowledgeObject','KnowledgeObjectReference','CaptureVersion','KnowledgeExtractionRun','KnowledgeClaimEvidence','KnowledgeRevisionEvidenceBinding','KnowledgeClaimConflict','KnowledgeApprovalEvidence','KnowledgePublication','KnowledgePublicationClaim','KnowledgeServingPointer','KnowledgePolicyVersion','PropertyIntelligencePolicy','KnowledgePreviewSession','KnowledgePreviewClaim','KnowledgeGuestSession','KnowledgeRevisionEvent','KnowledgeAnswerAudit','KnowledgeAnswerOutcome','KnowledgeHandoverRequest','KnowledgeHandoverEvent','KnowledgeOutboxEvent','AutomationJobAttempt','KnowledgeCertificationRun','KnowledgeRetentionDecision','KnowledgeMigrationDecision']
 LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY aifrogi_property_isolation ON %I USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
 END LOOP;
END $rls$;

DO $existing_property_rls$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['KnowledgeDocument','KnowledgeEntry','WebsiteSourceConsent','AutomationJob','Participant','Conversation','ConversationParticipant','Message']
 LOOP
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('DROP POLICY IF EXISTS aifrogi_tenant_isolation ON %I',t);
  EXECUTE format('CREATE POLICY aifrogi_property_isolation ON %I USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
 END LOOP;
END $existing_property_rls$;

-- Superseded by Part 15 v6: runtime roles are isolated LOGIN roles with no memberships.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA aifrogi_security FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA aifrogi_security TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA public TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id(),aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority() TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id() TO leados_app;
-- Preserve the legacy application's pre-migration read-only RLS helpers. It
-- receives no canonical sealing, pointer, delivery, revocation, or job routine.
GRANT SELECT,INSERT ON "KnowledgePreviewSession","KnowledgePreviewClaim","KnowledgeGuestSession","WebsiteSourceConsent" TO aifrogi_web;
GRANT SELECT ON "KnowledgeAnswerAudit","KnowledgeAnswerOutcome","KnowledgeHandoverRequest","KnowledgeHandoverEvent" TO aifrogi_web;
GRANT SELECT ON "KnowledgeEntry","KnowledgeClaimIdentity","KnowledgePublication","KnowledgePublicationClaim" TO aifrogi_web;
GRANT SELECT,INSERT ON "KnowledgeSource","KnowledgeSourceRevision","SourceCapture","KnowledgeObject","KnowledgeObjectReference","KnowledgeEntry","KnowledgeClaimIdentity","KnowledgeClaimEvidence","KnowledgeRevisionEvidenceBinding","KnowledgeClaimConflict" TO aifrogi_worker;
GRANT SELECT ON "AutomationJob","AutomationJobAttempt","CaptureVersion","KnowledgeOutboxEvent" TO aifrogi_worker;
GRANT SELECT,INSERT ON "KnowledgeApprovalEvidence","KnowledgePublication","KnowledgePublicationClaim","KnowledgeRevisionEvent" TO aifrogi_publisher;
GRANT SELECT ON "KnowledgeEntry","KnowledgeClaimIdentity","KnowledgeServingPointer","PropertyIntelligencePolicy","KnowledgePolicyVersion" TO aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.authorize_guest(text,text,text) TO aifrogi_web;
GRANT EXECUTE ON FUNCTION aifrogi_security.record_answer_pending(text,text,text,text,bigint,bigint,jsonb,jsonb),aifrogi_security.record_answer_outcome(text,text,text,"AnswerDeliveryState",jsonb),aifrogi_security.record_handover(text,text,text,text,text),aifrogi_security.append_handover_event(text,text,"HandoverState",int,text,text,text,text) TO aifrogi_web;
GRANT EXECUTE ON FUNCTION aifrogi_security.eligible_public_claims(text,bigint) TO aifrogi_public;
GRANT EXECUTE ON FUNCTION aifrogi_security.claim_job(text,text,int),aifrogi_security.renew_job(text,text,text,bigint,int),aifrogi_security.reclaim_job(text,text,text,int),aifrogi_security.finalize_capture(text,text,text,bigint,int,text,text,text,text,jsonb,text) TO aifrogi_worker;
GRANT EXECUTE ON FUNCTION aifrogi_security.seal_claim_revision(text,text,text,text),aifrogi_security.seal_publication(text,text,text,bigint),aifrogi_security.advance_serving_pointer(text,"KnowledgeAudience",text,bigint,text),aifrogi_security.revoke_source(text,text,text,text,text) TO aifrogi_publisher;
REVOKE INSERT,UPDATE,DELETE ON "KnowledgeServingPointer","CaptureVersion","KnowledgeOutboxEvent","AutomationJobAttempt" FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE INSERT,UPDATE,DELETE ON "KnowledgeAnswerAudit","KnowledgeAnswerOutcome","KnowledgeHandoverRequest","KnowledgeHandoverEvent" FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE UPDATE,DELETE ON "KnowledgeEntry","KnowledgeClaimEvidence","KnowledgeRevisionEvidenceBinding","KnowledgeApprovalEvidence","KnowledgePublication","KnowledgePublicationClaim","KnowledgeRevisionEvent","KnowledgeAnswerAudit","KnowledgeAnswerOutcome","KnowledgeHandoverRequest","KnowledgeHandoverEvent","KnowledgeCertificationRun","KnowledgeRetentionDecision" FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
-- P2-A v6 mandatory hardening. Execute immediately after 03-PROPOSED-DDL.sql
-- in the same migration transaction. This is proposed SQL; it has NOT been applied.
-- Runtime transactions use READ COMMITTED. Parent FOR UPDATE locks serialize
-- membership changes with sealing; no weaker isolation contract is assumed.

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';

CREATE OR REPLACE FUNCTION aifrogi_security.current_principal() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.security_actor',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.current_purpose() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.system_purpose',true),'')
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.current_session_hash() RETURNS text
LANGUAGE sql STABLE SET search_path=pg_catalog AS $$
  SELECT NULLIF(current_setting('app.guest_session_hash',true),'')
$$;

CREATE OR REPLACE FUNCTION aifrogi_security.require_context(
  p_property text, p_role name, p_purposes text[], p_principal text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=pg_catalog,public AS $$
DECLARE expected_org text; ctx_org text; ctx_property text; ctx_actor text; ctx_purpose text;
BEGIN
  ctx_org := NULLIF(current_setting('app.organization_id',true),'');
  ctx_property := NULLIF(current_setting('app.property_id',true),'');
  ctx_actor := NULLIF(current_setting('app.security_actor',true),'');
  ctx_purpose := NULLIF(current_setting('app.system_purpose',true),'');
  SELECT "organizationId" INTO expected_org FROM public."Property" WHERE id=p_property;
  IF expected_org IS NULL OR ctx_org IS DISTINCT FROM expected_org OR ctx_property IS DISTINCT FROM p_property
     OR ctx_actor IS NULL OR ctx_purpose IS NULL OR NOT (ctx_purpose=ANY(p_purposes))
     OR session_user::name IS DISTINCT FROM p_role
     OR NOT EXISTS (SELECT 1 FROM public."KnowledgeRuntimePrincipalGrant" g WHERE g."propertyId"=p_property AND g."principalId"=ctx_actor AND g."databaseRole"=p_role::text AND g.purpose=ctx_purpose AND g."revokedAt" IS NULL AND (g."expiresAt" IS NULL OR g."expiresAt">clock_timestamp()))
     OR (p_principal IS NOT NULL AND ctx_actor IS DISTINCT FROM p_principal) THEN
    RAISE EXCEPTION 'AUTHORITY_CONTEXT_DENIED' USING ERRCODE='42501';
  END IF;
END $$;

REVOKE ALL ON FUNCTION aifrogi_security.current_principal(),aifrogi_security.current_purpose(),aifrogi_security.current_session_hash(),aifrogi_security.require_context(text,name,text[],text) FROM PUBLIC;

-- Part 3 creates all v6 tables, bigint columns, exact composite keys and FKs.

CREATE OR REPLACE FUNCTION aifrogi_security.guard_sealed_evidence() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE prop text; ent text; closed timestamptz;
BEGIN
  IF TG_OP='UPDATE' AND (OLD."propertyId",OLD."entryId") IS DISTINCT FROM (NEW."propertyId",NEW."entryId") THEN RAISE EXCEPTION 'EVIDENCE_REPARENTING_FORBIDDEN'; END IF;
  prop:=CASE WHEN TG_OP='INSERT' THEN NEW."propertyId" ELSE OLD."propertyId" END;
  ent:=CASE WHEN TG_OP='INSERT' THEN NEW."entryId" ELSE OLD."entryId" END;
  SELECT "sealedAt" INTO closed FROM public."KnowledgeEntry" WHERE "propertyId"=prop AND id=ent FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ENTRY_NOT_FOUND'; END IF;
  IF closed IS NOT NULL THEN RAISE EXCEPTION 'SEALED_EVIDENCE_IMMUTABLE'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.guard_publication_membership() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE prop text; pub text; closed timestamptz;
BEGIN
  IF TG_OP='UPDATE' AND (OLD."propertyId",OLD."publicationId") IS DISTINCT FROM (NEW."propertyId",NEW."publicationId") THEN RAISE EXCEPTION 'PUBLICATION_REPARENTING_FORBIDDEN'; END IF;
  prop:=CASE WHEN TG_OP='INSERT' THEN NEW."propertyId" ELSE OLD."propertyId" END;
  pub:=CASE WHEN TG_OP='INSERT' THEN NEW."publicationId" ELSE OLD."publicationId" END;
  SELECT "membershipClosedAt" INTO closed FROM public."KnowledgePublication" WHERE "propertyId"=prop AND id=pub FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PUBLICATION_NOT_FOUND'; END IF;
  IF closed IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_MEMBERSHIP_CLOSED'; END IF;
  IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END $$;

-- Consent is effective only for the exact source, PUBLIC-compatible scope,
-- current time, and the highest-precedence non-revoked authorization.
CREATE OR REPLACE FUNCTION aifrogi_security.consent_precedence(p_basis text) RETURNS int
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog AS $$
 SELECT CASE p_basis WHEN 'SIGNED_LETTER' THEN 400 WHEN 'EMAIL' THEN 300 WHEN 'TRIAL_TERMS' THEN 200 ELSE 0 END
$$;
GRANT EXECUTE ON FUNCTION aifrogi_security.consent_precedence(text) TO leados_app;
CREATE OR REPLACE FUNCTION aifrogi_security.validate_source_consent() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public."WebsiteSourceConsent"%ROWTYPE; s public."KnowledgeSource"%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='WebsiteSourceConsent' THEN
   IF NEW."sourceId" IS NULL THEN
     IF TG_OP='INSERT' OR OLD."sourceId" IS NOT NULL THEN RAISE EXCEPTION 'NEW_CONSENT_REQUIRES_EXACT_SOURCE'; END IF;
     RETURN NEW;
   END IF;
   SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId" FOR UPDATE;
   c:=NEW;
 ELSE
   SELECT * INTO STRICT s FROM public."KnowledgeSource" WHERE "propertyId"=NEW."propertyId" AND id=NEW."sourceId" FOR UPDATE;
   SELECT * INTO STRICT c FROM public."WebsiteSourceConsent" WHERE "propertyId"=NEW."propertyId" AND id=NEW."consentId" FOR SHARE;
 END IF;
 IF c."sourceId" IS DISTINCT FROM NEW."sourceId" OR c."sourceType"::text IS DISTINCT FROM s."sourceType"::text OR c."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash" THEN RAISE EXCEPTION 'CONSENT_SOURCE_IDENTITY_MISMATCH'; END IF;
 IF TG_TABLE_NAME='WebsiteSourceConsent' THEN
   IF NEW.status='REVOKED' THEN
     IF NEW."revokedAt" IS NULL OR NEW."revokedBy" IS NULL OR NEW."revocationReason" IS NULL THEN RAISE EXCEPTION 'CONSENT_REVOCATION_INCOMPLETE'; END IF;
     RETURN NEW;
   END IF;
 END IF;
 IF c."sourceId" IS DISTINCT FROM NEW."sourceId" OR c."sourceType"::text IS DISTINCT FROM s."sourceType"::text
    OR c."canonicalIdentityHash" IS DISTINCT FROM s."canonicalIdentityHash" OR c.status NOT IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED')
    OR c."authorityScope" IS NULL OR NOT (c."authorityScope" @> '{"capture":true}'::jsonb)
    OR c."audienceCeiling" NOT IN ('PUBLIC','RESTRICTED') OR COALESCE(c."effectiveFrom",c."trialAuthorizedAt")>clock_timestamp()
    OR (c."effectiveUntil" IS NOT NULL AND c."effectiveUntil"<=clock_timestamp())
    OR c."revokedAt" IS NOT NULL OR aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS'))=0
    OR EXISTS (SELECT 1 FROM public."WebsiteSourceConsent" newer WHERE newer."propertyId"=c."propertyId" AND newer."sourceId"=c."sourceId" AND newer.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND newer."revokedAt" IS NULL AND COALESCE(newer."effectiveFrom",newer."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(newer."effectiveUntil",newer."trialExpiresAt")>clock_timestamp() AND (aifrogi_security.consent_precedence(COALESCE(newer."postTrialMethod"::text,'TRIAL_TERMS'))>aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS')) OR (aifrogi_security.consent_precedence(COALESCE(newer."postTrialMethod"::text,'TRIAL_TERMS'))=aifrogi_security.consent_precedence(COALESCE(c."postTrialMethod"::text,'TRIAL_TERMS')) AND COALESCE(newer."effectiveFrom",newer."trialAuthorizedAt")>COALESCE(c."effectiveFrom",c."trialAuthorizedAt"))))
 THEN RAISE EXCEPTION 'SOURCE_CONSENT_NOT_CURRENT_OR_SCOPED'; END IF;
 RETURN NEW;
END $$;

-- Every privileged entry point below authenticates transaction context and
-- role membership. Actor/worker arguments are correlation values, not authority.
CREATE OR REPLACE FUNCTION aifrogi_security.seal_claim_revision(p_property text,p_entry text,p_actor text,p_policy text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE e public."KnowledgeEntry"%ROWTYPE; identity_qualifiers jsonb; required text[]; covered text[]; bindings jsonb; m jsonb; h text; generation bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT e FROM public."KnowledgeEntry" WHERE "propertyId"=p_property AND id=p_entry FOR UPDATE;
 IF e."sealedAt" IS NOT NULL OR e."revisionState"<>'DRAFT' THEN RAISE EXCEPTION 'REVISION_NOT_DRAFT'; END IF;
 IF e."claimIdentityId" IS NULL OR e."revisionNumber" IS NULL OR e."normalizedValue" IS NULL OR e."valueHash" IS NULL OR e.audience IS NULL OR e."verificationStatus"<>'SUPPORTED' OR cardinality(e."requiredComponents")=0 THEN RAISE EXCEPTION 'REVISION_INCOMPLETE'; END IF;
 SELECT qualifiers INTO STRICT identity_qualifiers FROM public."KnowledgeClaimIdentity" WHERE ("propertyId",id)=(p_property,e."claimIdentityId") FOR SHARE;
 SELECT "eligibilityGeneration" INTO STRICT generation FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 SELECT COALESCE(array_agg(DISTINCT component ORDER BY component),ARRAY[]::text[]) INTO covered FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON (ev."propertyId",ev."entryId",ev.id)=(b."propertyId",b."entryId",b."evidenceId") JOIN public."CaptureVersion" cv ON (cv."propertyId",cv.id)=(ev."propertyId",ev."captureVersionId") JOIN public."KnowledgeObject" ko ON (ko."propertyId",ko.id)=(cv."propertyId",cv."objectId") AND ko.state='USABLE' JOIN public."SourceCapture" sc ON (sc."propertyId",sc.id)=(cv."propertyId",cv."captureId") AND sc.status='SUCCEEDED' JOIN public."KnowledgeSource" ks ON (ks."propertyId",ks.id)=(sc."propertyId",sc."sourceId") AND ks.state='AUTHORIZED' AND ks."revokedAt" IS NULL JOIN public."KnowledgeSourceRevision" sr ON (sr."propertyId",sr."sourceId",sr.id)=(sc."propertyId",sc."sourceId",sc."sourceRevisionId") JOIN public."WebsiteSourceConsent" c ON (c."propertyId",c."sourceId",c.id)=(sr."propertyId",sr."sourceId",sr."consentId") AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp() AND c."authorityScope" @> '{"capture":true}'::jsonb CROSS JOIN LATERAL unnest(ev."supportedComponents") component WHERE b."propertyId"=p_property AND b."entryId"=p_entry;
 SELECT COALESCE(jsonb_agg(jsonb_build_object('evidenceId',ev.id,'captureVersionId',ev."captureVersionId",'locator',ev.locator,'locatorHash',ev."locatorHash",'quotation',ev.quotation,'quotationHash',ev."quotationHash",'supportedComponents',ev."supportedComponents",'bindingHash',b."bindingHash") ORDER BY b."bindingHash"),'[]'::jsonb) INTO bindings FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" ev ON (ev."propertyId",ev."entryId",ev.id)=(b."propertyId",b."entryId",b."evidenceId") WHERE b."propertyId"=p_property AND b."entryId"=p_entry;
 required:=ARRAY(SELECT DISTINCT x FROM unnest(e."requiredComponents") x ORDER BY x);
 IF bindings='[]'::jsonb OR NOT(covered @> required) THEN RAISE EXCEPTION 'FULL_STATEMENT_EVIDENCE_INSUFFICIENT'; END IF;
 m:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',e."propertyId",'entryId',e.id,'claimIdentityId',e."claimIdentityId",'qualifiers',identity_qualifiers,'revisionNumber',e."revisionNumber",'normalizedValue',e."normalizedValue",'valueHash',e."valueHash",'answer',e.answer,'quoteText',e."quoteText",'audience',e.audience,'effectiveFrom',e."effectiveFrom",'effectiveUntil',e."effectiveUntil",'policyVersion',p_policy,'eligibilityGeneration',generation,'requiredComponents',required,'bindings',bindings);
 h:=aifrogi_security.hash_json(m);
 UPDATE public."KnowledgeEntry" SET "sealManifestHash"=h,"sealPolicyVersion"=p_policy,"sealedAt"=clock_timestamp(),"sealedBy"=p_actor,"revisionState"='SEALED',"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_entry;
 RETURN h;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.seal_publication(p_property text,p_publication text,p_actor text,p_generation bigint)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; members jsonb; m jsonb; h text; current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR UPDATE;
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 IF current_g<>p_generation OR p.state<>'CANDIDATE' OR p."membershipClosedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_STALE_OR_NOT_CANDIDATE'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" WHERE "propertyId"=p_property AND "publicationId"=p_publication) THEN RAISE EXCEPTION 'EMPTY_PUBLICATION'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p.audience,clock_timestamp(),current_g)) THEN RAISE EXCEPTION 'PUBLICATION_HAS_INELIGIBLE_CLAIM'; END IF;
 SELECT jsonb_agg(jsonb_build_object('claimIdentityId',pc."claimIdentityId",'entryId',pc."entryId",'sealManifestHash',pc."sealManifestHash") ORDER BY pc."claimIdentityId",pc."entryId") INTO members FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication;
 m:=jsonb_build_object('canonicalizer','PG14_JSONB_V1','propertyId',p."propertyId",'audience',p.audience,'policyVersion',p."policyVersion",'evidencePolicyVersion',p."evidencePolicyVersion",'approvalId',p."approvalId",'claims',members);
 h:=aifrogi_security.hash_json(m);
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeApprovalEvidence" a WHERE a."propertyId"=p_property AND a.id=p."approvalId" AND a.purpose='PUBLICATION_AUTHORIZATION' AND a.decision='APPROVED' AND a.audience=p.audience AND a."policyVersion"=p."policyVersion" AND a."scopeHash"=h) THEN RAISE EXCEPTION 'EXACT_PUBLICATION_AUTHORIZATION_MISSING'; END IF;
 UPDATE public."KnowledgePublication" SET "manifestHash"=h,state='SEALED',"sealedAt"=clock_timestamp(),"membershipClosedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_publication; RETURN h;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.advance_serving_pointer(p_property text,p_audience public."KnowledgeAudience",p_publication text,p_expected_generation bigint,p_actor text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE p public."KnowledgePublication"%ROWTYPE; g bigint; eg bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_PUBLISH'],p_actor);
 SELECT * INTO STRICT p FROM public."KnowledgePublication" WHERE "propertyId"=p_property AND id=p_publication FOR SHARE;
 SELECT "eligibilityGeneration" INTO STRICT eg FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR UPDATE;
 IF p.audience<>p_audience OR p.state<>'SEALED' OR p."membershipClosedAt" IS NULL OR p."revokedAt" IS NOT NULL THEN RAISE EXCEPTION 'PUBLICATION_NOT_SERVABLE'; END IF;
 IF EXISTS (SELECT 1 FROM public."KnowledgePublicationClaim" pc WHERE pc."propertyId"=p_property AND pc."publicationId"=p_publication AND NOT aifrogi_security.eligible_claim(p_property,pc."entryId",p_audience,clock_timestamp(),eg)) THEN RAISE EXCEPTION 'PUBLICATION_CURRENTLY_INELIGIBLE'; END IF;
 UPDATE public."KnowledgeServingPointer" SET "publicationId"=p_publication,"pointerGeneration"="pointerGeneration"+1,"eligibilityGeneration"=eg,"updatedBy"=p_actor,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND audience=p_audience AND "pointerGeneration"=p_expected_generation RETURNING "pointerGeneration" INTO g;
 IF FOUND THEN RETURN g; END IF; IF p_expected_generation<>0 THEN RAISE EXCEPTION 'POINTER_GENERATION_CONFLICT'; END IF;
 INSERT INTO public."KnowledgeServingPointer"(id,"propertyId",audience,"publicationId","pointerGeneration","eligibilityGeneration","updatedBy","updatedAt") VALUES(gen_random_uuid()::text,p_property,p_audience,p_publication,1,eg,p_actor,clock_timestamp()) RETURNING "pointerGeneration" INTO g; RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.revoke_source(p_property text,p_source text,p_actor text,p_reason text,p_operation_key text)
RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_publisher',ARRAY['KNOWLEDGE_REVOKE'],p_actor);
 PERFORM 1 FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND id=p_source FOR UPDATE; IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_NOT_FOUND'; END IF;
 UPDATE public."KnowledgeSource" SET state='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_source;
 UPDATE public."WebsiteSourceConsent" SET status='REVOKED',"revokedAt"=COALESCE("revokedAt",clock_timestamp()),"revokedBy"=p_actor,"revocationReason"=p_reason,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "sourceId"=p_source AND status<>'REVOKED';
 UPDATE public."PropertyIntelligencePolicy" SET "eligibilityGeneration"="eligibilityGeneration"+1,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property RETURNING "eligibilityGeneration" INTO STRICT g;
 UPDATE public."KnowledgeServingPointer" SET "eligibilityGeneration"=g,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt",attempts,"createdAt") VALUES(gen_random_uuid()::text,p_property,p_operation_key,'KNOWLEDGE_SOURCE_REVOKED',1,jsonb_build_object('sourceId',p_source,'generation',g),'PENDING',clock_timestamp(),0,clock_timestamp()) ON CONFLICT ("propertyId","operationKey","eventType","schemaVersion") DO NOTHING; RETURN g;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.eligible_public_claims(p_property text,p_expected_generation bigint)
RETURNS TABLE(entry_id text,claim_identity_id text,normalized_value jsonb,quote_text text,seal_hash text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_public',ARRAY['PUBLIC_ANSWER'],NULL);
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property;
 IF current_g<>p_expected_generation THEN RAISE EXCEPTION 'ELIGIBILITY_GENERATION_STALE'; END IF;
 RETURN QUERY SELECT e.id,e."claimIdentityId",e."normalizedValue",e."quoteText",e."sealManifestHash" FROM public."KnowledgeServingPointer" sp JOIN public."KnowledgePublication" p ON (p."propertyId",p.audience,p.id)=(sp."propertyId",sp.audience,sp."publicationId") JOIN public."KnowledgePublicationClaim" pc ON pc."propertyId"=p."propertyId" AND pc."publicationId"=p.id JOIN public."KnowledgeEntry" e ON (e."propertyId",e."claimIdentityId",e.id,e."sealManifestHash")=(pc."propertyId",pc."claimIdentityId",pc."entryId",pc."sealManifestHash") WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' AND sp."eligibilityGeneration"=current_g AND p.state='SEALED' AND p."revokedAt" IS NULL AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),current_g);
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.authorize_guest(p_property text,p_conversation text,p_session_hash text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF aifrogi_security.current_session_hash() IS DISTINCT FROM p_session_hash THEN RETURN false; END IF;
 RETURN EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s."conversationId"=p_conversation AND s."sessionHash"=p_session_hash AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp());
END $$;

DROP FUNCTION IF EXISTS aifrogi_security.record_answer_pending(text,text,text,text,bigint,bigint,jsonb,jsonb);
CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_pending(p_property text,p_conversation text,p_session_hash text,p_entry_ids text[])
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text; aid text:=gen_random_uuid()::text; pub text; pg bigint; eg bigint; selected jsonb; matched int;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 SELECT id INTO STRICT sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "conversationId"=p_conversation AND "sessionHash"=p_session_hash FOR SHARE;
 SELECT sp."publicationId",sp."pointerGeneration",pip."eligibilityGeneration" INTO STRICT pub,pg,eg FROM public."KnowledgeServingPointer" sp JOIN public."PropertyIntelligencePolicy" pip ON pip."propertyId"=sp."propertyId" WHERE sp."propertyId"=p_property AND sp.audience='PUBLIC' FOR SHARE OF sp,pip;
 SELECT count(DISTINCT e.id),COALESCE(jsonb_agg(jsonb_build_object('entryId',e.id,'identityId',e."claimIdentityId",'seal',e."sealManifestHash",'answerText',e.answer,'quoteText',e."quoteText",'evidence',ev.evidence) ORDER BY e.id),'[]'::jsonb) INTO matched,selected FROM public."KnowledgePublicationClaim" pc JOIN public."KnowledgeEntry" e ON (e."propertyId",e."claimIdentityId",e.id,e."sealManifestHash")=(pc."propertyId",pc."claimIdentityId",pc."entryId",pc."sealManifestHash") JOIN LATERAL (SELECT jsonb_agg(jsonb_build_object('evidenceId',x.id,'bindingHash',b."bindingHash") ORDER BY x.id) evidence FROM public."KnowledgeRevisionEvidenceBinding" b JOIN public."KnowledgeClaimEvidence" x ON (x."propertyId",x."entryId",x.id)=(b."propertyId",b."entryId",b."evidenceId") WHERE b."propertyId"=e."propertyId" AND b."entryId"=e.id) ev ON true WHERE pc."propertyId"=p_property AND pc."publicationId"=pub AND e.id=ANY(p_entry_ids) AND aifrogi_security.eligible_claim(p_property,e.id,'PUBLIC',clock_timestamp(),eg);
 IF cardinality(p_entry_ids)=0 OR matched<>cardinality(p_entry_ids) OR EXISTS (SELECT 1 FROM unnest(p_entry_ids) x GROUP BY x HAVING count(*)>1) THEN RAISE EXCEPTION 'ANSWER_SELECTION_NOT_EXACTLY_ELIGIBLE'; END IF;
 INSERT INTO public."KnowledgeAnswerAudit"(id,"propertyId","conversationId","guestSessionId","publicationId","pointerGeneration","eligibilityGeneration","selectedManifest","selectedManifestHash","validationResult","deliveryState","createdAt") VALUES(aid,p_property,p_conversation,sid,pub,pg,eg,selected,aifrogi_security.hash_json(selected),jsonb_build_object('derivedBy','record_answer_pending/v6','eligible',true),'PENDING',clock_timestamp()); RETURN aid;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.record_answer_outcome(p_property text,p_answer text,p_delivery_key text,p_state public."AnswerDeliveryState",p_detail jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE oid text:=gen_random_uuid()::text; a public."KnowledgeAnswerAudit"%ROWTYPE; current_g bigint;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 SELECT * INTO STRICT a FROM public."KnowledgeAnswerAudit" WHERE "propertyId"=p_property AND id=p_answer FOR SHARE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."conversationId"=a."conversationId" AND s."sessionHash"=aifrogi_security.current_session_hash()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 IF p_state='DELIVERED' AND NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_INACTIVE'; END IF;
 SELECT "eligibilityGeneration" INTO STRICT current_g FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 IF p_state='DELIVERED' AND (current_g<>a."eligibilityGeneration" OR EXISTS (SELECT 1 FROM jsonb_array_elements(a."selectedManifest") x WHERE NOT aifrogi_security.eligible_claim(p_property,x->>'entryId','PUBLIC',clock_timestamp(),current_g))) THEN RAISE EXCEPTION 'DELIVERY_REVALIDATION_FAILED'; END IF;
 IF p_state='DELIVERED' AND (
   p_detail#>>'{answerBinding,answerText}' IS DISTINCT FROM (SELECT string_agg(x.value->>'answerText',E'\n' ORDER BY x.ordinality) FROM jsonb_array_elements(a."selectedManifest") WITH ORDINALITY x(value,ordinality))
   OR p_detail#>>'{answerBinding,answerSha256}' IS DISTINCT FROM encode(digest(convert_to(p_detail#>>'{answerBinding,answerText}','UTF8'),'sha256'),'hex')
   OR p_detail#>'{answerBinding,manifestEntryIds}' IS DISTINCT FROM (SELECT jsonb_agg(x.value->>'entryId' ORDER BY x.ordinality) FROM jsonb_array_elements(a."selectedManifest") WITH ORDINALITY x(value,ordinality))
 ) THEN RAISE EXCEPTION 'DELIVERED_ANSWER_NOT_BOUND_TO_MANIFEST'; END IF;
 IF p_state='PENDING' THEN RAISE EXCEPTION 'OUTCOME_CANNOT_BE_PENDING'; END IF;
 INSERT INTO public."KnowledgeAnswerOutcome"(id,"propertyId","answerAuditId","deliveryKey",state,detail,"occurredAt") VALUES(oid,p_property,p_answer,p_delivery_key,p_state,p_detail,clock_timestamp()) ON CONFLICT ("propertyId","answerAuditId","deliveryKey") DO NOTHING; SELECT id INTO STRICT oid FROM public."KnowledgeAnswerOutcome" WHERE "propertyId"=p_property AND "answerAuditId"=p_answer AND "deliveryKey"=p_delivery_key; RETURN oid;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.answer_outcome_state(p_property text,p_answer text,p_delivery_key text)
RETURNS public."AnswerDeliveryState" LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result public."AnswerDeliveryState";
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeAnswerAudit" a JOIN public."KnowledgeGuestSession" s ON (s."propertyId",s.id,s."conversationId")=(a."propertyId",a."guestSessionId",a."conversationId") WHERE a."propertyId"=p_property AND a.id=p_answer AND s."sessionHash"=aifrogi_security.current_session_hash()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 SELECT state INTO STRICT result FROM public."KnowledgeAnswerOutcome" WHERE "propertyId"=p_property AND "answerAuditId"=p_answer AND "deliveryKey"=p_delivery_key;
 RETURN result;
END $$;

CREATE OR REPLACE FUNCTION aifrogi_security.answer_delivery_manifest(p_property text,p_answer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE a public."KnowledgeAnswerAudit"%ROWTYPE;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],NULL);
 SELECT * INTO STRICT a FROM public."KnowledgeAnswerAudit" WHERE "propertyId"=p_property AND id=p_answer FOR SHARE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" s WHERE s."propertyId"=p_property AND s.id=a."guestSessionId" AND s."conversationId"=a."conversationId" AND s."sessionHash"=aifrogi_security.current_session_hash() AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp()) THEN RAISE EXCEPTION 'DELIVERY_SESSION_UNAUTHORIZED'; END IF;
 PERFORM 1 FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 RETURN a."selectedManifest";
END $$;

ALTER FUNCTION aifrogi_security.record_handover(text,text,text,text,text) RENAME TO record_handover_unchecked;
ALTER FUNCTION aifrogi_security.append_handover_event(text,text,"HandoverState",int,text,text,text,text) RENAME TO append_handover_event_unchecked;
CREATE FUNCTION aifrogi_security.record_handover(p_property text,p_conversation text,p_session_hash text,p_request_hash text,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 IF NOT aifrogi_security.authorize_guest(p_property,p_conversation,p_session_hash) THEN RAISE EXCEPTION 'GUEST_SESSION_UNAUTHORIZED'; END IF;
 RETURN aifrogi_security.record_handover_unchecked(p_property,p_conversation,p_session_hash,p_request_hash,p_actor);
END $$;
CREATE FUNCTION aifrogi_security.append_handover_event(p_property text,p_request text,p_state public."HandoverState",p_attempt int,p_provider text,p_delivery text,p_error text,p_actor text)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 RETURN aifrogi_security.append_handover_event_unchecked(p_property,p_request,p_state,p_attempt,p_provider,p_delivery,p_error,p_actor);
END $$;

-- Worker acquisition/finalization holds policy/source/consent rows, rejects
-- blocked/removed/stale work, and bounds every lease operation.
CREATE OR REPLACE FUNCTION aifrogi_security.assert_capture_authorized(p_property text,p_operation_key text,p_generation bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE cap public."SourceCapture"%ROWTYPE; src public."KnowledgeSource"%ROWTYPE; pol public."PropertyIntelligencePolicy"%ROWTYPE; mode public."KnowledgePolicyMode";
BEGIN
 SELECT * INTO STRICT pol FROM public."PropertyIntelligencePolicy" WHERE "propertyId"=p_property FOR SHARE;
 SELECT k.mode INTO STRICT mode FROM public."KnowledgePolicyVersion" k WHERE (k."propertyId",k.id)=(pol."propertyId",pol."currentPolicyVersionId");
 IF mode='BLOCKED' OR pol."eligibilityGeneration"<>p_generation THEN RAISE EXCEPTION 'PROPERTY_BLOCKED_OR_GENERATION_STALE'; END IF;
 SELECT * INTO STRICT cap FROM public."SourceCapture" WHERE "propertyId"=p_property AND "operationKey"=p_operation_key FOR SHARE;
 SELECT * INTO STRICT src FROM public."KnowledgeSource" WHERE "propertyId"=p_property AND id=cap."sourceId" FOR SHARE;
 IF cap."requestedGeneration"<>p_generation OR src.state<>'AUTHORIZED' OR src."revokedAt" IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public."KnowledgeSourceRevision" r JOIN public."WebsiteSourceConsent" c ON (c."propertyId",c.id)=(r."propertyId",r."consentId") WHERE (r."propertyId",r."sourceId",r.id)=(cap."propertyId",cap."sourceId",cap."sourceRevisionId") AND c.status IN ('TRIAL_AUTHORIZED','POST_TRIAL_APPROVED') AND c."revokedAt" IS NULL AND COALESCE(c."effectiveFrom",c."trialAuthorizedAt")<=clock_timestamp() AND COALESCE(c."effectiveUntil",c."trialExpiresAt")>clock_timestamp() AND c."authorityScope" @> '{"capture":true}'::jsonb) THEN RAISE EXCEPTION 'CAPTURE_SOURCE_NOT_AUTHORIZED'; END IF;
END $$;

-- Existing v4 job routines remain the only state-mutating bodies. Wrappers
-- below are their mandatory preconditions; deployment renames v4 bodies to
-- *_unchecked and exposes only these signatures in one transaction.
ALTER FUNCTION aifrogi_security.claim_job(text,text,int) RENAME TO claim_job_unchecked;
ALTER FUNCTION aifrogi_security.renew_job(text,text,text,bigint,int) RENAME TO renew_job_unchecked;
ALTER FUNCTION aifrogi_security.reclaim_job(text,text,text,int) RENAME TO reclaim_job_unchecked;
ALTER FUNCTION aifrogi_security.finalize_capture(text,text,text,bigint,int,text,text,text,text,jsonb,text) RENAME TO finalize_capture_unchecked;
CREATE FUNCTION aifrogi_security.claim_job(p_property text,p_worker text,p_lease_seconds int) RETURNS TABLE(job_id text,fence bigint,attempt_number int) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ DECLARE r record; BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; FOR r IN SELECT * FROM aifrogi_security.claim_job_unchecked(p_property,p_worker,p_lease_seconds) LOOP PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE id=r.job_id),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE id=r.job_id)); job_id:=r.job_id; fence:=r.fence; attempt_number:=r.attempt_number; RETURN NEXT; END LOOP; END $$;
CREATE FUNCTION aifrogi_security.renew_job(p_property text,p_job text,p_worker text,p_fence bigint,p_lease_seconds int) RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job)); RETURN aifrogi_security.renew_job_unchecked(p_property,p_job,p_worker,p_fence,p_lease_seconds); END $$;
CREATE FUNCTION aifrogi_security.reclaim_job(p_property text,p_job text,p_worker text,p_lease_seconds int) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$ BEGIN PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker); IF p_lease_seconds NOT BETWEEN 1 AND 900 THEN RAISE EXCEPTION 'INVALID_LEASE'; END IF; PERFORM aifrogi_security.assert_capture_authorized(p_property,(SELECT "operationKey" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job),(SELECT "inputGeneration" FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job)); RETURN aifrogi_security.reclaim_job_unchecked(p_property,p_job,p_worker,p_lease_seconds); END $$;
CREATE FUNCTION aifrogi_security.finalize_capture(p_property text,p_job text,p_worker text,p_fence bigint,p_generation bigint,p_object text,p_staging_hash text,p_capture text,p_capture_version text,p_manifest jsonb,p_event_type text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE j public."AutomationJob"%ROWTYPE; c public."SourceCapture"%ROWTYPE; o public."KnowledgeObject"%ROWTYPE;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_worker',ARRAY['KNOWLEDGE_CAPTURE'],p_worker);
 SELECT * INTO STRICT j FROM public."AutomationJob" WHERE "propertyId"=p_property AND id=p_job FOR UPDATE;
 IF j.status<>'RUNNING' OR j."lockedBy"<>p_worker OR j."fencingToken"<>p_fence OR j."leaseExpiresAt"<=clock_timestamp() OR j."inputGeneration"<>p_generation THEN RAISE EXCEPTION 'STALE_JOB_FENCE_OR_GENERATION'; END IF;
 PERFORM aifrogi_security.assert_capture_authorized(p_property,j."operationKey",p_generation);
 SELECT * INTO STRICT c FROM public."SourceCapture" WHERE "propertyId"=p_property AND id=p_capture AND "operationKey"=j."operationKey" FOR UPDATE;
 SELECT * INTO STRICT o FROM public."KnowledgeObject" WHERE "propertyId"=p_property AND id=p_object AND state='STAGED' AND "stagingTokenHash"=p_staging_hash FOR UPDATE;
 IF NOT EXISTS (SELECT 1 FROM public."KnowledgeObjectReference" r WHERE r."propertyId"=p_property AND r."objectId"=p_object AND r."sourceId"=c."sourceId" AND r."releasedAt" IS NULL) THEN RAISE EXCEPTION 'OBJECT_CAPTURE_SOURCE_LINK_MISSING'; END IF;
 UPDATE public."KnowledgeObject" SET state='USABLE',"finalizedByJobId"=p_job,"finalizedFence"=p_fence,"usableAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_object;
 INSERT INTO public."CaptureVersion"(id,"propertyId","captureId","objectId",checksum,manifest,"capturedAt","createdAt") VALUES(p_capture_version,p_property,p_capture,p_object,o.checksum,p_manifest,clock_timestamp(),clock_timestamp());
 UPDATE public."SourceCapture" SET status='SUCCEEDED',"completedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_capture;
 INSERT INTO public."KnowledgeOutboxEvent"(id,"propertyId","operationKey","eventType","schemaVersion",payload,state,"availableAt",attempts,"createdAt") VALUES(gen_random_uuid()::text,p_property,j."operationKey",p_event_type,1,jsonb_build_object('captureVersionId',p_capture_version),'PENDING',clock_timestamp(),0,clock_timestamp());
 UPDATE public."AutomationJobAttempt" SET state='SUCCEEDED',"finishedAt"=clock_timestamp() WHERE "propertyId"=p_property AND "jobId"=p_job AND "fencingToken"=p_fence AND state='RUNNING';
 UPDATE public."AutomationJob" SET status='SUCCEEDED',result=jsonb_build_object('captureVersionId',p_capture_version),"completedAt"=clock_timestamp(),"leaseExpiresAt"=NULL,"updatedAt"=clock_timestamp() WHERE "propertyId"=p_property AND id=p_job;
END $$;

-- All permissive policies on the affected property tables are removed, not
-- merely one expected name. The replacement and role transition are atomic.
DO $rls_base$ DECLARE t text; pol record; tables text[]:=ARRAY['KnowledgeClaimIdentity','KnowledgeSource','KnowledgeSourceRevision','SourceCapture','KnowledgeObject','KnowledgeObjectReference','CaptureVersion','KnowledgeExtractionRun','KnowledgeClaimEvidence','KnowledgeRevisionEvidenceBinding','KnowledgeClaimConflict','KnowledgeApprovalEvidence','KnowledgePublication','KnowledgePublicationClaim','KnowledgeServingPointer','KnowledgePolicyVersion','PropertyIntelligencePolicy','KnowledgePreviewSession','KnowledgePreviewClaim','KnowledgeGuestSession','KnowledgeRevisionEvent','KnowledgeAnswerAudit','KnowledgeAnswerOutcome','KnowledgeHandoverRequest','KnowledgeHandoverEvent','KnowledgeOutboxEvent','AutomationJobAttempt','KnowledgeCertificationRun','KnowledgeRetentionDecision','KnowledgeMigrationDecision','KnowledgeDocument','KnowledgeEntry','KnowledgePreview','KnowledgeAnswerFlag','KnowledgeGap','Conversation','ConversationParticipant','AutomationJob']; BEGIN FOREACH t IN ARRAY tables LOOP FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',pol.policyname,t); END LOOP; EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t); EXECUTE format('CREATE POLICY aifrogi_property_isolation ON public.%I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t); END LOOP; END $rls_base$;

-- Remaining strengthened tables are reconciled here before any runtime grant.
DO $rls_v6$ DECLARE t text; pol record; BEGIN
 FOREACH t IN ARRAY ARRAY['WebsiteSourceConsent','Participant','Message','KnowledgeRuntimePrincipalGrant'] LOOP
   FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t LOOP EXECUTE format('DROP POLICY %I ON public.%I',pol.policyname,t); END LOOP;
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
   EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
   EXECUTE format('CREATE POLICY aifrogi_property_isolation ON public.%I FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM public."Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())))',t);
 END LOOP;
END $rls_v6$;

DO $role_shape$ DECLARE r record; BEGIN
 FOR r IN SELECT rolname,rolcanlogin,rolbypassrls,rolsuper FROM pg_roles WHERE rolname IN ('aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher') LOOP
   IF NOT r.rolcanlogin OR r.rolbypassrls OR r.rolsuper THEN RAISE EXCEPTION 'RUNTIME_ROLE_SHAPE_INVALID: %',r.rolname; END IF;
   IF EXISTS (SELECT 1 FROM pg_auth_members m JOIN pg_roles child ON child.oid=m.member JOIN pg_roles parent ON parent.oid=m.roleid WHERE child.rolname=r.rolname OR parent.rolname=r.rolname) THEN RAISE EXCEPTION 'RUNTIME_ROLE_MEMBERSHIP_FORBIDDEN: %',r.rolname; END IF;
 END LOOP;
 IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('aifrogi_web','aifrogi_public','aifrogi_worker','aifrogi_publisher'))<>4 THEN RAISE EXCEPTION 'RUNTIME_ROLES_MISSING'; END IF;
END $role_shape$;

ALTER TABLE "KnowledgeMigrationArtifactDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "KnowledgeMigrationArtifactDecision" FORCE ROW LEVEL SECURITY;
CREATE POLICY aifrogi_property_isolation ON "KnowledgeMigrationArtifactDecision" FOR ALL USING (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id()))) WITH CHECK (aifrogi_security.has_platform_authority() OR ("propertyId"=aifrogi_security.current_property_id() AND EXISTS (SELECT 1 FROM "Property" p WHERE p.id="propertyId" AND p."organizationId"=aifrogi_security.current_organization_id())));

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA aifrogi_security FROM PUBLIC,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher,leados_app;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
REVOKE ALL ON TABLE "KnowledgeServingPointer","KnowledgeAnswerAudit","KnowledgeAnswerOutcome","KnowledgeHandoverRequest","KnowledgeHandoverEvent","AutomationJobAttempt","CaptureVersion","KnowledgeOutboxEvent" FROM leados_app,aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA aifrogi_security TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT USAGE ON SCHEMA public TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id(),aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority() TO aifrogi_web,aifrogi_public,aifrogi_worker,aifrogi_publisher;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_property_id() TO leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.consent_precedence(text) TO leados_app;
GRANT EXECUTE ON FUNCTION aifrogi_security.authorize_guest(text,text,text),aifrogi_security.record_answer_pending(text,text,text,text[]),aifrogi_security.record_answer_outcome(text,text,text,"AnswerDeliveryState",jsonb),aifrogi_security.answer_outcome_state(text,text,text),aifrogi_security.answer_delivery_manifest(text,text),aifrogi_security.record_handover(text,text,text,text,text),aifrogi_security.append_handover_event(text,text,"HandoverState",int,text,text,text,text) TO aifrogi_web;
GRANT EXECUTE ON FUNCTION aifrogi_security.eligible_public_claims(text,bigint) TO aifrogi_public;
GRANT EXECUTE ON FUNCTION aifrogi_security.claim_job(text,text,int),aifrogi_security.renew_job(text,text,text,bigint,int),aifrogi_security.reclaim_job(text,text,text,int),aifrogi_security.finalize_capture(text,text,text,bigint,bigint,text,text,text,text,jsonb,text) TO aifrogi_worker;
GRANT EXECUTE ON FUNCTION aifrogi_security.seal_claim_revision(text,text,text,text),aifrogi_security.seal_publication(text,text,text,bigint),aifrogi_security.advance_serving_pointer(text,"KnowledgeAudience",text,bigint,text),aifrogi_security.revoke_source(text,text,text,text,text) TO aifrogi_publisher;

-- The web role has no direct INSERT/UPDATE privilege on guest sessions. This
-- routine creates or extends only the caller-bound session for an existing
-- conversation in the same property; it can never reparent an existing hash.
CREATE OR REPLACE FUNCTION aifrogi_security.ensure_guest_session(p_property text,p_conversation text,p_session_hash text,p_expires_at timestamptz,p_actor text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE sid text;
BEGIN
 PERFORM aifrogi_security.require_context(p_property,'aifrogi_web',ARRAY['PUBLIC_GUEST'],p_actor);
 IF aifrogi_security.current_session_hash() IS DISTINCT FROM p_session_hash THEN RAISE EXCEPTION 'GUEST_SESSION_HASH_MISMATCH'; END IF;
 IF p_expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'GUEST_SESSION_ALREADY_EXPIRED'; END IF;
 IF p_expires_at>clock_timestamp()+interval '24 hours' THEN RAISE EXCEPTION 'GUEST_SESSION_EXPIRY_TOO_LONG'; END IF;
 PERFORM 1 FROM public."Conversation" WHERE "propertyId"=p_property AND id=p_conversation FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'CONVERSATION_NOT_FOUND'; END IF;
 SELECT id INTO sid FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND "sessionHash"=p_session_hash FOR UPDATE;
 IF FOUND THEN
   IF NOT EXISTS (SELECT 1 FROM public."KnowledgeGuestSession" WHERE "propertyId"=p_property AND id=sid AND "conversationId"=p_conversation AND "revokedAt" IS NULL) THEN RAISE EXCEPTION 'GUEST_SESSION_REPARENT_FORBIDDEN'; END IF;
   UPDATE public."KnowledgeGuestSession" SET "expiresAt"=GREATEST("expiresAt",p_expires_at) WHERE "propertyId"=p_property AND id=sid;
   RETURN sid;
 END IF;
 sid:=gen_random_uuid()::text;
 INSERT INTO public."KnowledgeGuestSession"(id,"propertyId","conversationId","sessionHash","expiresAt","createdAt") VALUES(sid,p_property,p_conversation,p_session_hash,p_expires_at,clock_timestamp());
 RETURN sid;
END $$;
REVOKE ALL ON FUNCTION aifrogi_security.ensure_guest_session(text,text,text,timestamptz,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.ensure_guest_session(text,text,text,timestamptz,text) TO aifrogi_web;

-- Narrow bootstrap resolvers required before an ordinary tenant RLS context
-- exists. They disclose only an organization identifier and never return a
-- customer, source, claim, conversation, answer or message row.
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_public_bot_organization(requested_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT p."organizationId" FROM public."Property" p JOIN public."Organization" o ON o.id=p."organizationId" JOIN public."BotProfile" b ON b."organizationId"=o.id
 WHERE p.slug=requested_slug AND b.status='LIVE' AND 'WEBSITE'=ANY(b.channels) LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_property_organization(requested_slug text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT p."organizationId" FROM public."Property" p WHERE p.slug=requested_slug AND p."organizationId" IS NOT NULL LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_session_organization(requested_session_id text,requested_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT s."organizationId" FROM public."UserSession" s WHERE s."sessionId"=requested_session_id AND lower(s.email)=lower(requested_email) AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp() LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.resolve_member_organization(requested_email text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT m."organizationId" FROM public."OrganizationMember" m WHERE lower(m.email)=lower(requested_email) AND m.status='ACTIVE' ORDER BY m."createdAt" LIMIT 1
$$;
CREATE OR REPLACE FUNCTION aifrogi_security.is_session_active(requested_session_id text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public."UserSession" s WHERE s."sessionId"=requested_session_id AND s."revokedAt" IS NULL AND s."expiresAt">clock_timestamp())
$$;
REVOKE ALL ON FUNCTION aifrogi_security.resolve_public_bot_organization(text),aifrogi_security.resolve_property_organization(text),aifrogi_security.resolve_session_organization(text,text),aifrogi_security.resolve_member_organization(text),aifrogi_security.is_session_active(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION aifrogi_security.current_organization_id(),aifrogi_security.has_platform_authority(),aifrogi_security.resolve_public_bot_organization(text),aifrogi_security.resolve_property_organization(text),aifrogi_security.resolve_session_organization(text,text),aifrogi_security.resolve_member_organization(text),aifrogi_security.is_session_active(text) TO leados_app;
-- *_unchecked, require_context, and assert_capture_authorized remain executable
-- only by the migration owner; runtime roles receive no grant.
