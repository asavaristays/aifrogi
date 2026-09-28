import { randomUUID } from "node:crypto";
import type { AutomationJob, Prisma } from "../../generated/prisma/client";
import { getDb, withDatabaseIdentity } from "@/lib/db";
import { readKnowledgeSettings, writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getWebsiteKnowledgeBase, readCachedKnowledgeBase, buildWebsiteKnowledgeAnswer } from "@/lib/services/website-knowledge-service";
import { getOrganizationSubscriptionAccess } from "@/lib/subscription-access";
import { reviewAnswerGrounding } from "@/lib/sovereign-intelligence/answer-grounding";
import { evaluateVisitorAnswerQuality } from "@/lib/sovereign-intelligence/answer-quality-gate";
import { recordTenantAnswerUsage } from "@/lib/tenant-usage-metering";
import { LEVEL_ONE_JOB, LEVEL_ONE_VERSION, LEVEL_ONE_PROBES, levelOneJobKey, levelOneManifest, levelOneFingerprint, assessLevelOneAnswer, levelOneChecksPassed, isLevelOneProfile, type LevelOneProbeResult } from "@/lib/sovereign-intelligence/level-one";

type Progress = { stage: "QUEUED" | "CRAWLING" | "TESTING" | "READY" | "NEEDS_ATTENTION"; rows: LevelOneProbeResult[]; fingerprint?: string; manifest?: ReturnType<typeof levelOneManifest>; blockers?: string[] };
const json = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
const editableStatuses = ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED"];
function progress(job: AutomationJob): Progress {
  const value = job.result as unknown as Progress | null;
  return value && Array.isArray(value.rows) ? value : { stage: "QUEUED", rows: [] };
}
function ownership(job: AutomationJob) {
  return { id: job.id, propertyId: job.propertyId, actionType: LEVEL_ONE_JOB, status: "RUNNING", lockedBy: job.lockedBy, attemptCount: job.attemptCount, leaseExpiresAt: { gt: new Date() } };
}
async function target(propertyId: string) {
  return getDb()!.property.findUnique({ where: { id: propertyId }, include: { organization: { include: { botProfile: true, members: { where: { status: "ACTIVE", role: "OWNER", invitedBy: "SELF_SERVICE_REGISTRATION" }, select: { email: true } } } } } });
}
async function config(property: NonNullable<Awaited<ReturnType<typeof target>>>, settings: Awaited<ReturnType<typeof readKnowledgeSettings>>) {
  const entries = await getDb()!.knowledgeEntry.findMany({ where: { propertyId: property.id }, select: { id: true, updatedAt: true, status: true }, orderBy: { id: "asc" } });
  return { organizationUpdatedAt: property.organization?.updatedAt, profileUpdatedAt: property.organization?.botProfile?.updatedAt, settings, entries };
}

/** Authenticated callers supply a database-resolved property, never a body tenant id. */
export async function levelOneStatus(propertyId: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const job = await db.automationJob.findUnique({ where: { idempotencyKey: levelOneJobKey(propertyId) } });
  if (!job || job.propertyId !== propertyId || job.actionType !== LEVEL_ONE_JOB) return null;
  const state = progress(job);
  const property = await target(propertyId);
  return { ...state, status: job.status, attemptCount: job.attemptCount, maxAttempts: job.maxAttempts, updatedAt: job.updatedAt, nextRunAt: job.nextRunAt,
    botLive: property?.organization?.botProfile?.status === "LIVE", propertySlug: property?.slug,
    totalChecks: LEVEL_ONE_PROBES.length, canRetry: ["DEAD", "CANCELED"].includes(job.status) && editableStatuses.includes(property?.organization?.botProfile?.status || "") };
}

