import { randomBytes } from "crypto";
import { getDb } from "@/lib/db";
import { resolveMemberOrganization, withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { encryptSecretValue } from "@/lib/field-encryption";
import { nextWebsiteBotStatus, statusAfterBotProfileSave, type WebsiteBotLifecycleAction } from "@/lib/website-bot-lifecycle";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { assertCoreLaunchCertification } from "@/lib/sovereign-intelligence/launch-certification";
import { KB_FRAMEWORK_VERSION } from "@/lib/knowledge-verification";
import { BOT_PERSONA_PACK_VERSION, getBotPersonaPack } from "@/lib/bot-persona-packs";

const organizationInclude = {
  onboarding: true,
  subscription: { include: { plan: true } },
  botConfiguration: true,
  botProfile: true,
  botConnectors: { orderBy: { createdAt: "asc" as const } },
  documents: {
    select: {
      id: true,
      type: true,
      fileName: true,
      mimeType: true,
      sizeBytes: true,
      status: true,
      reviewedBy: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: { createdAt: "asc" as const }
  },
  properties: {
    select: {
      id: true,
      name: true,
      slug: true,
      whatsappIntegration: {
        select: {
          status: true,
          displayPhoneNumber: true
        }
      }
    },
    orderBy: { createdAt: "asc" as const }
  },
  members: {
    orderBy: { createdAt: "asc" as const }
  },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 20
  }
};

export async function getOrganizationForMember(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const organizationId = await resolveMemberOrganization(normalizedEmail);
  if (!organizationId) return null;

  return withTenantDatabaseContext({
    kind: "tenant",
    organizationId,
    actor: `member-workspace:${normalizedEmail}`
  }, async () => {
    const db = getDb();
    if (!db) return null;
    return db.organization.findUnique({
      where: { id: organizationId },
      include: organizationInclude
    });
  });
}

export async function getMemberRoleByEmail(email: string) {
  const db = getDb();
  if (!db) return null;
  const membership = await db.organizationMember.findFirst({
    where: { email: email.toLowerCase(), status: "ACTIVE" },
    select: { role: true },
    orderBy: { createdAt: "asc" }
  });
  const role = membership?.role?.toUpperCase();
  return role === "OWNER" || role === "ADMIN" || role === "AGENT" || role === "VIEWER" ? role : null;
}

export async function createOrganizationForOwner(input: {
  name: string;
  slug: string;
  industry?: string;
  website?: string;
  country: string;
  timezone: string;
  gstNumber?: string;
  businessAddress?: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile?: string;
}) {
  const db = getDb();
  if (!db) return null;

  const email = input.ownerEmail.toLowerCase();
  return db.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        industry: input.industry || null,
        website: input.website || null,
        country: input.country,
        timezone: input.timezone,
        gstNumber: input.gstNumber || null,
        businessAddress: input.businessAddress || null,
        ownerName: input.ownerName,
        ownerEmail: email,
        ownerMobile: input.ownerMobile || null,
        members: {
          create: {
            email,
            name: input.ownerName,
            role: "OWNER",
            status: "ACTIVE",
            joinedAt: new Date()
          }
        },
        onboarding: {
          create: {
            currentStep: 2,
            progressPercent: 20,
            lifecycleStatus: "DRAFT"
          }
        },
        properties: {
          create: {
            name: input.name,
            slug: input.slug,
            timezone: input.timezone
          }
        },
        activities: {
          create: {
            actorEmail: email,
            action: "ORGANIZATION_CREATED",
            detail: "Organization and owner workspace created"
          }
        }
      },
      include: organizationInclude
    });

    return organization;
  });
}

export async function updateOrganizationDetails(
  organizationId: string,
  input: {
    name?: string;
    industry?: string;
    website?: string;
    country?: string;
    timezone?: string;
    gstNumber?: string;
    businessAddress?: string;
    ownerName?: string;
    ownerMobile?: string;
    publicPhone?: string | null;
    publicEmail?: string | null;
    publicAddress?: string | null;
    publicBusinessHours?: string | null;
  }
) {
  const db = getDb();
  if (!db) return null;

  return db.organization.update({
    where: { id: organizationId },
    data: input,
    include: organizationInclude
  });
}

