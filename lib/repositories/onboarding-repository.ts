import { getDb } from "@/lib/db";
import { encryptSecretValue } from "@/lib/field-encryption";

const organizationInclude = {
  onboarding: true,
  subscription: { include: { plan: true } },
  botConfiguration: true,
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
  const db = getDb();
  if (!db) return null;

  const membership = await db.organizationMember.findFirst({
    where: {
      email: email.toLowerCase(),
      status: "ACTIVE"
    },
    include: {
      organization: {
        include: organizationInclude
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return membership?.organization ?? null;
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
  input: Record<string, string | number | boolean | Date | null | undefined>,
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
