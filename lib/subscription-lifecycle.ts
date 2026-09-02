import { getDb } from "@/lib/db";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import { SUBSCRIPTION_GRACE_DAYS, SUSPENDED_DATA_RETENTION_DAYS } from "@/lib/subscription-policy";

export { SUBSCRIPTION_GRACE_DAYS, SUSPENDED_DATA_RETENTION_DAYS } from "@/lib/subscription-policy";

const DAY_MS = 24 * 60 * 60 * 1000;
function addDays(value: Date, days: number) {
  return new Date(value.getTime() + days * DAY_MS);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

async function notifyOnce(input: { organizationId: string; subscriptionId: string; ownerEmail: string; ownerName: string; organizationName: string; action: string; subject: string; heading: string; message: string; deadline?: Date | null }) {
  const db = getDb();
  if (!db) return false;
  const exists = await db.platformAuditLog.findFirst({ where: { organizationId: input.organizationId, targetId: input.subscriptionId, action: input.action }, select: { id: true } });
  if (exists) return false;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://app.aifrogi.com").replace(/\/$/, "");
  const deadline = input.deadline ? new Intl.DateTimeFormat("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" }).format(input.deadline) : null;
  const mail = await sendBookingMail({
    to: input.ownerEmail,
    subject: input.subject,
    body: `${input.heading}\n\n${input.message}${deadline ? `\nDeadline: ${deadline}` : ""}\n\nActivate or renew: ${appUrl}/billing\n\nAiFrogi\ninfo@aifrogi.com\n+91-7410582898`,
    html: `<div style="margin:0;background:#f4f1e8;padding:36px 14px;font-family:Arial,sans-serif;color:#101010"><div style="max-width:620px;margin:auto;overflow:hidden;border:1px solid #ded8cb;border-radius:18px;background:#fff"><div style="padding:28px 30px;background:#050505"><img src="${appUrl}/brand/aifrogi-logo-white.png" alt="AiFrogi" style="width:170px;height:auto"><p style="margin:20px 0 0;color:#e2c66d;font-size:11px;letter-spacing:2px">SUBSCRIPTION NOTICE</p></div><div style="padding:30px"><p style="color:#756f64">Hello ${escapeHtml(input.ownerName)},</p><h1 style="margin:10px 0 16px;font-size:28px">${escapeHtml(input.heading)}</h1><p style="color:#5f5b54;line-height:1.7">${escapeHtml(input.message)}</p>${deadline ? `<div style="margin:22px 0;padding:16px;border-radius:10px;background:#fff6dc"><strong>Action date: ${deadline}</strong></div>` : ""}<a href="${appUrl}/billing" style="display:inline-block;background:#8a6a16;color:#fff;text-decoration:none;padding:14px 21px;border-radius:7px;font-weight:700">Open billing</a><p style="margin-top:24px;color:#756f64;font-size:12px;line-height:1.6">Your data is preserved during the 3-day grace period and for 30 days after suspension. Payment securely resumes eligible services.</p></div><div style="padding:22px 30px;background:#404040;color:#e3e3e3;font-size:12px"><strong style="color:#fff">AiFrogi</strong><br>info@aifrogi.com · +91-7410582898</div></div></div>`
  });
  if (mail.error) return false;
  await db.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: input.action, targetType: "Subscription", targetId: input.subscriptionId, summary: `${input.subject} sent to ${input.ownerEmail}`, metadata: { deadline: input.deadline?.toISOString() || null, messageId: mail.messageId } } });
  return true;
}