export async function updateOnboardingProfile(
  organizationId: string,
  input: Record<string, string | string[] | number | boolean | Date | null | undefined>,
  activity: { actorEmail: string; action: string; detail?: string }
) {
  const db = getDb();
  if (!db) return null;

  await db.$transaction([
    db.onboardingProfile.update({
      where: { organizationId },
      data: input
    }),
    db.onboardingActivity.create({
      data: {
        organizationId,
        actorEmail: activity.actorEmail,
        action: activity.action,
        detail: activity.detail
      }
    })
  ]);

  return db.organization.findUnique({
    where: { id: organizationId },
    include: organizationInclude
  });
}

export async function listOrganizationsForAdmin() {
  const db = getDb();
  if (!db) return [];

  return db.organization.findMany({
    where: { isDemo: false },
    include: organizationInclude,
    orderBy: { updatedAt: "desc" }
  });
}

export async function getOrganizationById(id: string) {
  const db = getDb();
  if (!db) return null;

  return db.organization.findUnique({
    where: { id },
    include: organizationInclude
  });
}

function comparableBotProfile(profile: {
  category?: string; operatingMode?: string; channels?: string[]; capabilities?: string[];
  humanHandoffEnabled?: boolean; actionApprovalNeeded?: boolean; personaName?: string | null;
  businessObjective?: string | null; tone?: string | null; languages?: string[];
  prohibitedClaims?: string[]; escalationTriggers?: string[]; responseSlaMinutes?: number;
  reminderPercent?: number; fallbackEnabled?: boolean; safeFallbackMessage?: string | null;
}) {
  return {
    category: profile.category,
    operatingMode: profile.operatingMode,
    channels: [...(profile.channels || [])].sort(),
    capabilities: [...(profile.capabilities || [])].sort(),
    humanHandoffEnabled: profile.humanHandoffEnabled,
    actionApprovalNeeded: profile.actionApprovalNeeded,
    personaName: profile.personaName || "",
    businessObjective: profile.businessObjective || "",
    tone: profile.tone || "",
    languages: [...(profile.languages || [])],
    prohibitedClaims: [...(profile.prohibitedClaims || [])],
    escalationTriggers: [...(profile.escalationTriggers || [])],
    responseSlaMinutes: profile.responseSlaMinutes,
    reminderPercent: profile.reminderPercent,
    fallbackEnabled: profile.fallbackEnabled,
    safeFallbackMessage: profile.safeFallbackMessage || ""
  };
}

