-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "LeadLanguage" AS ENUM ('HI', 'EN');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'BOOKED', 'LOST');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('GUEST', 'AGENT', 'AI');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMAGE', 'VIDEO_LINK', 'PDF', 'INVOICE_LINK', 'PAYMENT_LINK', 'BROCHURE_LINK', 'DOCUMENT_LINK');

-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('ROOM', 'EXPERIENCE', 'PROPERTY', 'WEDDING', 'DINING', 'BROCHURE', 'INVOICE', 'PAYMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ChannelKind" AS ENUM ('WHATSAPP', 'WEBSITE', 'EMAIL', 'INSTAGRAM', 'API', 'VOICE');

-- CreateEnum
CREATE TYPE "ChannelConnectionStatus" AS ENUM ('DRAFT', 'CONNECTING', 'CONNECTED', 'DEGRADED', 'DISABLED', 'ERROR');

-- CreateEnum
CREATE TYPE "ParticipantKind" AS ENUM ('CUSTOMER', 'HUMAN', 'BOT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'BOT_ACTIVE', 'HUMAN_OWNED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NeutralMessageDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'SYSTEM');

-- CreateEnum
CREATE TYPE "BotCategory" AS ENUM ('BUSINESS_AI', 'PINGBOOK', 'FLOWCART', 'STAY', 'RESTAURANT', 'REAL_ESTATE', 'EDUCATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BotOperatingMode" AS ENUM ('ANSWER_ONLY', 'LEAD_CAPTURE', 'APPROVED_ACTIONS', 'HUMAN_APPROVAL');

-- CreateEnum
CREATE TYPE "ReadinessScanStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "ReadinessEvidenceStatus" AS ENUM ('PASS', 'FAIL', 'INSUFFICIENT_EVIDENCE', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ReadinessIssueStatus" AS ENUM ('DETECTED', 'REVIEW_REQUIRED', 'APPROVED', 'DECLINED', 'NOT_APPLICABLE', 'IN_PROGRESS', 'IMPLEMENTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ReadinessDeliveryRoute" AS ENUM ('AIFROGI_MANAGED', 'AGENCY_HANDOFF', 'CLIENT_GUIDANCE');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "extractedText" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "conflictSummary" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeEntry" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "documentId" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'General',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "conflictSummary" TEXT,
    "claimKey" TEXT,
    "claimType" TEXT NOT NULL DEFAULT 'FACT',
    "valueType" TEXT NOT NULL DEFAULT 'TEXT',
    "currency" TEXT,
    "effectiveAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "refreshDays" INTEGER NOT NULL DEFAULT 90,
    "reliability" TEXT NOT NULL DEFAULT 'CLIENT_CONFIRMED',
    "authorityLevel" TEXT NOT NULL DEFAULT 'CLIENT_APPROVED_STRUCTURED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "supersedesId" TEXT,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "validationErrors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "conflictStatus" TEXT NOT NULL DEFAULT 'CLEAR',
    "fieldApprovedBy" TEXT,
    "fieldApprovedAt" TIMESTAMP(3),
    "previewApprovedBy" TEXT,
    "previewApprovedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "lastConfirmedAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "KnowledgeGap" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "normalizedQuestion" TEXT NOT NULL,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "lastAskedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "industry" TEXT,
    "website" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "gstNumber" TEXT,
    "businessAddress" TEXT,
    "ownerName" TEXT NOT NULL,
    "ownerEmail" TEXT NOT NULL,
    "ownerMobile" TEXT,
    "publicPhone" TEXT,
    "publicEmail" TEXT,
    "publicAddress" TEXT,
    "publicBusinessHours" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "demoKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoSandbox" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "BotCategory" NOT NULL,
    "fixtureVersion" TEXT NOT NULL DEFAULT '1.0',
    "fixture" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'READY',
    "resetCount" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3),
    "lastResetBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DemoSandbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemoConnectorEvent" (
    "id" TEXT NOT NULL,
    "demoSandboxId" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" JSONB NOT NULL,
    "response" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoConnectorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "authSource" TEXT NOT NULL DEFAULT 'local',
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppBotConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "language" TEXT NOT NULL DEFAULT 'EN',
    "welcomeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "welcomeMessage" TEXT NOT NULL,
    "serviceBuckets" TEXT[],
    "auditEnabled" BOOLEAN NOT NULL DEFAULT true,
    "trialEnabled" BOOLEAN NOT NULL DEFAULT true,
    "humanHandoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "collectLeadDetails" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppBotConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" "BotCategory" NOT NULL DEFAULT 'BUSINESS_AI',
    "personaPackVersion" TEXT NOT NULL DEFAULT '1.0',
    "operatingMode" "BotOperatingMode" NOT NULL DEFAULT 'LEAD_CAPTURE',
    "channels" "ChannelKind"[] DEFAULT ARRAY['WEBSITE']::"ChannelKind"[],
    "capabilities" TEXT[] DEFAULT ARRAY['ANSWER_QUESTIONS', 'CAPTURE_LEADS', 'QUALIFY_LEADS']::TEXT[],
    "humanHandoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "actionApprovalNeeded" BOOLEAN NOT NULL DEFAULT true,
    "personaName" TEXT,
    "businessObjective" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'Professional, clear and helpful',
    "languages" TEXT[] DEFAULT ARRAY['English']::TEXT[],
    "prohibitedClaims" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escalationTriggers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "responseSlaMinutes" INTEGER NOT NULL DEFAULT 60,
    "reminderPercent" INTEGER NOT NULL DEFAULT 50,
    "fallbackEnabled" BOOLEAN NOT NULL DEFAULT false,
    "stayAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
    "safeFallbackMessage" TEXT,
    "kbGateVersion" TEXT,
    "kbCoverageMinimum" INTEGER NOT NULL DEFAULT 80,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "installationKey" TEXT,
    "installationDetectedAt" TIMESTAMP(3),
    "liveAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "lifecycleUpdatedBy" TEXT,
    "configuredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelGuestAccessRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "requestTokenHash" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "requestedCheckIn" TIMESTAMP(3) NOT NULL,
    "requestedCheckOut" TIMESTAMP(3) NOT NULL,
    "approvedCheckOut" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "activatedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelGuestAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotConnectorConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectorKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT,
    "requiredFor" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lifecycle" TEXT NOT NULL DEFAULT 'REQUESTED',
    "readOperations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "writeOperations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unavailableBehavior" TEXT NOT NULL,
    "lastVerifiedAt" TIMESTAMP(3),
    "apiBaseUrl" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'BEARER',
    "operationMapping" JSONB,
    "lastHealthStatus" TEXT,
    "lastHealthCode" INTEGER,
    "lastHealthAt" TIMESTAMP(3),
    "lastError" TEXT,
    "configuredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotConnectorConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BotConnectorCredential" (
    "id" TEXT NOT NULL,
    "connectorId" TEXT NOT NULL,
    "secretEncrypted" TEXT NOT NULL,
    "keyVersion" INTEGER NOT NULL DEFAULT 1,
    "rotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BotConnectorCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentGatewayClient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY['profile:read', 'availability:read']::TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentGatewayClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "passwordHash" TEXT,
    "invitationTokenHash" TEXT,
    "invitationExpiresAt" TIMESTAMP(3),
    "invitedBy" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "progressPercent" INTEGER NOT NULL DEFAULT 10,
    "lifecycleStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "legalName" TEXT,
    "registrationNumber" TEXT,
    "facebookPage" TEXT,
    "googleMapsUrl" TEXT,
    "googleBusinessProfileUrl" TEXT,
    "instagramUrl" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessCategory" TEXT,
    "logoUrl" TEXT,
    "kycStatus" TEXT NOT NULL DEFAULT 'NOT_SUBMITTED',
    "kycSubmittedAt" TIMESTAMP(3),
    "kycReviewedAt" TIMESTAMP(3),
    "kycReviewedBy" TEXT,
    "kycRejectionReason" TEXT,
    "phoneCountryCode" TEXT NOT NULL DEFAULT '+91',
    "phoneNumber" TEXT,
    "whatsappActiveOnNumber" BOOLEAN,
    "numberConnectionPath" TEXT,
    "phoneVerificationStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "facebookStatus" TEXT NOT NULL DEFAULT 'NOT_CONNECTED',
    "metaStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "metaBusinessId" TEXT,
    "wabaId" TEXT,
    "phoneNumberId" TEXT,
    "displayPhoneNumber" TEXT,
    "qualityRating" TEXT,
    "webhookStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "tokenStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIGURED',
    "metaBillingStatus" TEXT NOT NULL DEFAULT 'NOT_CONFIRMED',
    "templateStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "firstMessageStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "lastStatusCheckAt" TIMESTAMP(3),
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "registrationPin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingActivity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "stage" "LeadStage" NOT NULL,
    "language" "LeadLanguage" NOT NULL DEFAULT 'EN',
    "intent" TEXT NOT NULL,
    "stayLabel" TEXT NOT NULL,
    "partyLabel" TEXT NOT NULL,
    "budgetLabel" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isHighPriority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebsiteVisitorSession" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sessionIdHash" TEXT NOT NULL,
    "capabilityHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AI_READY',
    "contactName" TEXT,
    "contactValue" TEXT,
    "consentText" TEXT,
    "consentedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastDeliveredAt" TIMESTAMP(3),
    "lastReadAt" TIMESTAMP(3),
    "resolutionState" JSONB,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebsiteVisitorSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SovereignAnswerEvidence" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leadId" TEXT,
    "sessionIdHash" TEXT NOT NULL,
    "constitutionVersion" TEXT NOT NULL,
    "blueprintVersion" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "disposition" TEXT NOT NULL,
    "contextUsed" BOOLEAN NOT NULL DEFAULT false,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "safetyClassification" TEXT NOT NULL DEFAULT 'STANDARD',
    "permittedOperation" TEXT NOT NULL DEFAULT 'ANSWER',
    "observedBehavior" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "decisionConsistent" BOOLEAN NOT NULL DEFAULT false,
    "consistencyReason" TEXT,
    "resolutionState" TEXT NOT NULL DEFAULT 'RESOLVED',
    "clarifyCount" INTEGER NOT NULL DEFAULT 0,
    "circuitBreaker" BOOLEAN NOT NULL DEFAULT false,
    "circuitBreakerReason" TEXT,
    "evaluationVersion" TEXT NOT NULL DEFAULT '1.1',
    "decisionReason" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "resolvedQuestion" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "grounded" BOOLEAN NOT NULL DEFAULT false,
    "model" TEXT NOT NULL,
    "sources" JSONB NOT NULL,
    "knowledgeAsOf" TIMESTAMP(3),
    "knowledgeClaimIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "personaCategory" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "personaVersion" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "retrievalCandidates" JSONB NOT NULL DEFAULT '[]',
    "retrievedClaimIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "usedClaimIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "nearMissClaimIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureClassification" TEXT NOT NULL DEFAULT 'NONE',
    "safeResolution" BOOLEAN NOT NULL DEFAULT false,
    "evidencePipelineVersion" TEXT NOT NULL DEFAULT '1.0',
    "failureLayer" TEXT NOT NULL DEFAULT 'NONE',
    "failureCode" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "escalationTier" TEXT NOT NULL DEFAULT 'TIER_0_SELF_RESOLVE',
    "degradedMode" BOOLEAN NOT NULL DEFAULT false,
    "executionContractVersion" TEXT NOT NULL DEFAULT '1.0',
    "terminalOutcome" TEXT NOT NULL DEFAULT 'ANSWERED',
    "authorityLevel" TEXT NOT NULL DEFAULT 'INFORMATION',
    "flowId" TEXT,
    "flowVersion" INTEGER,
    "flowNodeId" TEXT,
    "endpointKey" TEXT,
    "endpointVerified" BOOLEAN NOT NULL DEFAULT false,
    "completionClaimAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SovereignAnswerEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "SovereignReplayCase" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "sourceEvidenceId" TEXT NOT NULL,
    "personaCategory" TEXT NOT NULL,
    "personaVersion" TEXT NOT NULL,
    "anonymizedQuestion" TEXT NOT NULL,
    "anonymizedPriorTurns" JSONB NOT NULL DEFAULT '[]',
    "expectedDisposition" TEXT NOT NULL,
    "expectedClaimIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "failureClassification" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "anonymizationVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "SovereignReplayCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadTag" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "body" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "deliveryStatus" TEXT,
    "statusUpdatedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConnection" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "kind" "ChannelKind" NOT NULL,
    "externalId" TEXT,
    "displayName" TEXT,
    "status" "ChannelConnectionStatus" NOT NULL DEFAULT 'DRAFT',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "configuration" JSONB,
    "credentialsReference" TEXT,
    "lastHealthyAt" TIMESTAMP(3),
    "lastErrorAt" TIMESTAMP(3),
    "lastErrorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "kind" "ParticipantKind" NOT NULL DEFAULT 'CUSTOMER',
    "externalKey" TEXT NOT NULL,
    "displayName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "channelConnectionId" TEXT,
    "legacyLeadId" TEXT,
    "externalConversationId" TEXT,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "botPaused" BOOLEAN NOT NULL DEFAULT false,
    "humanOwnerEmail" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "legacyLeadMessageId" TEXT,
    "externalMessageId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "direction" "NeutralMessageDirection" NOT NULL,
    "senderParticipantId" TEXT,
    "body" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'text',
    "deliveryStatus" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
CREATE TABLE "MetricDaily" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalLeads" INTEGER NOT NULL DEFAULT 0,
    "confirmedRevenue" INTEGER NOT NULL DEFAULT 0,
    "otaCommissionSaved" INTEGER NOT NULL DEFAULT 0,
    "averageLeadScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "highScoreLeadCount" INTEGER NOT NULL DEFAULT 0,
    "confirmedBookings" INTEGER NOT NULL DEFAULT 0,
    "directGuestsAcquired" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "festivalName" TEXT NOT NULL DEFAULT '',
    "templateName" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'en_US',
    "messageType" TEXT NOT NULL DEFAULT 'TEMPLATE',
    "metaChargeCategory" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "estimatedReach" INTEGER NOT NULL DEFAULT 0,
    "estimatedRevenue" INTEGER NOT NULL DEFAULT 0,
    "estimatedCostPaisa" INTEGER NOT NULL DEFAULT 0,
    "requestedCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "templateStatus" TEXT NOT NULL DEFAULT 'UNKNOWN',
    "consentSource" TEXT,
    "consentProof" TEXT,
    "consentConfirmedAt" TIMESTAMP(3),
    "consentConfirmedBy" TEXT,
    "audienceSnapshot" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "errorSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignRecipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "externalMessageId" TEXT,
    "error" TEXT,
    "consentStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
    "consentSource" TEXT,
    "consentProof" TEXT,
    "suppressionReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "billingInterval" TEXT NOT NULL DEFAULT 'QUARTERLY',
    "amountPaisa" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "trialDays" INTEGER NOT NULL DEFAULT 0,
    "limits" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRIALING',
    "paymentProvider" TEXT NOT NULL DEFAULT 'MANUAL',
    "externalSubscriptionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "graceEndsAt" TIMESTAMP(3),
    "complimentaryEndsAt" TIMESTAMP(3),
    "complimentaryReason" TEXT,
    "complimentaryGrantedBy" TEXT,
    "messageLimitOverride" INTEGER,
    "aiReplyLimitOverride" INTEGER,
    "messageOveragePaisa" INTEGER NOT NULL DEFAULT 0,
    "aiReplyOveragePaisa" INTEGER NOT NULL DEFAULT 0,
    "overageApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingAddon" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setupFeePaisa" INTEGER NOT NULL DEFAULT 0,
    "recurringFeePaisa" INTEGER NOT NULL DEFAULT 0,
    "externalFeeNote" TEXT,
    "billingInterval" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "provisioningStatus" TEXT NOT NULL DEFAULT 'REQUESTED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNBILLED',
    "activatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "platformFeePaisa" INTEGER NOT NULL DEFAULT 0,
    "metaChargesPaisa" INTEGER NOT NULL DEFAULT 0,
    "aiOveragePaisa" INTEGER NOT NULL DEFAULT 0,
    "servicesPaisa" INTEGER NOT NULL DEFAULT 0,
    "taxPaisa" INTEGER NOT NULL DEFAULT 0,
    "adjustmentPaisa" INTEGER NOT NULL DEFAULT 0,
    "totalPaisa" INTEGER NOT NULL DEFAULT 0,
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL DEFAULT 'COUNT',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "sourceRef" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCreditTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "packCode" TEXT,
    "amountPaisa" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "expiresAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformIncident" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "actorEmail" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutomationJob" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "workflowVersion" INTEGER NOT NULL DEFAULT 1,
    "triggerType" TEXT NOT NULL,
    "triggerRef" TEXT,
    "actionType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 5,
    "payload" JSONB NOT NULL,
    "result" JSONB,
    "idempotencyKey" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "lastError" TEXT,
    "deadLetterReason" TEXT,
    "createdBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "createdByEmail" TEXT NOT NULL,
    "assignedToEmail" TEXT,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "lastActivityBy" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "lastClientViewedAt" TIMESTAMP(3),
    "lastAdminViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "authorEmail" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "AssetType" NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssetShare" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "note" TEXT,
    "sharedBy" TEXT,
    "sharedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssetShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppIntegration" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'META_CLOUD_API',
    "businessAccountId" TEXT,
    "phoneNumberId" TEXT,
    "displayPhoneNumber" TEXT,
    "webhookVerifyToken" TEXT,
    "accessToken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "lastValidatedAt" TIMESTAMP(3),
    "notes" TEXT,
    "aiModeEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentTenant" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "aifrogiTenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROVISIONED',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "googleRefreshTokenEnc" TEXT,
    "calendarId" TEXT,
    "sheetId" TEXT,
    "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "workingHours" JSONB,
    "reviewLink" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentService" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 30,
    "priceInr" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentBooking" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "slotStart" TIMESTAMP(3) NOT NULL,
    "slotEnd" TIMESTAMP(3) NOT NULL,
    "activeSlotKey" TEXT,
    "gcalEventId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HOLD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    "paymentLinkId" TEXT,
    "sourceMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "selectedServiceId" TEXT,
    "customerName" TEXT,
    "selectedSlotStartIso" TEXT,
    "data" JSONB,
    "lastInboundMessageId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentMessageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "template" TEXT,
    "body" TEXT,
    "inboundMessageId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentMessageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentPayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "paymentLinkId" TEXT,
    "externalPaymentId" TEXT,
    "amountPaisa" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentJob" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bookingId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "payload" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastError" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSheetSyncState" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tabName" TEXT NOT NULL,
    "cursor" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentSheetSyncState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceTenant" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "aifrogiTenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROVISIONED',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "storeProvider" TEXT NOT NULL DEFAULT 'DEMO',
    "storeBaseUrl" TEXT,
    "googleSheetId" TEXT,
    "razorpayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappFlowId" TEXT,
    "fulfillmentModes" TEXT[],
    "settings" JSONB,
    "lastCatalogSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceTenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceProduct" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "imageUrl" TEXT,
    "basePricePaisa" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "priceDeltaPaisa" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceAddon" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "pricePaisa" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceCustomer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "lastAddress" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" TEXT NOT NULL DEFAULT 'UNFULFILLED',
    "sourceChannel" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "externalOrderId" TEXT,
    "subtotalPaisa" INTEGER NOT NULL DEFAULT 0,
    "deliveryFeePaisa" INTEGER NOT NULL DEFAULT 0,
    "discountPaisa" INTEGER NOT NULL DEFAULT 0,
    "totalPaisa" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "deliveryDate" TIMESTAMP(3),
    "deliverySlot" TEXT,
    "deliveryAddress" JSONB,
    "customization" JSONB,
    "notes" TEXT,
    "paymentLinkId" TEXT,
    "paymentLinkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceOrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "title" TEXT NOT NULL,
    "variantTitle" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPricePaisa" INTEGER NOT NULL DEFAULT 0,
    "addonTotalPaisa" INTEGER NOT NULL DEFAULT 0,
    "totalPaisa" INTEGER NOT NULL DEFAULT 0,
    "customization" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommerceOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercePayment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'RAZORPAY',
    "paymentLinkId" TEXT,
    "externalPaymentId" TEXT,
    "amountPaisa" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawPayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceFlowSession" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "customerPhone" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "selectedProductId" TEXT,
    "selectedVariantId" TEXT,
    "cartData" JSONB,
    "lastInboundMessageId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommerceFlowSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommerceConversation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "direction" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "template" TEXT,
    "body" TEXT,
    "inboundMessageId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommerceConversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE INDEX "Property_organizationId_idx" ON "Property"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessScan_idempotencyKey_key" ON "ReadinessScan"("idempotencyKey");

-- CreateIndex
CREATE INDEX "ReadinessScan_organizationId_status_nextRunAt_idx" ON "ReadinessScan"("organizationId", "status", "nextRunAt");

-- CreateIndex
CREATE INDEX "ReadinessScan_propertyId_createdAt_idx" ON "ReadinessScan"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessScan_status_leaseExpiresAt_idx" ON "ReadinessScan"("status", "leaseExpiresAt");

-- CreateIndex
CREATE INDEX "ReadinessEvidence_organizationId_pillar_status_idx" ON "ReadinessEvidence"("organizationId", "pillar", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessEvidence_scanId_checkKey_key" ON "ReadinessEvidence"("scanId", "checkKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessIssue_evidenceId_key" ON "ReadinessIssue"("evidenceId");

-- CreateIndex
CREATE INDEX "ReadinessIssue_organizationId_status_severity_idx" ON "ReadinessIssue"("organizationId", "status", "severity");

-- CreateIndex
CREATE INDEX "ReadinessIssue_scanId_pillar_idx" ON "ReadinessIssue"("scanId", "pillar");

-- CreateIndex
CREATE INDEX "ReadinessWorkItem_organizationId_status_dueAt_idx" ON "ReadinessWorkItem"("organizationId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "ReadinessWorkItem_propertyId_createdAt_idx" ON "ReadinessWorkItem"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "ReadinessWorkItem_issueId_idx" ON "ReadinessWorkItem"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "ReadinessVerification_workItemId_key" ON "ReadinessVerification"("workItemId");

-- CreateIndex
CREATE INDEX "ReadinessVerification_organizationId_verifiedAt_idx" ON "ReadinessVerification"("organizationId", "verifiedAt");

-- CreateIndex
CREATE INDEX "ReadinessVerification_propertyId_rubricVersion_idx" ON "ReadinessVerification"("propertyId", "rubricVersion");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_propertyId_status_idx" ON "KnowledgeDocument"("propertyId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_propertyId_status_idx" ON "KnowledgeEntry"("propertyId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_propertyId_claimKey_version_idx" ON "KnowledgeEntry"("propertyId", "claimKey", "version");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_propertyId_expiresAt_status_idx" ON "KnowledgeEntry"("propertyId", "expiresAt", "status");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_supersedesId_idx" ON "KnowledgeEntry"("supersedesId");

-- CreateIndex
CREATE INDEX "KnowledgeEntry_documentId_idx" ON "KnowledgeEntry"("documentId");

-- CreateIndex
CREATE INDEX "KnowledgePreview_propertyId_status_createdAt_idx" ON "KnowledgePreview"("propertyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "KnowledgePreview_entryId_status_idx" ON "KnowledgePreview"("entryId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeAnswerFlag_propertyId_status_resolveDueAt_idx" ON "KnowledgeAnswerFlag"("propertyId", "status", "resolveDueAt");

-- CreateIndex
CREATE INDEX "KnowledgeAnswerFlag_entryId_status_idx" ON "KnowledgeAnswerFlag"("entryId", "status");

-- CreateIndex
CREATE INDEX "KnowledgeAnswerFlag_evidenceId_idx" ON "KnowledgeAnswerFlag"("evidenceId");

-- CreateIndex
CREATE INDEX "KnowledgeGap_propertyId_status_occurrenceCount_idx" ON "KnowledgeGap"("propertyId", "status", "occurrenceCount");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeGap_propertyId_normalizedQuestion_key" ON "KnowledgeGap"("propertyId", "normalizedQuestion");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_demoKey_key" ON "Organization"("demoKey");

-- CreateIndex
CREATE INDEX "Organization_ownerEmail_idx" ON "Organization"("ownerEmail");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DemoSandbox_organizationId_key" ON "DemoSandbox"("organizationId");

-- CreateIndex
CREATE INDEX "DemoSandbox_category_status_idx" ON "DemoSandbox"("category", "status");

-- CreateIndex
CREATE INDEX "DemoConnectorEvent_demoSandboxId_createdAt_idx" ON "DemoConnectorEvent"("demoSandboxId", "createdAt");

-- CreateIndex
CREATE INDEX "DemoConnectorEvent_connectorKey_status_idx" ON "DemoConnectorEvent"("connectorKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DemoConnectorEvent_demoSandboxId_idempotencyKey_key" ON "DemoConnectorEvent"("demoSandboxId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_sessionId_key" ON "UserSession"("sessionId");

-- CreateIndex
CREATE INDEX "UserSession_email_revokedAt_expiresAt_idx" ON "UserSession"("email", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_organizationId_revokedAt_idx" ON "UserSession"("organizationId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppBotConfiguration_organizationId_key" ON "WhatsAppBotConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BotProfile_organizationId_key" ON "BotProfile"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "BotProfile_installationKey_key" ON "BotProfile"("installationKey");

-- CreateIndex
CREATE UNIQUE INDEX "HotelGuestAccessRequest_requestTokenHash_key" ON "HotelGuestAccessRequest"("requestTokenHash");

-- CreateIndex
CREATE INDEX "HotelGuestAccessRequest_propertyId_status_createdAt_idx" ON "HotelGuestAccessRequest"("propertyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "HotelGuestAccessRequest_approvedCheckOut_status_idx" ON "HotelGuestAccessRequest"("approvedCheckOut", "status");

-- CreateIndex
CREATE INDEX "HotelGuestAccessRequest_leadId_idx" ON "HotelGuestAccessRequest"("leadId");

-- CreateIndex
CREATE INDEX "BotConnectorConfiguration_organizationId_lifecycle_idx" ON "BotConnectorConfiguration"("organizationId", "lifecycle");

-- CreateIndex
CREATE INDEX "BotConnectorConfiguration_organizationId_required_enabled_idx" ON "BotConnectorConfiguration"("organizationId", "required", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "BotConnectorConfiguration_organizationId_connectorKey_key" ON "BotConnectorConfiguration"("organizationId", "connectorKey");

-- CreateIndex
CREATE UNIQUE INDEX "BotConnectorCredential_connectorId_key" ON "BotConnectorCredential"("connectorId");

-- CreateIndex
CREATE INDEX "BotConnectorCredential_expiresAt_revokedAt_idx" ON "BotConnectorCredential"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AgentGatewayClient_tokenHash_key" ON "AgentGatewayClient"("tokenHash");

-- CreateIndex
CREATE INDEX "AgentGatewayClient_organizationId_enabled_revokedAt_idx" ON "AgentGatewayClient"("organizationId", "enabled", "revokedAt");

-- CreateIndex
CREATE INDEX "AgentGatewayClient_expiresAt_revokedAt_idx" ON "AgentGatewayClient"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_invitationTokenHash_key" ON "OrganizationMember"("invitationTokenHash");

-- CreateIndex
CREATE INDEX "OrganizationMember_email_status_idx" ON "OrganizationMember"("email", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_email_key" ON "OrganizationMember"("organizationId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProfile_organizationId_key" ON "OnboardingProfile"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingProfile_lifecycleStatus_idx" ON "OnboardingProfile"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "OnboardingProfile_kycStatus_idx" ON "OnboardingProfile"("kycStatus");

-- CreateIndex
CREATE INDEX "OnboardingProfile_metaStatus_idx" ON "OnboardingProfile"("metaStatus");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingCredential_organizationId_key" ON "OnboardingCredential"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingDocument_organizationId_type_idx" ON "OnboardingDocument"("organizationId", "type");

-- CreateIndex
CREATE INDEX "OnboardingActivity_organizationId_createdAt_idx" ON "OnboardingActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_propertyId_stage_idx" ON "Lead"("propertyId", "stage");

-- CreateIndex
CREATE INDEX "Lead_propertyId_score_idx" ON "Lead"("propertyId", "score");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_propertyId_phone_key" ON "Lead"("propertyId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteVisitorSession_leadId_key" ON "WebsiteVisitorSession"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteVisitorSession_capabilityHash_key" ON "WebsiteVisitorSession"("capabilityHash");

-- CreateIndex
CREATE INDEX "WebsiteVisitorSession_propertyId_status_updatedAt_idx" ON "WebsiteVisitorSession"("propertyId", "status", "updatedAt");

-- CreateIndex
CREATE INDEX "WebsiteVisitorSession_expiresAt_revokedAt_idx" ON "WebsiteVisitorSession"("expiresAt", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebsiteVisitorSession_propertyId_sessionIdHash_key" ON "WebsiteVisitorSession"("propertyId", "sessionIdHash");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_intent_disposition_idx" ON "SovereignAnswerEvidence"("propertyId", "intent", "disposition");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_decisionConsistent_creat_idx" ON "SovereignAnswerEvidence"("propertyId", "decisionConsistent", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_circuitBreaker_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "circuitBreaker", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_failureLayer_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "failureLayer", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_escalationTier_createdAt_idx" ON "SovereignAnswerEvidence"("propertyId", "escalationTier", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_terminalOutcome_createdA_idx" ON "SovereignAnswerEvidence"("propertyId", "terminalOutcome", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_endpointVerified_created_idx" ON "SovereignAnswerEvidence"("propertyId", "endpointVerified", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_personaCategory_safeResolution_crea_idx" ON "SovereignAnswerEvidence"("personaCategory", "safeResolution", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_propertyId_failureClassification_cr_idx" ON "SovereignAnswerEvidence"("propertyId", "failureClassification", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerEvidence_leadId_createdAt_idx" ON "SovereignAnswerEvidence"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SovereignAnswerFeedback_evidenceId_key" ON "SovereignAnswerFeedback"("evidenceId");

-- CreateIndex
CREATE INDEX "SovereignAnswerFeedback_propertyId_helpful_createdAt_idx" ON "SovereignAnswerFeedback"("propertyId", "helpful", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignAnswerFeedback_leadId_createdAt_idx" ON "SovereignAnswerFeedback"("leadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SovereignReplayCase_sourceEvidenceId_key" ON "SovereignReplayCase"("sourceEvidenceId");

-- CreateIndex
CREATE INDEX "SovereignReplayCase_propertyId_status_createdAt_idx" ON "SovereignReplayCase"("propertyId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "SovereignReplayCase_personaCategory_status_createdAt_idx" ON "SovereignReplayCase"("personaCategory", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadMessage_externalMessageId_key" ON "LeadMessage"("externalMessageId");

-- CreateIndex
CREATE INDEX "LeadMessage_leadId_sentAt_idx" ON "LeadMessage"("leadId", "sentAt");

-- CreateIndex
CREATE INDEX "ChannelConnection_propertyId_kind_enabled_idx" ON "ChannelConnection"("propertyId", "kind", "enabled");

-- CreateIndex
CREATE INDEX "ChannelConnection_status_lastHealthyAt_idx" ON "ChannelConnection"("status", "lastHealthyAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConnection_propertyId_kind_externalId_key" ON "ChannelConnection"("propertyId", "kind", "externalId");

-- CreateIndex
CREATE INDEX "Participant_propertyId_phone_idx" ON "Participant"("propertyId", "phone");

-- CreateIndex
CREATE INDEX "Participant_propertyId_email_idx" ON "Participant"("propertyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_propertyId_kind_externalKey_key" ON "Participant"("propertyId", "kind", "externalKey");

-- CreateIndex
CREATE INDEX "Conversation_propertyId_status_lastMessageAt_idx" ON "Conversation"("propertyId", "status", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_legacyLeadId_idx" ON "Conversation"("legacyLeadId");

-- CreateIndex
CREATE INDEX "Conversation_humanOwnerEmail_status_idx" ON "Conversation"("humanOwnerEmail", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_channelConnectionId_externalConversationId_key" ON "Conversation"("channelConnectionId", "externalConversationId");

-- CreateIndex
CREATE INDEX "ConversationParticipant_participantId_joinedAt_idx" ON "ConversationParticipant"("participantId", "joinedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_participantId_key" ON "ConversationParticipant"("conversationId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_legacyLeadMessageId_key" ON "Message"("legacyLeadMessageId");

-- CreateIndex
CREATE INDEX "Message_propertyId_occurredAt_idx" ON "Message"("propertyId", "occurredAt");

-- CreateIndex
CREATE INDEX "Message_conversationId_occurredAt_idx" ON "Message"("conversationId", "occurredAt");

-- CreateIndex
CREATE INDEX "Message_senderParticipantId_idx" ON "Message"("senderParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_propertyId_idempotencyKey_key" ON "Message"("propertyId", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_externalMessageId_key" ON "Message"("conversationId", "externalMessageId");

-- CreateIndex
CREATE INDEX "AiOperation_propertyId_status_dueAt_idx" ON "AiOperation"("propertyId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "AiOperation_leadId_createdAt_idx" ON "AiOperation"("leadId", "createdAt");

-- CreateIndex
CREATE INDEX "AiOperation_propertyId_outcomeType_completedAt_idx" ON "AiOperation"("propertyId", "outcomeType", "completedAt");

-- CreateIndex
CREATE INDEX "MetricDaily_propertyId_date_idx" ON "MetricDaily"("propertyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDaily_propertyId_date_key" ON "MetricDaily"("propertyId", "date");

-- CreateIndex
CREATE INDEX "Campaign_propertyId_createdAt_idx" ON "Campaign"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_externalMessageId_key" ON "CampaignRecipient"("externalMessageId");

-- CreateIndex
CREATE INDEX "CampaignRecipient_campaignId_status_idx" ON "CampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignRecipient_campaignId_phone_key" ON "CampaignRecipient"("campaignId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "BillingPlan_code_key" ON "BillingPlan"("code");

-- CreateIndex
CREATE INDEX "BillingPlan_isActive_sortOrder_idx" ON "BillingPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_organizationId_key" ON "Subscription"("organizationId");

-- CreateIndex
CREATE INDEX "Subscription_status_currentPeriodEnd_idx" ON "Subscription"("status", "currentPeriodEnd");

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

-- CreateIndex
CREATE INDEX "BillingAddon_organizationId_provisioningStatus_idx" ON "BillingAddon"("organizationId", "provisioningStatus");

-- CreateIndex
CREATE INDEX "BillingAddon_paymentStatus_idx" ON "BillingAddon"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "BillingInvoice_invoiceNumber_key" ON "BillingInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "BillingInvoice_organizationId_status_idx" ON "BillingInvoice"("organizationId", "status");

-- CreateIndex
CREATE INDEX "BillingInvoice_dueAt_status_idx" ON "BillingInvoice"("dueAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_idempotencyKey_key" ON "UsageRecord"("idempotencyKey");

-- CreateIndex
CREATE INDEX "UsageRecord_organizationId_metric_periodStart_idx" ON "UsageRecord"("organizationId", "metric", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AiCreditTransaction_paymentReference_key" ON "AiCreditTransaction"("paymentReference");

-- CreateIndex
CREATE INDEX "AiCreditTransaction_organizationId_expiresAt_idx" ON "AiCreditTransaction"("organizationId", "expiresAt");

-- CreateIndex
CREATE INDEX "AiCreditTransaction_organizationId_kind_createdAt_idx" ON "AiCreditTransaction"("organizationId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformIncident_status_severity_idx" ON "PlatformIncident"("status", "severity");

-- CreateIndex
CREATE INDEX "PlatformIncident_organizationId_status_idx" ON "PlatformIncident"("organizationId", "status");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_organizationId_createdAt_idx" ON "PlatformAuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_action_createdAt_idx" ON "PlatformAuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "PlatformAuditLog_actorEmail_createdAt_idx" ON "PlatformAuditLog"("actorEmail", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AutomationJob_idempotencyKey_key" ON "AutomationJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AutomationJob_propertyId_status_nextRunAt_idx" ON "AutomationJob"("propertyId", "status", "nextRunAt");

-- CreateIndex
CREATE INDEX "AutomationJob_workflowId_status_idx" ON "AutomationJob"("workflowId", "status");

-- CreateIndex
CREATE INDEX "AutomationJob_leaseExpiresAt_idx" ON "AutomationJob"("leaseExpiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_reference_key" ON "SupportTicket"("reference");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_status_idx" ON "SupportTicket"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SupportTicket_status_priority_idx" ON "SupportTicket"("status", "priority");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicketMessage_ticketId_createdAt_idx" ON "SupportTicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "Asset_propertyId_category_idx" ON "Asset"("propertyId", "category");

-- CreateIndex
CREATE INDEX "Asset_propertyId_type_idx" ON "Asset"("propertyId", "type");

-- CreateIndex
CREATE INDEX "LeadAssetShare_leadId_sharedAt_idx" ON "LeadAssetShare"("leadId", "sharedAt");

-- CreateIndex
CREATE INDEX "LeadAssetShare_assetId_sharedAt_idx" ON "LeadAssetShare"("assetId", "sharedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppIntegration_propertyId_key" ON "WhatsAppIntegration"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTenant_propertyId_key" ON "AppointmentTenant"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTenant_aifrogiTenantId_key" ON "AppointmentTenant"("aifrogiTenantId");

-- CreateIndex
CREATE INDEX "AppointmentTenant_status_idx" ON "AppointmentTenant"("status");

-- CreateIndex
CREATE INDEX "AppointmentService_tenantId_active_sortOrder_idx" ON "AppointmentService"("tenantId", "active", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentBooking_activeSlotKey_key" ON "AppointmentBooking"("activeSlotKey");

-- CreateIndex
CREATE INDEX "AppointmentBooking_tenantId_customerPhone_createdAt_idx" ON "AppointmentBooking"("tenantId", "customerPhone", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentBooking_tenantId_status_slotStart_idx" ON "AppointmentBooking"("tenantId", "status", "slotStart");

-- CreateIndex
CREATE INDEX "AppointmentBooking_serviceId_idx" ON "AppointmentBooking"("serviceId");

-- CreateIndex
CREATE INDEX "AppointmentSession_tenantId_status_expiresAt_idx" ON "AppointmentSession"("tenantId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSession_tenantId_customerPhone_key" ON "AppointmentSession"("tenantId", "customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentMessageLog_inboundMessageId_key" ON "AppointmentMessageLog"("inboundMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentMessageLog_idempotencyKey_key" ON "AppointmentMessageLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AppointmentMessageLog_tenantId_sentAt_idx" ON "AppointmentMessageLog"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "AppointmentMessageLog_bookingId_idx" ON "AppointmentMessageLog"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentPayment_paymentLinkId_key" ON "AppointmentPayment"("paymentLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentPayment_externalPaymentId_key" ON "AppointmentPayment"("externalPaymentId");

-- CreateIndex
CREATE INDEX "AppointmentPayment_tenantId_status_idx" ON "AppointmentPayment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "AppointmentPayment_bookingId_idx" ON "AppointmentPayment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentJob_idempotencyKey_key" ON "AppointmentJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AppointmentJob_tenantId_status_nextRunAt_idx" ON "AppointmentJob"("tenantId", "status", "nextRunAt");

-- CreateIndex
CREATE INDEX "AppointmentJob_bookingId_jobType_idx" ON "AppointmentJob"("bookingId", "jobType");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentSheetSyncState_tenantId_tabName_key" ON "AppointmentSheetSyncState"("tenantId", "tabName");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceTenant_propertyId_key" ON "CommerceTenant"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceTenant_aifrogiTenantId_key" ON "CommerceTenant"("aifrogiTenantId");

-- CreateIndex
CREATE INDEX "CommerceTenant_status_idx" ON "CommerceTenant"("status");

-- CreateIndex
CREATE INDEX "CommerceTenant_storeProvider_idx" ON "CommerceTenant"("storeProvider");

-- CreateIndex
CREATE INDEX "CommerceProduct_tenantId_active_sortOrder_idx" ON "CommerceProduct"("tenantId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "CommerceProduct_tenantId_category_idx" ON "CommerceProduct"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceProduct_tenantId_slug_key" ON "CommerceProduct"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "CommerceProductVariant_productId_active_sortOrder_idx" ON "CommerceProductVariant"("productId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "CommerceAddon_tenantId_active_sortOrder_idx" ON "CommerceAddon"("tenantId", "active", "sortOrder");

-- CreateIndex
CREATE INDEX "CommerceAddon_productId_idx" ON "CommerceAddon"("productId");

-- CreateIndex
CREATE INDEX "CommerceCustomer_tenantId_updatedAt_idx" ON "CommerceCustomer"("tenantId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceCustomer_tenantId_phone_key" ON "CommerceCustomer"("tenantId", "phone");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceOrder_orderNumber_key" ON "CommerceOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "CommerceOrder_tenantId_status_createdAt_idx" ON "CommerceOrder"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CommerceOrder_tenantId_paymentStatus_createdAt_idx" ON "CommerceOrder"("tenantId", "paymentStatus", "createdAt");

-- CreateIndex
CREATE INDEX "CommerceOrder_customerId_idx" ON "CommerceOrder"("customerId");

-- CreateIndex
CREATE INDEX "CommerceOrderItem_orderId_idx" ON "CommerceOrderItem"("orderId");

-- CreateIndex
CREATE INDEX "CommerceOrderItem_productId_idx" ON "CommerceOrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercePayment_paymentLinkId_key" ON "CommercePayment"("paymentLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "CommercePayment_externalPaymentId_key" ON "CommercePayment"("externalPaymentId");

-- CreateIndex
CREATE INDEX "CommercePayment_tenantId_status_idx" ON "CommercePayment"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CommercePayment_orderId_idx" ON "CommercePayment"("orderId");

-- CreateIndex
CREATE INDEX "CommerceFlowSession_tenantId_status_expiresAt_idx" ON "CommerceFlowSession"("tenantId", "status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceFlowSession_tenantId_customerPhone_key" ON "CommerceFlowSession"("tenantId", "customerPhone");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceConversation_inboundMessageId_key" ON "CommerceConversation"("inboundMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "CommerceConversation_idempotencyKey_key" ON "CommerceConversation"("idempotencyKey");

-- CreateIndex
CREATE INDEX "CommerceConversation_tenantId_sentAt_idx" ON "CommerceConversation"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "CommerceConversation_orderId_idx" ON "CommerceConversation"("orderId");

-- CreateIndex
CREATE INDEX "CommerceConversation_customerId_idx" ON "CommerceConversation"("customerId");

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessScan" ADD CONSTRAINT "ReadinessScan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessScan" ADD CONSTRAINT "ReadinessScan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessEvidence" ADD CONSTRAINT "ReadinessEvidence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessEvidence" ADD CONSTRAINT "ReadinessEvidence_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ReadinessScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ReadinessScan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessIssue" ADD CONSTRAINT "ReadinessIssue_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "ReadinessEvidence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessWorkItem" ADD CONSTRAINT "ReadinessWorkItem_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ReadinessIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "ReadinessWorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_beforeScanId_fkey" FOREIGN KEY ("beforeScanId") REFERENCES "ReadinessScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadinessVerification" ADD CONSTRAINT "ReadinessVerification_afterScanId_fkey" FOREIGN KEY ("afterScanId") REFERENCES "ReadinessScan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeEntry" ADD CONSTRAINT "KnowledgeEntry_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreview" ADD CONSTRAINT "KnowledgePreview_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePreview" ADD CONSTRAINT "KnowledgePreview_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "KnowledgeEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerFlag" ADD CONSTRAINT "KnowledgeAnswerFlag_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeAnswerFlag" ADD CONSTRAINT "KnowledgeAnswerFlag_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeGap" ADD CONSTRAINT "KnowledgeGap_resolutionEntryId_fkey" FOREIGN KEY ("resolutionEntryId") REFERENCES "KnowledgeEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoSandbox" ADD CONSTRAINT "DemoSandbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemoConnectorEvent" ADD CONSTRAINT "DemoConnectorEvent_demoSandboxId_fkey" FOREIGN KEY ("demoSandboxId") REFERENCES "DemoSandbox"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppBotConfiguration" ADD CONSTRAINT "WhatsAppBotConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotProfile" ADD CONSTRAINT "BotProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelGuestAccessRequest" ADD CONSTRAINT "HotelGuestAccessRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotConnectorConfiguration" ADD CONSTRAINT "BotConnectorConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BotConnectorCredential" ADD CONSTRAINT "BotConnectorCredential_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "BotConnectorConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentGatewayClient" ADD CONSTRAINT "AgentGatewayClient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProfile" ADD CONSTRAINT "OnboardingProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingCredential" ADD CONSTRAINT "OnboardingCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingDocument" ADD CONSTRAINT "OnboardingDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingActivity" ADD CONSTRAINT "OnboardingActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteVisitorSession" ADD CONSTRAINT "WebsiteVisitorSession_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebsiteVisitorSession" ADD CONSTRAINT "WebsiteVisitorSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SovereignAnswerEvidence" ADD CONSTRAINT "SovereignAnswerEvidence_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SovereignAnswerFeedback" ADD CONSTRAINT "SovereignAnswerFeedback_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SovereignAnswerFeedback" ADD CONSTRAINT "SovereignAnswerFeedback_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "SovereignAnswerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SovereignReplayCase" ADD CONSTRAINT "SovereignReplayCase_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SovereignReplayCase" ADD CONSTRAINT "SovereignReplayCase_sourceEvidenceId_fkey" FOREIGN KEY ("sourceEvidenceId") REFERENCES "SovereignAnswerEvidence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadTag" ADD CONSTRAINT "LeadTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadMessage" ADD CONSTRAINT "LeadMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConnection" ADD CONSTRAINT "ChannelConnection_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_channelConnectionId_fkey" FOREIGN KEY ("channelConnectionId") REFERENCES "ChannelConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_legacyLeadId_fkey" FOREIGN KEY ("legacyLeadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_legacyLeadMessageId_fkey" FOREIGN KEY ("legacyLeadMessageId") REFERENCES "LeadMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderParticipantId_fkey" FOREIGN KEY ("senderParticipantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiOperation" ADD CONSTRAINT "AiOperation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiOperation" ADD CONSTRAINT "AiOperation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricDaily" ADD CONSTRAINT "MetricDaily_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignRecipient" ADD CONSTRAINT "CampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingAddon" ADD CONSTRAINT "BillingAddon_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingInvoice" ADD CONSTRAINT "BillingInvoice_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiCreditTransaction" ADD CONSTRAINT "AiCreditTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformIncident" ADD CONSTRAINT "PlatformIncident_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformAuditLog" ADD CONSTRAINT "PlatformAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationJob" ADD CONSTRAINT "AutomationJob_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicketMessage" ADD CONSTRAINT "SupportTicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssetShare" ADD CONSTRAINT "LeadAssetShare_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssetShare" ADD CONSTRAINT "LeadAssetShare_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppIntegration" ADD CONSTRAINT "WhatsAppIntegration_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentTenant" ADD CONSTRAINT "AppointmentTenant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBooking" ADD CONSTRAINT "AppointmentBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentBooking" ADD CONSTRAINT "AppointmentBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "AppointmentService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSession" ADD CONSTRAINT "AppointmentSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentMessageLog" ADD CONSTRAINT "AppointmentMessageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentMessageLog" ADD CONSTRAINT "AppointmentMessageLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AppointmentBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentPayment" ADD CONSTRAINT "AppointmentPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentPayment" ADD CONSTRAINT "AppointmentPayment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AppointmentBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentJob" ADD CONSTRAINT "AppointmentJob_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentJob" ADD CONSTRAINT "AppointmentJob_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "AppointmentBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSheetSyncState" ADD CONSTRAINT "AppointmentSheetSyncState_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "AppointmentTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceTenant" ADD CONSTRAINT "CommerceTenant_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProduct" ADD CONSTRAINT "CommerceProduct_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceProductVariant" ADD CONSTRAINT "CommerceProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CommerceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceAddon" ADD CONSTRAINT "CommerceAddon_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceAddon" ADD CONSTRAINT "CommerceAddon_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CommerceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceCustomer" ADD CONSTRAINT "CommerceCustomer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrder" ADD CONSTRAINT "CommerceOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrder" ADD CONSTRAINT "CommerceOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CommerceCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CommerceProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceOrderItem" ADD CONSTRAINT "CommerceOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "CommerceProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercePayment" ADD CONSTRAINT "CommercePayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercePayment" ADD CONSTRAINT "CommercePayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceFlowSession" ADD CONSTRAINT "CommerceFlowSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceFlowSession" ADD CONSTRAINT "CommerceFlowSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CommerceCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceConversation" ADD CONSTRAINT "CommerceConversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "CommerceTenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceConversation" ADD CONSTRAINT "CommerceConversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CommerceCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommerceConversation" ADD CONSTRAINT "CommerceConversation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CommerceOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