export async function reconcileSubscriptionLifecycleForOrganization(organizationId: string, now = new Date(), sendNotifications = false) {
  const db = getDb();
  if (!db) return { state: "UNAVAILABLE", deleted: false };
  let subscription = await db.subscription.findUnique({ where: { organizationId }, include: { plan: true, organization: { select: { id: true, name: true, ownerName: true, ownerEmail: true } } } });
  if (!subscription) return { state: "MISSING", deleted: false };
  const expiry = subscription.status === "COMPLIMENTARY" ? subscription.complimentaryEndsAt : subscription.plan.code === "TRIAL" ? subscription.trialEndsAt : subscription.currentPeriodEnd;
  if (!expiry) return { state: subscription.status, deleted: false };
  const remainingMs = expiry.getTime() - now.getTime();
  const notice = (action: string, subject: string, heading: string, message: string, deadline?: Date | null) => sendNotifications ? notifyOnce({ organizationId, subscriptionId: subscription!.id, ownerEmail: subscription!.organization.ownerEmail, ownerName: subscription!.organization.ownerName, organizationName: subscription!.organization.name, action, subject, heading, message, deadline }) : Promise.resolve(false);

  if (remainingMs > 0) {
    if (remainingMs <= 3 * DAY_MS) await notice("SUBSCRIPTION_EXPIRY_REMINDER_3D", `${subscription.plan.name} expires soon`, "Your plan is nearing its renewal date.", `${subscription.organization.name} remains active. Renew now to avoid entering the grace period.`, expiry);
    if (remainingMs <= DAY_MS) await notice("SUBSCRIPTION_EXPIRY_REMINDER_1D", `${subscription.plan.name} expires tomorrow`, "Renewal is due within one day.", "Complete payment to keep the AI Bot operating without interruption.", expiry);
    return { state: subscription.status, deleted: false };
  }

  if (["TRIALING", "ACTIVE", "COMPLIMENTARY"].includes(subscription.status)) {
    const graceEndsAt = addDays(expiry, SUBSCRIPTION_GRACE_DAYS);
    subscription = await db.subscription.update({ where: { id: subscription.id }, data: { status: "GRACE", graceEndsAt }, include: { plan: true, organization: { select: { id: true, name: true, ownerName: true, ownerEmail: true } } } });
    await db.platformAuditLog.create({ data: { organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: "SUBSCRIPTION_GRACE_STARTED", targetType: "Subscription", targetId: subscription.id, summary: `${subscription.plan.name} expired; 3-day grace period started and data remains preserved.`, metadata: { graceEndsAt: graceEndsAt.toISOString() } } });
    await notice("SUBSCRIPTION_GRACE_EMAIL", "AiFrogi grace period started", "Your plan has entered its 3-day grace period.", "The AI Bot remains available temporarily. Pay before the grace deadline to avoid suspension.", graceEndsAt);
  }

  if (subscription.status === "PAUSED" && !subscription.graceEndsAt) {
    subscription = await db.subscription.update({ where: { id: subscription.id }, data: { status: "SUSPENDED", graceEndsAt: now }, include: { plan: true, organization: { select: { id: true, name: true, ownerName: true, ownerEmail: true } } } });
  }

  const graceEndsAt = subscription.graceEndsAt;
  if (subscription.status === "GRACE" && graceEndsAt) {
    const graceRemaining = graceEndsAt.getTime() - now.getTime();
    if (graceRemaining > 0 && graceRemaining <= DAY_MS) await notice("SUBSCRIPTION_GRACE_REMINDER_1D", "AiFrogi suspension reminder", "Your grace period ends within one day.", "Complete payment now to prevent the AI Bot from entering suspended mode.", graceEndsAt);
    if (graceRemaining <= 0) {
      subscription = await db.subscription.update({ where: { id: subscription.id }, data: { status: "SUSPENDED" }, include: { plan: true, organization: { select: { id: true, name: true, ownerName: true, ownerEmail: true } } } });
      await db.platformAuditLog.create({ data: { organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: "SUBSCRIPTION_AUTOMATICALLY_SUSPENDED", targetType: "Subscription", targetId: subscription.id, summary: "Grace period ended; AI Bot actions suspended while customer data remains preserved.", metadata: { retentionEndsAt: addDays(graceEndsAt, SUSPENDED_DATA_RETENTION_DAYS).toISOString() } } });
      await notice("SUBSCRIPTION_SUSPENDED_EMAIL", "AiFrogi AI Bot suspended", "Your AI Bot is now in suspended mode.", "No data has been deleted. Complete payment to resume service immediately. Data will be permanently removed after 30 days if payment is not received.", addDays(graceEndsAt, SUSPENDED_DATA_RETENTION_DAYS));
    }
  }

  if (subscription.status === "SUSPENDED") {
    const suspendedAt = subscription.graceEndsAt || now;
    const deletionAt = addDays(suspendedAt, SUSPENDED_DATA_RETENTION_DAYS);
    const deletionRemaining = deletionAt.getTime() - now.getTime();
    if (deletionRemaining > 0 && deletionRemaining <= 7 * DAY_MS) await notice("SUBSCRIPTION_DELETION_REMINDER_7D", "AiFrogi data deletion warning", "Your retained workspace data is scheduled for deletion.", "Pay and reactivate within 7 days to preserve the workspace, knowledge base, conversations, and configuration.", deletionAt);
    if (deletionRemaining > 0 && deletionRemaining <= DAY_MS) await notice("SUBSCRIPTION_DELETION_REMINDER_1D", "Final AiFrogi data deletion warning", "Permanent deletion is due within one day.", "This is the final reminder. Activate a paid plan now to retain and restore the workspace.", deletionAt);
    if (deletionRemaining <= 0) {
      await db.platformAuditLog.create({ data: { organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: "SUBSCRIPTION_RETENTION_EXPIRED", targetType: "Organization", targetId: organizationId, summary: `${subscription.organization.name} reached the approved 30-day suspended-data retention limit; permanent deletion initiated.`, metadata: { ownerEmail: subscription.organization.ownerEmail, deletionAt: now.toISOString() } } });
      await db.organization.delete({ where: { id: organizationId } });
      return { state: "DELETED", deleted: true };
    }
  }
  return { state: subscription.status, deleted: false };
}

export async function processSubscriptionLifecycleBatch(now = new Date()) {
  const db = getDb();
  if (!db) return { processed: 0, deleted: 0 };
  const subscriptions = await db.subscription.findMany({ select: { organizationId: true }, take: 500 });
  let deleted = 0;
  for (const subscription of subscriptions) {
    const result = await reconcileSubscriptionLifecycleForOrganization(subscription.organizationId, now, true);
    if (result.deleted) deleted += 1;
  }
  return { processed: subscriptions.length, deleted };
}