export async function saveOrganizationBotProfile(input: {
  organizationId: string;
  actorEmail: string;
  profile: {
    category: "BUSINESS_AI" | "PINGBOOK" | "FLOWCART" | "STAY" | "RESTAURANT" | "REAL_ESTATE" | "EDUCATION" | "CUSTOM";
    operatingMode: "ANSWER_ONLY" | "LEAD_CAPTURE" | "APPROVED_ACTIONS" | "HUMAN_APPROVAL";
    channels: Array<"WEBSITE" | "WHATSAPP">;
    capabilities: string[];
    humanHandoffEnabled: boolean;
    actionApprovalNeeded: boolean;
    personaName: string;
    businessObjective: string;
    tone: string;
    languages: string[];
    prohibitedClaims: string[];
    escalationTriggers: string[];
    responseSlaMinutes: number;
    reminderPercent: number;
    fallbackEnabled: boolean;
    safeFallbackMessage: string;
  };
}) {
  const db = getDb();
  if (!db) return null;
  const [existing, latestReviewEvent] = await Promise.all([
    db.botProfile.findUnique({ where: { organizationId: input.organizationId } }),
    db.onboardingActivity.findFirst({
      where: {
        organizationId: input.organizationId,
        action: { in: ["WEBSITE_BOT_SUBMITTED_FOR_REVIEW", "WEBSITE_BOT_REVIEW_INVALIDATED"] }
      },
      orderBy: { createdAt: "desc" },
      select: { action: true }
    })
  ]);
  const installationKey = existing?.installationKey || randomBytes(24).toString("base64url");
  const materiallyChanged = !existing || JSON.stringify(comparableBotProfile(existing)) !== JSON.stringify(comparableBotProfile(input.profile));
  const recoverAuditedSubmission = !materiallyChanged
    && ["INSTALLATION_READY", "INSTALLATION_DETECTED"].includes(existing?.status || "")
    && latestReviewEvent?.action === "WEBSITE_BOT_SUBMITTED_FOR_REVIEW";
  const status = recoverAuditedSubmission
    ? "REVIEW_PENDING"
    : statusAfterBotProfileSave(existing?.status, Boolean(existing?.installationDetectedAt), materiallyChanged);
  const personaPack = getBotPersonaPack(input.profile.category);
  const actionMode = input.profile.operatingMode === "APPROVED_ACTIONS" || input.profile.operatingMode === "HUMAN_APPROVAL";
  const leadMode = input.profile.operatingMode !== "ANSWER_ONLY";
  const connectorKeys = personaPack.connectors.map((connector) => connector.key);
  await db.$transaction([
    db.botProfile.upsert({
      where: { organizationId: input.organizationId },
      update: { ...input.profile, personaPackVersion: BOT_PERSONA_PACK_VERSION, installationKey, status, configuredBy: input.actorEmail },
      create: { organizationId: input.organizationId, ...input.profile, personaPackVersion: BOT_PERSONA_PACK_VERSION, installationKey, status, configuredBy: input.actorEmail, kbGateVersion: KB_FRAMEWORK_VERSION }
    }),
    db.botConnectorConfiguration.updateMany({ where: { organizationId: input.organizationId, connectorKey: { notIn: connectorKeys } }, data: { enabled: false, lifecycle: "RETIRED", configuredBy: input.actorEmail } }),
    ...personaPack.connectors.map((connector) => {
      const required = connector.requiredFor === "BASE" || (connector.requiredFor === "LEAD_CAPTURE" && leadMode) || (connector.requiredFor === "APPROVED_ACTIONS" && actionMode);
      return db.botConnectorConfiguration.upsert({
        where: { organizationId_connectorKey: { organizationId: input.organizationId, connectorKey: connector.key } },
        update: { name: connector.name, requiredFor: connector.requiredFor, required, readOperations: connector.reads, writeOperations: connector.writes, unavailableBehavior: connector.unavailableBehavior, configuredBy: input.actorEmail },
        create: { organizationId: input.organizationId, connectorKey: connector.key, name: connector.name, requiredFor: connector.requiredFor, required, readOperations: connector.reads, writeOperations: connector.writes, unavailableBehavior: connector.unavailableBehavior, configuredBy: input.actorEmail }
      });
    }),
    db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "BOT_PROFILE_CONFIGURED",
        detail: `${input.profile.category}: ${input.profile.channels.join(" + ")} · ${input.profile.operatingMode}`
      }
    }),
    ...(existing?.status === "REVIEW_PENDING" && materiallyChanged ? [db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "WEBSITE_BOT_REVIEW_INVALIDATED",
        detail: "A material governed bot-profile change requires the client to review and submit the bot again."
      }
    })] : []),
    ...(recoverAuditedSubmission ? [db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "WEBSITE_BOT_REVIEW_STATE_RESTORED",
        detail: "Restored the latest audited client submission after a non-material profile refresh had demoted its review state."
      }
    })] : [])
  ]);
  return getOrganizationById(input.organizationId);
}

