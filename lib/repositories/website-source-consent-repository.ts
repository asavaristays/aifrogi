import { createHash } from "node:crypto";
import { getDb } from "@/lib/db";
import { evaluateWebsiteSourceAuthorization, WEBSITE_SOURCE_TERMS_VERSION } from "@/lib/website-source-consent-policy";

export function normalizeWebsiteSource(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.username = "";
  url.password = "";
  url.hostname = url.hostname.toLowerCase();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url.toString();
}

export function websiteSourceHash(value: string) {
  return createHash("sha256").update(normalizeWebsiteSource(value)).digest("hex");
}

export async function requireWebsiteSourceAuthorization(propertySlug: string, sourceUrl: string, now = new Date()) {
  const db = getDb();
  if (!db) throw new Error("Website source authorization is unreadable.");
  try {
    const property = await db.property.findUnique({
      where: { slug: propertySlug },
      select: { id: true, organizationId: true, websiteConsentEnforcedAt: true, websiteSourceConsents: { where: { sourceUrlHash: websiteSourceHash(sourceUrl) }, orderBy: { updatedAt: "desc" }, take: 1 } }
    });
    if (!property?.organizationId) throw new Error("Website source authorization is missing.");
    if (!property.websiteConsentEnforcedAt) return { allowed: true, phase: "LEGACY" as const, code: "LEGACY_NOT_ENFORCED" as const };
    const stored = property.websiteSourceConsents[0];
    // Canonical consent rows for non-website sources may not have a URL. A
    // website authorization must fail closed instead of passing a nullable URL
    // into the website-only policy evaluator.
    const consent = stored?.sourceUrl
      ? { ...stored, sourceUrl: stored.sourceUrl, organizationId: property.organizationId }
      : null;
    const decision = evaluateWebsiteSourceAuthorization({ organizationId: property.organizationId, propertyId: property.id, sourceUrl, consent, now });
    if (!decision.allowed) throw new Error(`Website source authorization denied: ${decision.code}.`);
    return decision;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Website source authorization denied:")) throw error;
    throw new Error("Website source authorization is unreadable.");
  }
}

export async function authorizeTrialWebsiteSource(input: { organizationId: string; propertyId: string; sourceUrl: string; ownerEmail: string; acceptedIpHash?: string | null; authorizedAt: Date; trialExpiresAt: Date }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const sourceUrl = normalizeWebsiteSource(input.sourceUrl);
  const sourceUrlHash = websiteSourceHash(sourceUrl);
  return db.$transaction(async (tx) => {
    const property = await tx.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, select: { id: true } });
    if (!property) throw new Error("Property not found.");
    const source = await tx.knowledgeSource.upsert({
      where: { propertyId_sourceType_canonicalIdentityHash: { propertyId: input.propertyId, sourceType: "WEBSITE", canonicalIdentityHash: sourceUrlHash } },
      update: { canonicalIdentity: sourceUrl, state: "AUTHORIZED", audienceCeiling: "PUBLIC", revokedAt: null },
      create: { propertyId: input.propertyId, sourceType: "WEBSITE", canonicalIdentity: sourceUrl, canonicalIdentityHash: sourceUrlHash, state: "AUTHORIZED", audienceCeiling: "PUBLIC" }
    });
    const consent = await tx.websiteSourceConsent.upsert({
      where: { propertyId_sourceUrlHash: { propertyId: input.propertyId, sourceUrlHash } },
      update: { sourceUrl, sourceType: "WEBSITE", canonicalIdentity: sourceUrl, canonicalIdentityHash: sourceUrlHash, sourceId: source.id, termsVersion: WEBSITE_SOURCE_TERMS_VERSION, status: "TRIAL_AUTHORIZED", trialAuthorizedAt: input.authorizedAt, trialExpiresAt: input.trialExpiresAt, acceptedByEmail: input.ownerEmail, acceptedIpHash: input.acceptedIpHash || null, authorityScope: { capture: true }, audienceCeiling: "RESTRICTED", effectiveFrom: input.authorizedAt, effectiveUntil: input.trialExpiresAt, postTrialMethod: null, postTrialApprovedBy: null, postTrialApprovedAt: null, approvalEvidenceRef: null, revokedAt: null, revokedBy: null, revocationReason: null },
      create: { propertyId: input.propertyId, sourceUrl, sourceUrlHash, sourceType: "WEBSITE", canonicalIdentity: sourceUrl, canonicalIdentityHash: sourceUrlHash, sourceId: source.id, termsVersion: WEBSITE_SOURCE_TERMS_VERSION, status: "TRIAL_AUTHORIZED", trialAuthorizedAt: input.authorizedAt, trialExpiresAt: input.trialExpiresAt, acceptedByEmail: input.ownerEmail, acceptedIpHash: input.acceptedIpHash || null, authorityScope: { capture: true }, audienceCeiling: "RESTRICTED", effectiveFrom: input.authorizedAt, effectiveUntil: input.trialExpiresAt }
    });
    await tx.property.update({ where: { id: input.propertyId }, data: { websiteConsentEnforcedAt: input.authorizedAt } });
    return consent;
  });
}

export async function approvePostTrialWebsiteSource(input: { organizationId: string; propertyId: string; sourceUrl: string; approvedBy: string; method: "EMAIL" | "SIGNED_LETTER"; evidenceRef: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const evidenceRef = input.evidenceRef.trim();
  const approvedBy = input.approvedBy.trim().toLowerCase();
  if (!evidenceRef || !approvedBy) throw new Error("Approver and evidence reference are required.");
  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, select: { id: true } });
  if (!property) throw new Error("Property not found.");
  const consent = await db.websiteSourceConsent.update({
    where: { propertyId_sourceUrlHash: { propertyId: property.id, sourceUrlHash: websiteSourceHash(input.sourceUrl) } },
    data: { status: "POST_TRIAL_APPROVED", postTrialMethod: input.method, postTrialApprovedBy: approvedBy, postTrialApprovedAt: new Date(), approvalEvidenceRef: evidenceRef, revokedAt: null, revokedBy: null, revocationReason: null }
  });
  await db.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "PLATFORM_ADMIN", action: "WEBSITE_SOURCE_POST_TRIAL_APPROVED", targetType: "WebsiteSourceConsent", targetId: consent.id, summary: `Post-trial website authorization recorded by ${input.method}.`, metadata: { propertyId: property.id, approvedBy, evidenceRef } } });
  return consent;
}

export async function revokeWebsiteSourceAuthorization(input: { organizationId: string; propertyId: string; sourceUrl: string; reason: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const reason = input.reason.trim();
  if (!reason) throw new Error("Revocation reason is required.");
  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, select: { id: true } });
  if (!property) throw new Error("Property not found.");
  const consent = await db.websiteSourceConsent.update({ where: { propertyId_sourceUrlHash: { propertyId: property.id, sourceUrlHash: websiteSourceHash(input.sourceUrl) } }, data: { status: "REVOKED", revokedAt: new Date(), revokedBy: input.actorEmail, revocationReason: reason } });
  await db.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "PLATFORM_ADMIN", action: "WEBSITE_SOURCE_AUTHORIZATION_REVOKED", targetType: "WebsiteSourceConsent", targetId: consent.id, summary: "Website source authorization revoked.", metadata: { propertyId: property.id, reason } } });
  return consent;
}