export async function retryLevelOne(propertyId: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const property = await target(propertyId);
  if (!property?.organization?.members.length || !isLevelOneProfile(property.organization.botProfile) || !editableStatuses.includes(property.organization.botProfile?.status || "")) throw new Error("This workspace is not eligible for automatic trial preparation.");
  const access = await getOrganizationSubscriptionAccess(property.organization.id);
  if (!access?.canUsePaidActions) throw new Error("The trial or subscription is paused.");
  const job = await db.automationJob.findUnique({ where: { idempotencyKey: levelOneJobKey(propertyId) } });
  if (!job) throw new Error("No automatic preparation was scheduled for this workspace.");
  const changed = await db.automationJob.updateMany({ where: { id: job.id, propertyId, actionType: LEVEL_ONE_JOB, status: { in: ["DEAD", "CANCELED"] } }, data: {
    status: "QUEUED", result: json({ stage: "QUEUED", rows: [] }), attemptCount: 0, nextRunAt: new Date(), lastError: null, deadLetterReason: null, completedAt: null, lockedAt: null, lockedBy: null, leaseExpiresAt: null
  } });
  if (!changed.count) throw new Error("Preparation is already active or complete.");
  return levelOneStatus(propertyId);
}

async function checkpoint(job: AutomationJob, state: Progress, terminal = false) {
  const db = getDb()!;
  return db.automationJob.updateMany({ where: ownership(job), data: {
    result: json(state), status: terminal ? "DEAD" : "QUEUED", attemptCount: terminal ? job.attemptCount : 0,
    nextRunAt: new Date(), completedAt: terminal ? new Date() : null,
    lastError: terminal ? state.blockers?.join(" ").slice(0, 1000) : null,
    deadLetterReason: terminal ? state.blockers?.join(" ").slice(0, 1000) : null,
    lockedAt: null, lockedBy: null, leaseExpiresAt: null
  } });
}

