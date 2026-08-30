import { createHash, randomBytes } from "crypto";
import { getDb } from "@/lib/db";

export const SELF_SERVICE_REGISTRATION = "SELF_SERVICE_REGISTRATION";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function slugBase(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "workspace";
}

export async function registerTrialOrganization(input: {
  companyName: string;
  ownerName: string;
  ownerEmail: string;
  ownerMobile?: string;
  website: string;
  industry: string;
  country: string;
  timezone: string;
  source?: string;
  botCategory?: "BUSINESS_AI" | "STAY" | "PINGBOOK" | "RESTAURANT" | "REAL_ESTATE" | "FLOWCART" | "CUSTOM";
}) {
  const db = getDb();
  if (!db) throw new Error("Registration is temporarily unavailable.");
  const email = input.ownerEmail.trim().toLowerCase();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
    const existing = await tx.organizationMember.findFirst({
      where: { email },
      include: { organization: { select: { id: true, status: true } } },
      orderBy: { createdAt: "asc" }
    });

    if (existing) {
      const resumable = existing.status === "INVITED" && existing.invitedBy === SELF_SERVICE_REGISTRATION && existing.organization.status === "PENDING_EMAIL";
      if (!resumable) throw new Error("An AiFrogi account already uses this email. Sign in or contact your workspace administrator.");
      await tx.organization.update({
        where: { id: existing.organization.id },
        data: { name: input.companyName, industry: input.industry, website: input.website, country: input.country, timezone: input.timezone, ownerName: input.ownerName, ownerMobile: input.ownerMobile || null }
      });
      await tx.property.updateMany({ where: { organizationId: existing.organization.id }, data: { name: input.companyName, timezone: input.timezone } });
      await tx.botProfile.upsert({ where: { organizationId: existing.organization.id }, update: { category: input.botCategory || "BUSINESS_AI" }, create: { organizationId: existing.organization.id, category: input.botCategory || "BUSINESS_AI", status: "DRAFT" } });
      await tx.organizationMember.update({
        where: { id: existing.id },
        data: { name: input.ownerName, invitationTokenHash: tokenHash(token), invitationExpiresAt: expiresAt, invitedAt: new Date() }
      });
      await tx.onboardingActivity.create({
        data: { organizationId: existing.organization.id, actorEmail: email, action: "ACTIVATION_LINK_REISSUED", detail: "Owner requested a new email activation link" }
      });
      return { organizationId: existing.organization.id, email, token, expiresAt, resumed: true };
    }

    const slug = `${slugBase(input.companyName)}-${randomBytes(3).toString("hex")}`;
    const organization = await tx.organization.create({
      data: {
        name: input.companyName,
        slug,
        industry: input.industry,
        website: input.website,
        country: input.country,
        timezone: input.timezone,
        ownerName: input.ownerName,
        ownerEmail: email,
        ownerMobile: input.ownerMobile || null,
        status: "PENDING_EMAIL",
        plan: "TRIAL",
        members: {
          create: {
            email,
            name: input.ownerName,
            role: "OWNER",
            status: "INVITED",
            invitationTokenHash: tokenHash(token),
            invitationExpiresAt: expiresAt,
            invitedBy: SELF_SERVICE_REGISTRATION
          }
        },
        onboarding: {
          create: { currentStep: 1, progressPercent: 10, lifecycleStatus: "EMAIL_VERIFICATION" }
        },
        properties: {
          create: { name: input.companyName, slug, timezone: input.timezone }
        },
        botProfile: {
          create: { category: input.botCategory || "BUSINESS_AI", status: "DRAFT" }
        },
        activities: {
          create: { actorEmail: email, action: "TRIAL_REGISTERED", detail: `Trial workspace reserved; source=${input.source || "direct"}; email verification required` }
        }
      },
      select: { id: true }
    });
    return { organizationId: organization.id, email, token, expiresAt, resumed: false };
  });
}

export async function recordRegistrationEmailResult(organizationId: string, email: string, delivered: boolean) {
  const db = getDb();
  if (!db) return null;
  return db.onboardingActivity.create({
    data: {
      organizationId,
      actorEmail: email,
      action: delivered ? "ACTIVATION_EMAIL_SENT" : "ACTIVATION_EMAIL_FAILED",
      detail: delivered ? "Owner activation email sent" : "Activation email could not be delivered; registration remains resumable"
    }
  });
}