export async function updateWebsiteBotLifecycle(input: {
  organizationId: string;
  actorEmail: string;
  action: WebsiteBotLifecycleAction;
}) {
  const db = getDb();
  if (!db) return null;
  const profile = await db.botProfile.findUnique({ where: { organizationId: input.organizationId } });
  if (!profile || !profile.channels.includes("WEBSITE")) throw new Error("A configured Website Bot is required.");
  let coreCertification: ReturnType<typeof assertCoreLaunchCertification> | null = null;
  if (input.action === "MAKE_LIVE") {
    coreCertification = assertCoreLaunchCertification();
    if (!["REVIEW_PENDING", "PAUSED"].includes(profile.status)) throw new Error("The client must approve the prepared intelligence and submit the bot for review before go-live.");
    const { getOrganizationSubscriptionAccess } = await import("@/lib/subscription-access");
    const subscription = await getOrganizationSubscriptionAccess(input.organizationId);
    if (!subscription?.canUsePaidActions) throw new Error("An active trial or subscription is required.");
    const organization = await db.organization.findUnique({ where: { id: input.organizationId }, select: { status: true } });
    if (!organization || ["SUSPENDED", "REMOVED"].includes(organization.status)) throw new Error("Reactivate the customer before making the bot live.");
    const property = await db.property.findFirst({ where: { organizationId: input.organizationId }, select: { id: true, slug: true } });
    if (!property) throw new Error("A business workspace is required before this bot can go live.");
    const category = profile.category === "PINGBOOK" ? "APPOINTMENTS" : profile.category === "STAY" ? "HOSPITALITY" : profile.category;
    const readiness = await getKnowledgeVerificationReadiness(property.id, category);
    if (!(subscription.planCode === "TRIAL" ? readiness.trialReady : readiness.ready)) {
      if (subscription.planCode === "TRIAL" && readiness.essentials.missing.length) throw new Error(`Approve the missing trial topics: ${readiness.essentials.missing.join(", ")}.`);
      throw new Error(`Product preparation is incomplete. KB coverage ${readiness.coverage.percentage}% (minimum ${profile.kbCoverageMinimum}%), freshness ${readiness.freshnessRate}% (minimum 95%), conflicts ${readiness.conflicts}, unsigned claims ${readiness.unsigned}, pending previews ${readiness.previewPending}, open answer flags ${readiness.openFlags}.`);
    }
    if (profile.operatingMode === "APPROVED_ACTIONS" || profile.operatingMode === "HUMAN_APPROVAL") {
      const requiredConnectors = await db.botConnectorConfiguration.findMany({ where: { organizationId: input.organizationId, required: true, lifecycle: { not: "RETIRED" } }, select: { name: true, enabled: true, lifecycle: true } });
      const unavailable = requiredConnectors.filter((connector) => !connector.enabled || !["LIVE", "MONITORED"].includes(connector.lifecycle));
      if (!requiredConnectors.length || unavailable.length) throw new Error(`Connector preparation is incomplete. ${!requiredConnectors.length ? "No required category connector plan exists." : `${unavailable.map((connector)=>connector.name).join(", ")} must be verified, live, and enabled.`}`);
    }
    const tested = await db.onboardingActivity.findFirst({ where: { organizationId: input.organizationId, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } });
    if (!tested) throw new Error("A recorded customer-question test is required before go-live.");
    const { getTenantKnowledgeRevision, readTenantCertification, tenantCertificationStatus } = await import("@/lib/tenant-intelligence/certification");
    const tenantCertification = await readTenantCertification(property.slug);
    const tenantCertificationGate = tenantCertificationStatus(tenantCertification, await getTenantKnowledgeRevision(property.slug));
    if (!tenantCertificationGate.eligible) throw new Error(`Tenant certification blocked go-live. ${tenantCertificationGate.blocker || "Run certification again."}`);
  }
  const now = new Date();
  const status = nextWebsiteBotStatus(profile.status, input.action, Boolean(profile.installationDetectedAt));
  await db.$transaction([
    db.botProfile.update({
      where: { organizationId: input.organizationId },
      data: {
        status,
        lifecycleUpdatedBy: input.actorEmail,
        liveAt: input.action === "MAKE_LIVE" ? now : profile.liveAt,
        pausedAt: input.action === "PAUSE" ? now : null,
        deletedAt: input.action === "DELETE" ? now : null
      }
    }),
    ...(input.action === "MAKE_LIVE" ? [
      db.organization.update({ where: { id: input.organizationId }, data: { status: "ACTIVE" } }),
      db.onboardingProfile.updateMany({ where: { organizationId: input.organizationId }, data: { lifecycleStatus: "LIVE", currentStep: 6, progressPercent: 100 } })
    ] : []),
    db.onboardingActivity.create({
      data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: `WEBSITE_BOT_${input.action}`, detail: `Website Bot lifecycle changed from ${profile.status} to ${status}` }
    }),
    ...(coreCertification ? [db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "CORE_LAUNCH_CERTIFICATION_PASSED", detail: `${coreCertification.passed}/${coreCertification.questionCount} Core questions passed · score ${coreCertification.score}% · certification ${coreCertification.version}` } })] : [])
  ]);
  return getOrganizationById(input.organizationId);
}