/** One bounded unit per invocation: a crawl or up to two real-answer probes. */
export async function executeLevelOneJob(job: AutomationJob) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const property = await target(job.propertyId);
  const org = property?.organization;
  if (!property || !org || !org.members.length || !isLevelOneProfile(org.botProfile) || !editableStatuses.includes(org.botProfile?.status || "") || ["REMOVED", "PENDING_EMAIL"].includes(org.status)) {
    return checkpoint(job, { ...progress(job), stage: "NEEDS_ATTENTION", blockers: ["Workspace ownership or bot lifecycle changed. Automatic activation stopped."] }, true);
  }
  const access = await getOrganizationSubscriptionAccess(org.id);
  if (!access?.canUsePaidActions) return checkpoint(job, { ...progress(job), stage: "NEEDS_ATTENTION", blockers: ["Trial or subscription is paused."] }, true);
  let settings = await readKnowledgeSettings(property.slug);
  const state = progress(job);
  if (state.stage === "QUEUED" || state.stage === "CRAWLING") {
    if (!settings.sourceUrl && !org.website) return checkpoint(job, { stage: "NEEDS_ATTENTION", rows: [], blockers: ["Add your official website in Intelligence, then retry preparation."] }, true);
    // Public serving is still blocked by the DRAFT bot lifecycle. Never turn a
    // previously saved owner knowledge pause back on while activating the bot.
    if (!settings.sourceUrl) settings = await writeKnowledgeSettings(property.slug, { sourceUrl: org.website!, status: "DRAFT" });
    const started = await db.automationJob.updateMany({ where: ownership(job), data: { result: json({ stage: "CRAWLING", rows: [] }) } });
    if (!started.count) return null;
    const snapshot = await getWebsiteKnowledgeBase(property.slug, true);
    settings = await readKnowledgeSettings(property.slug);
    if (settings.status !== "READY") throw new Error("The website could not be refreshed. Preparation will retry; the previous capture is not treated as a successful crawl.");
    const manifest = levelOneManifest(snapshot, settings.sourceUrl);
    if (!manifest.ready) return checkpoint(job, { stage: "NEEDS_ATTENTION", rows: [], manifest, blockers: manifest.blockers }, true);
    return checkpoint(job, { stage: "TESTING", rows: [], manifest, fingerprint: levelOneFingerprint(snapshot, await config(property, settings)) });
  }
  if (state.stage !== "TESTING" || !state.fingerprint) throw new Error("Invalid preparation checkpoint.");
  const snapshot = await readCachedKnowledgeBase(property.slug, settings.sourceUrl, 6 * 3600000);
  if (!snapshot || settings.status !== "READY" || levelOneFingerprint(snapshot, await config(property, settings)) !== state.fingerprint) {
    return checkpoint(job, { ...state, stage: "NEEDS_ATTENTION", blockers: ["Hotel information changed during testing. Retry to test the current version."] }, true);
  }
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("The answer service is unavailable. Preparation will retry.");
  const pending = LEVEL_ONE_PROBES.filter(probe => !state.rows.some(row => row.id === probe.id)).slice(0, 2);
  const context = snapshot.pages.map(page => `Source: ${page.url}\n${page.text}`).join("\n\n");
  // Limit review input deterministically; oversized captures need a scoped test
  // path before activation rather than silently dropping evidence.
  if (context.length > 100000) return checkpoint(job, { ...state, stage: "NEEDS_ATTENTION", blockers: ["This website needs a scoped knowledge review before automatic activation."] }, true);
  const rows = await Promise.all(pending.map(async probe => {
    const started = Date.now();
    const answer = await buildWebsiteKnowledgeAnswer({ propertySlug: property.slug, question: probe.question, evaluationMode: true, preparationSnapshot: snapshot });
    const review = probe.id === "privacy" || !answer ? null : await reviewAnswerGrounding({ apiKey, model: process.env.OPENAI_MODEL || "gpt-4.1-mini", question: probe.question, answer: answer.answer,
      context: `${context}\nPublic profile: ${JSON.stringify({ name: org.name, address: org.publicAddress, phone: org.publicPhone, email: org.publicEmail })}`, signal: AbortSignal.timeout(12000) });
    const issues = assessLevelOneAnswer(probe, answer, review);
    if (answer) issues.push(...evaluateVisitorAnswerQuality({ question: probe.question, answer: answer.answer, decision: answer.decision }).reasons);
    await recordTenantAnswerUsage({ organizationId: org.id, evidenceId: `${job.id}:${state.fingerprint}:${probe.id}:${job.attemptCount}`, certification: true, usage: {
      inputTokens: (answer?.modelUsage?.inputTokens || 0) + (review?.inputTokens || 0), outputTokens: (answer?.modelUsage?.outputTokens || 0) + (review?.outputTokens || 0),
      model: answer?.model || "NON_MODEL", attempts: answer?.reliability.attemptCount || 0, latencyMs: Date.now() - started
    } });
    return { id: probe.id, question: probe.question, answer: answer?.answer || "", passed: issues.length === 0, issues, latencyMs: Date.now() - started, sourceUrls: answer?.sourceUrls || [] };
  }));
  const next = { ...state, rows: [...state.rows, ...rows] };
  if (rows.some(row => !row.passed)) return checkpoint(job, { ...next, stage: "NEEDS_ATTENTION", blockers: ["Some guest answers need attention. Review the failed questions below and correct the information or contact support."] }, true);
  if (!levelOneChecksPassed(next.rows)) return checkpoint(job, next);
  const current = await target(property.id);
  const latestSettings = await readKnowledgeSettings(property.slug);
  const latestSnapshot = await readCachedKnowledgeBase(property.slug, latestSettings.sourceUrl, 6 * 3600000);
  if (!current || !latestSnapshot || latestSettings.status !== "READY" || !latestSettings.approvedForAi || levelOneFingerprint(latestSnapshot, await config(current, latestSettings)) !== state.fingerprint) return checkpoint(job, { ...next, stage: "NEEDS_ATTENTION", blockers: ["Information changed or knowledge was paused before activation. Review Intelligence, then retry the current version."] }, true);
  // Serving remains blocked by DRAFT until the durable job result and profile
  // update commit together. A stale worker cannot publish or overwrite a pause.
  return db.$transaction(async tx => {
    const entitlement = await getOrganizationSubscriptionAccess(org.id);
    if (!entitlement?.canUsePaidActions || (entitlement.trialEndsAt && entitlement.trialEndsAt <= new Date())) throw new Error("The trial or subscription expired before activation.");
    const completed = await tx.automationJob.updateMany({ where: ownership(job), data: { status: "SUCCEEDED", result: json({ ...next, stage: "READY" }), completedAt: new Date(), lockedAt: null, lockedBy: null, leaseExpiresAt: null, lastError: null } });
    if (!completed.count) return null;
    const activated = await tx.botProfile.updateMany({ where: {
      organizationId: org.id, status: { in: editableStatuses }, updatedAt: current.organization!.botProfile!.updatedAt,
      // Owner revocation need not update the profile timestamp. Check authority
      // in the activation statement itself, not only before model/network work.
      organization: { is: { updatedAt: current.organization!.updatedAt, status: { notIn: ["REMOVED", "PENDING_EMAIL"] }, members: { some: { status: "ACTIVE", role: "OWNER", invitedBy: "SELF_SERVICE_REGISTRATION" } } } }
    }, data: { status: "LIVE", liveAt: new Date(), kbGateVersion: LEVEL_ONE_VERSION, lifecycleUpdatedBy: "level-one-preparation" } });
    if (!activated.count) throw new Error("Bot lifecycle changed before activation.");
    await tx.onboardingActivity.create({ data: { organizationId: org.id, actorEmail: "level-one-preparation", action: "TRIAL_BASIC_PUBLIC_BOT_ACTIVATED", detail: `${LEVEL_ONE_VERSION}: ${next.rows.length}/${LEVEL_ONE_PROBES.length} automated real-answer checks; source ${state.fingerprint}. Public information only; live bookings require reservations. Not a human accuracy certification.` } });
    return completed;
  });
}

