import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "../generated/prisma/client";
import { getDb } from "@/lib/db";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import { authorizeTrialWebsiteSource, normalizeWebsiteSource, websiteSourceHash } from "@/lib/repositories/website-source-consent-repository";

export const WEBSITE_CAPTURE_JOB = "CAPTURE_AUTHORIZED_WEBSITE";
const LINK_TTL_MS = 48 * 60 * 60 * 1000;
const TRIAL_MS = 15 * 24 * 60 * 60 * 1000;

type TokenPayload = { v: 1; requestId: string; organizationId: string; propertyId: string; sourceUrlHash: string; ownerEmail: string; exp: number };

function secret() {
  const value = process.env.AUTH_SESSION_SECRET?.trim();
  if (!value || value === "change-this-in-production") throw new Error("Secure authorization links are not configured.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(`website-reauthorization-v1\n${value}`).digest("base64url");
}

function encode(payload: TokenPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function inspectWebsiteReauthorizationToken(token: string, now = new Date()) {
  const [body, received, extra] = token.split(".");
  if (!body || !received || extra) throw new Error("This authorization link is invalid.");
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(received);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error("This authorization link is invalid.");
  let payload: TokenPayload;
  try { payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload; }
  catch { throw new Error("This authorization link is invalid."); }
  if (payload.v !== 1 || !payload.requestId || !payload.organizationId || !payload.propertyId || !payload.ownerEmail || !payload.sourceUrlHash) throw new Error("This authorization link is invalid.");
  if (!Number.isFinite(payload.exp) || payload.exp <= now.getTime()) throw new Error("This authorization link has expired. Ask AiFrogi to send a new one.");
  return payload;
}

function appUrl() {
  return (process.env.AIFROGI_APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/+$/, "");
}

export async function sendWebsiteReauthorization(input: { organizationId: string; propertyId: string; sourceUrl: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const sourceUrl = normalizeWebsiteSource(input.sourceUrl);
  const property = await db.property.findFirst({ where: { id: input.propertyId, organizationId: input.organizationId }, include: { organization: { select: { ownerEmail: true, ownerName: true, name: true } } } });
  if (!property?.organization?.ownerEmail) throw new Error("Property owner email is unavailable.");
  const owner = property.organization;
  const expiresAt = new Date(Date.now() + LINK_TTL_MS);
  const request = await db.platformAuditLog.create({ data: {
    organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "PLATFORM_ADMIN", action: "WEBSITE_SOURCE_REAUTHORIZATION_SENT",
    targetType: "Property", targetId: property.id, summary: `Website authorization link sent to ${property.organization.ownerEmail}.`,
    metadata: { propertyId: property.id, sourceUrl, sourceUrlHash: websiteSourceHash(sourceUrl), ownerEmail: owner.ownerEmail.toLowerCase(), expiresAt: expiresAt.toISOString() }
  } });
  const token = encode({ v: 1, requestId: request.id, organizationId: input.organizationId, propertyId: property.id, sourceUrlHash: websiteSourceHash(sourceUrl), ownerEmail: owner.ownerEmail.toLowerCase(), exp: expiresAt.getTime() });
  const link = `${appUrl()}/website-authorization?token=${encodeURIComponent(token)}`;
  const mail = await sendBookingMail({
    to: owner.ownerEmail,
    subject: `Authorize website knowledge for ${owner.name}`,
    body: `Hello ${owner.ownerName},\n\nAiFrogi needs your authorization to read public webpage text from ${sourceUrl} and use approved facts to prepare your AI bot. This does not authorize bookings, payments, private-area access, or collection behind a login.\n\nReview and authorize here:\n${link}\n\nThe link expires in 48 hours and can be used once. The 15-day trial authorization begins only after you confirm. Your bot will remain paused until its intelligence gates are separately approved.\n\nAiFrogi`
  });
  if (mail.error || !mail.messageId) throw new Error("Authorization email could not be delivered.");
  return { requestId: request.id, ownerEmail: owner.ownerEmail, expiresAt };
}

function metadata(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function acceptWebsiteReauthorization(token: string, acceptedIpHash?: string | null) {
  const payload = inspectWebsiteReauthorizationToken(token);
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  return db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "PlatformAuditLog" WHERE id = ${payload.requestId} FOR UPDATE`;
    const request = await tx.platformAuditLog.findFirst({ where: { id: payload.requestId, organizationId: payload.organizationId, action: "WEBSITE_SOURCE_REAUTHORIZATION_SENT", targetType: "Property", targetId: payload.propertyId } });
    if (!request) throw new Error("This authorization request is invalid.");
    const prior = await tx.platformAuditLog.findFirst({ where: { organizationId: payload.organizationId, action: "WEBSITE_SOURCE_REAUTHORIZATION_ACCEPTED", targetType: "AuthorizationRequest", targetId: payload.requestId } });
    if (prior) throw new Error("This authorization link has already been used.");
    const requestMeta = metadata(request.metadata);
    const property = await tx.property.findFirst({ where: { id: payload.propertyId, organizationId: payload.organizationId }, include: { organization: { select: { ownerEmail: true } } } });
    const sourceUrl = String(requestMeta.sourceUrl || "");
    if (!property?.organization || property.organization.ownerEmail.toLowerCase() !== payload.ownerEmail || websiteSourceHash(sourceUrl) !== payload.sourceUrlHash || requestMeta.sourceUrlHash !== payload.sourceUrlHash) throw new Error("Property ownership or website changed. Ask AiFrogi to send a new link.");
    const now = new Date();
    const consent = await authorizeTrialWebsiteSource({ organizationId: payload.organizationId, propertyId: payload.propertyId, sourceUrl, ownerEmail: payload.ownerEmail, acceptedIpHash, authorizedAt: now, trialExpiresAt: new Date(now.getTime() + TRIAL_MS) });
    await tx.platformAuditLog.create({ data: { organizationId: payload.organizationId, actorEmail: payload.ownerEmail, actorRole: "OWNER", action: "WEBSITE_SOURCE_REAUTHORIZATION_ACCEPTED", targetType: "AuthorizationRequest", targetId: payload.requestId, summary: "Owner accepted website text capture terms for a 15-day trial.", metadata: { propertyId: payload.propertyId, consentId: consent.id, sourceUrlHash: payload.sourceUrlHash, termsVersion: consent.termsVersion } } });
    await tx.automationJob.upsert({ where: { idempotencyKey: `website-capture:${payload.propertyId}:${payload.sourceUrlHash}` }, update: { status: "QUEUED", payload: { sourceUrl }, result: Prisma.JsonNull, attemptCount: 0, scheduledFor: now, nextRunAt: now, completedAt: null, lockedAt: null, lockedBy: null, leaseExpiresAt: null, lastError: null, deadLetterReason: null, createdBy: payload.ownerEmail }, create: { propertyId: payload.propertyId, workflowId: "website-source-reauthorization", workflowVersion: 1, triggerType: "OWNER_AUTHORIZATION", triggerRef: payload.requestId, actionType: WEBSITE_CAPTURE_JOB, status: "QUEUED", priority: 1, payload: { sourceUrl }, idempotencyKey: `website-capture:${payload.propertyId}:${payload.sourceUrlHash}`, scheduledFor: now, nextRunAt: now, maxAttempts: 3, createdBy: payload.ownerEmail } });
    return { propertyId: property.id, sourceUrl, trialExpiresAt: consent.trialExpiresAt };
  }, { maxWait: 5000, timeout: 15000 });
}