export async function submitWebsiteBotForReview(input: { organizationId: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const profile = await db.botProfile.findUnique({ where: { organizationId: input.organizationId } });
  if (!profile || !profile.channels.includes("WEBSITE")) throw new Error("A configured Website Bot is required.");
  if (["LIVE", "DELETED"].includes(profile.status)) throw new Error(profile.status === "LIVE" ? "This bot is already live." : "Restore the bot before submitting it.");
  const { getOrganizationSubscriptionAccess } = await import("@/lib/subscription-access");
  const subscription = await getOrganizationSubscriptionAccess(input.organizationId);
  if (!subscription?.canUsePaidActions) throw new Error("An active trial or subscription is required.");
  if (subscription.planCode === "TRIAL" && ["APPROVED_ACTIONS", "HUMAN_APPROVAL"].includes(profile.operatingMode)) {
    throw new Error("The 15-day trial supports the Starter Bot without connector-backed actions. Choose an eligible paid setup before enabling connectors.");
  }
  const property = await db.property.findFirst({ where: { organizationId: input.organizationId }, select: { id: true, slug: true } });
  if (!property) throw new Error("A business workspace is required.");
  const category = profile.category === "PINGBOOK" ? "APPOINTMENTS" : profile.category === "STAY" ? "HOSPITALITY" : profile.category;
  const readiness = await getKnowledgeVerificationReadiness(property.id, category);
  if (!(subscription.planCode === "TRIAL" ? readiness.trialReady : readiness.ready)) {
    throw new Error(subscription.planCode === "TRIAL" && readiness.essentials.missing.length ? `Approve the missing trial topics: ${readiness.essentials.missing.join(", ")}.` : "Complete the intelligence readiness checks before submission.");
  }
  const tested = await db.onboardingActivity.findFirst({ where: { organizationId: input.organizationId, action: "WEBSITE_BOT_TEST_COMPLETED" }, select: { id: true } });
  if (!tested) throw new Error("Test at least one customer question before submitting the bot.");
  const { getTenantKnowledgeRevision, readTenantCertification, tenantCertificationStatus } = await import("@/lib/tenant-intelligence/certification");
  const certification = await readTenantCertification(property.slug);
  const certificationStatus = tenantCertificationStatus(certification, await getTenantKnowledgeRevision(property.slug));
  if (!certificationStatus.eligible) throw new Error(`Tenant certification is required before submission. ${certificationStatus.blocker || "Run certification again."}`);
  await db.$transaction([
    db.botProfile.update({ where: { organizationId: input.organizationId }, data: { status: "REVIEW_PENDING", lifecycleUpdatedBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "WEBSITE_BOT_SUBMITTED_FOR_REVIEW", detail: `Client approved the prepared intelligence and submitted the bot for Super Admin review after ${certification.level.toLowerCase()} certification (${certification.results.filter((result) => result.passed).length}/${certification.results.length}).` } })
  ]);
  return getOrganizationById(input.organizationId);
}

export async function declineWebsiteBotApproval(input: {
  organizationId: string;
  actorEmail: string;
  reason: string;
}) {
  const db = getDb();
  if (!db) return null;
  const reason = input.reason.trim();
  if (!reason) throw new Error("Add the correction required before declining approval.");
  const profile = await db.botProfile.findUnique({ where: { organizationId: input.organizationId } });
  if (!profile || !profile.channels.includes("WEBSITE")) throw new Error("A configured AI Bot is required.");
  if (profile.status === "LIVE") throw new Error("Pause the live bot before requesting corrections.");
  if (profile.status === "DELETED") throw new Error("Restore the bot before reviewing it.");
  await db.$transaction([
    db.botProfile.update({
      where: { organizationId: input.organizationId },
      data: { status: "INSTALLATION_READY", lifecycleUpdatedBy: input.actorEmail }
    }),
    db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "WEBSITE_BOT_APPROVAL_DECLINED",
        detail: reason.slice(0, 1200)
      }
    })
  ]);
  return getOrganizationById(input.organizationId);
}