/** Runs outside the cron's long transaction. Each database call is identity-bound. */
export async function runLevelOnePreparation() {
  return withDatabaseIdentity({ organizationId: "", platformAuthority: true, actor: "level-one-scheduler", systemPurpose: "prepare-verified-trials" }, async () => {
    const db = getDb();
    if (!db) throw new Error("Database unavailable.");
    const now = new Date();
    const job = await db.automationJob.findFirst({ where: { actionType: LEVEL_ONE_JOB, OR: [{ status: { in: ["QUEUED", "RETRY"] }, nextRunAt: { lte: now } }, { status: "RUNNING", leaseExpiresAt: { lt: now } }] }, orderBy: [{ nextRunAt: "asc" }, { createdAt: "asc" }] });
    if (!job) return { processed: 0 };
    const worker = `level-one:${randomUUID()}`;
    const claimed = await db.automationJob.updateMany({ where: { id: job.id, status: job.status, attemptCount: job.attemptCount, ...(job.status === "RUNNING" ? { leaseExpiresAt: { lt: now } } : { nextRunAt: { lte: now } }) }, data: { status: "RUNNING", lockedBy: worker, lockedAt: now, leaseExpiresAt: new Date(now.getTime() + 600000), attemptCount: { increment: 1 } } });
    if (!claimed.count) return { processed: 0 };
    const owned = await db.automationJob.findUniqueOrThrow({ where: { id: job.id } });
    const property = await db.property.findUnique({ where: { id: job.propertyId }, select: { organizationId: true } });
    if (!property?.organizationId) throw new Error("Preparation tenant no longer exists.");
    return withDatabaseIdentity({ organizationId: property.organizationId, platformAuthority: false, actor: worker, systemPurpose: "" }, async () => {
      try {
        if (owned.attemptCount > owned.maxAttempts) return checkpoint(owned, { ...progress(owned), stage: "NEEDS_ATTENTION", blockers: ["Preparation stopped after repeated interrupted attempts. Retry or contact support."] }, true);
        await executeLevelOneJob(owned);
        return { processed: 1 };
      } catch {
        const terminal = owned.attemptCount >= owned.maxAttempts;
        await getDb()!.automationJob.updateMany({ where: ownership(owned), data: { status: terminal ? "DEAD" : "RETRY", result: json({ ...progress(owned), ...(terminal ? { stage: "NEEDS_ATTENTION" } : {}), blockers: ["Website or answer preparation could not finish. Retry from this page or contact support if it continues."] }), nextRunAt: new Date(Date.now() + owned.attemptCount * 60000), completedAt: terminal ? new Date() : null, lastError: "Preparation failed; no bot was activated.", lockedAt: null, lockedBy: null, leaseExpiresAt: null } });
        return { processed: 1, retry: !terminal };
      }
    });
  });
}