export async function recordWebsiteBotInstallation(slug: string, installationKey: string, origin?: string | null) {
  const db = getDb();
  if (!db) return null;
  const property = await db.property.findUnique({ where: { slug }, select: { organizationId: true, organization: { select: { botProfile: true } } } });
  const profile = property?.organization?.botProfile;
  if (!property?.organizationId || !profile || profile.installationKey !== installationKey || !profile.channels.includes("WEBSITE") || profile.status === "DELETED") return null;
  const { getOrganizationSubscriptionAccess } = await import("@/lib/subscription-access");
  const subscription = await getOrganizationSubscriptionAccess(property.organizationId);
  if (subscription && !subscription.canUsePaidActions) return { status: "SUSPENDED" };
  if (!profile.installationDetectedAt || profile.status === "INSTALLATION_READY") {
    await db.$transaction([
      db.botProfile.update({ where: { id: profile.id }, data: { installationDetectedAt: new Date(), status: profile.status === "LIVE" || profile.status === "PAUSED" ? profile.status : "INSTALLATION_DETECTED" } }),
      db.onboardingActivity.create({ data: { organizationId: property.organizationId, action: "WEBSITE_BOT_INSTALLATION_DETECTED", detail: `Widget installation detected${origin ? ` on ${origin.slice(0, 180)}` : ""}; Super Admin approval required` } })
    ]);
  }
  return { status: profile.status === "LIVE" ? "LIVE" : profile.status === "PAUSED" ? "PAUSED" : "AWAITING_APPROVAL" };
}

export async function saveClientBotPersona(input: {
  organizationId: string;
  actorEmail: string;
  governedCapabilities: string[];
  persona: Pick<NonNullable<Parameters<typeof saveOrganizationBotProfile>[0]["profile"]>, "personaName" | "businessObjective" | "tone" | "languages" | "prohibitedClaims" | "escalationTriggers" | "responseSlaMinutes" | "reminderPercent" | "fallbackEnabled" | "safeFallbackMessage">;
}) {
  const db = getDb();
  if (!db) return null;
  await db.$transaction([
    db.botProfile.update({ where: { organizationId: input.organizationId }, data: { ...input.persona, capabilities: input.governedCapabilities, configuredBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "BOT_PERSONA_UPDATED", detail: `${input.persona.personaName}: ${input.persona.businessObjective.slice(0, 180)}` } })
  ]);
  return getOrganizationById(input.organizationId);
}

const CONNECTOR_LIFECYCLE_VALUES = new Set(["REQUESTED", "AUTHORISED", "CONNECTED", "MAPPED", "SANDBOX_TESTED", "VERIFIED", "LIVE", "MONITORED", "SUSPENDED", "RETIRED"]);

export async function updateBotConnectorPlan(input: { organizationId: string; connectorKey: string; provider?: string | null; lifecycle: string; enabled: boolean; actorEmail: string }) {
  const db = getDb();
  if (!db) return null;
  const lifecycle = input.lifecycle.trim().toUpperCase();
  if (!CONNECTOR_LIFECYCLE_VALUES.has(lifecycle)) throw new Error("Select a valid connector lifecycle state.");
  const connector = await db.botConnectorConfiguration.findUnique({ where: { organizationId_connectorKey: { organizationId: input.organizationId, connectorKey: input.connectorKey } } });
  if (!connector) throw new Error("Connector requirement was not found for this bot persona.");
  if (input.enabled && !["LIVE", "MONITORED"].includes(lifecycle)) throw new Error("A connector can be enabled only after it is verified and live.");
  if (["MAPPED", "SANDBOX_TESTED", "VERIFIED", "LIVE", "MONITORED"].includes(lifecycle) && connector.lastHealthStatus !== "HEALTHY") throw new Error("Run a successful authenticated API test before advancing this connector.");
  await db.$transaction([
    db.botConnectorConfiguration.update({ where: { id: connector.id }, data: { provider: input.provider?.trim().slice(0, 120) || null, lifecycle, enabled: input.enabled, lastVerifiedAt: ["VERIFIED", "LIVE", "MONITORED"].includes(lifecycle) ? new Date() : connector.lastVerifiedAt, configuredBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "BOT_CONNECTOR_UPDATED", detail: `${connector.name}: ${lifecycle} · ${input.enabled ? "enabled" : "disabled"}` } })
  ]);
  return getOrganizationById(input.organizationId);
}

export async function saveOnboardingDocument(input: {
  organizationId: string;
  type: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  content: Uint8Array<ArrayBuffer>;
  actorEmail: string;
}) {
  const db = getDb();
  if (!db) return null;

  return db.$transaction(async (tx) => {
    await tx.onboardingDocument.deleteMany({
      where: { organizationId: input.organizationId, type: input.type }
    });
    const document = await tx.onboardingDocument.create({
      data: {
        organizationId: input.organizationId,
        type: input.type,
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        content: input.content
      },
      select: {
        id: true,
        type: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        status: true,
        createdAt: true
      }
    });
    await tx.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "KYC_DOCUMENT_UPLOADED",
        detail: `${input.type}: ${input.fileName}`
      }
    });
    return document;
  });
}

export async function getOnboardingDocument(id: string) {
  const db = getDb();
  if (!db) return null;

  return db.onboardingDocument.findUnique({
    where: { id },
    include: {
      organization: {
        select: {
          members: {
            select: { email: true, status: true }
          }
        }
      }
    }
  });
}

export async function deleteOnboardingDocument(id: string, organizationId: string) {
  const db = getDb();
  if (!db) return null;

  return db.onboardingDocument.deleteMany({
    where: { id, organizationId }
  });
}

export async function saveOnboardingRegistrationPin(organizationId: string, pin: string) {
  const db = getDb();
  if (!db) return null;

  return db.onboardingCredential.upsert({
    where: { organizationId },
    update: { registrationPin: encryptSecretValue(pin) },
    create: { organizationId, registrationPin: encryptSecretValue(pin) },
    select: { id: true }
  });
}

export async function updateOrganizationStatus(id: string, status: string) {
  const db = getDb();
  if (!db) return null;
  return db.organization.update({ where: { id }, data: { status } });
}

const flowStatusOptions = {
  metaBillingStatus: new Set(["NOT_CONFIRMED", "CONFIRMED", "BLOCKED"]),
  templateStatus: new Set(["NOT_STARTED", "PENDING", "APPROVED", "REJECTED"]),
  firstMessageStatus: new Set(["NOT_STARTED", "READY", "PASSED", "FAILED"])
};

export async function updateOrganizationFlowStatus(input: {
  organizationId: string;
  actorEmail: string;
  metaBillingStatus?: string;
  templateStatus?: string;
  firstMessageStatus?: string;
  note?: string;
}) {
  const db = getDb();
  if (!db) return null;

  const changes: Record<string, string> = {};
  for (const key of ["metaBillingStatus", "templateStatus", "firstMessageStatus"] as const) {
    const value = input[key]?.trim().toUpperCase();
    if (value) {
      if (!flowStatusOptions[key].has(value)) {
        throw new Error(`Unsupported ${key}`);
      }
      changes[key] = value;
    }
  }

  if (!Object.keys(changes).length) {
    return getOrganizationById(input.organizationId);
  }

  const detail = input.note?.trim() || `Updated operating flow: ${Object.entries(changes).map(([key, value]) => `${key}=${value}`).join(", ")}`;
  await db.$transaction([
    db.onboardingProfile.update({
      where: { organizationId: input.organizationId },
      data: changes
    }),
    db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: "FLOW_STATUS_UPDATED",
        detail
      }
    }),
    db.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "FLOW_STATUS_UPDATED",
        targetType: "ONBOARDING_PROFILE",
        targetId: input.organizationId,
        summary: detail,
        metadata: changes
      }
    })
  ]);

  return getOrganizationById(input.organizationId);
}

export async function reviewOrganizationKyc(input: {
  organizationId: string;
  reviewerEmail: string;
  approved: boolean;
  reason?: string;
}) {
  const db = getDb();
  if (!db) return null;

  await db.$transaction([
    db.onboardingProfile.update({
      where: { organizationId: input.organizationId },
      data: {
        kycStatus: input.approved ? "APPROVED" : "REJECTED",
        kycReviewedAt: new Date(),
        kycReviewedBy: input.reviewerEmail,
        kycRejectionReason: input.approved ? null : input.reason || "Business information requires an update",
        lifecycleStatus: input.approved ? "KYC_APPROVED" : "ACTION_REQUIRED",
        lastError: input.approved ? null : input.reason || "Business information requires an update"
      }
    }),
    db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.reviewerEmail,
        action: input.approved ? "KYC_APPROVED" : "KYC_REJECTED",
        detail: input.approved ? "Business verification approved" : input.reason || "Business information requires an update"
      }
    })
  ]);

  return getOrganizationById(input.organizationId);
}
