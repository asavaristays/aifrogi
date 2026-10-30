import { getBootstrapDb } from "@/lib/db";

export const SUBSCRIPTION_NOTICE_ACTIONS = [
  "SUBSCRIPTION_EXPIRY_REMINDER_3D", "SUBSCRIPTION_EXPIRY_REMINDER_1D",
  "SUBSCRIPTION_GRACE_EMAIL", "SUBSCRIPTION_GRACE_REMINDER_1D",
  "SUBSCRIPTION_SUSPENDED_EMAIL", "SUBSCRIPTION_DELETION_REMINDER_7D",
  "SUBSCRIPTION_DELETION_REMINDER_1D", "SUBSCRIPTION_NOTICE_RESERVED"
];

/** Commit the reservation before SMTP. An uncertain send is never retried automatically. */
export async function reserveSubscriptionNotice(organizationId: string, subscriptionId: string) {
  if (process.env.AIFROGI_SUBSCRIPTION_REMINDERS_ENABLED !== "1") return false;
  const db = getBootstrapDb();
  if (!db) return false;
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT set_config('app.organization_id', ${organizationId}, true), set_config('app.platform_authority', 'true', true), set_config('app.security_actor', 'subscription-notice-reservation', true), set_config('app.system_purpose', 'subscription-notice-once', true)`;
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`subscription-notice:${organizationId}:${subscriptionId}`}, 0))`;
    const subscription = await tx.subscription.findFirst({ where: { id: subscriptionId, organizationId }, select: { id: true, organization: { select: { status: true } } } });
    if (!subscription || subscription.organization.status === "REMOVED") return false;
    const previous = await tx.platformAuditLog.findFirst({ where: { organizationId, targetId: subscriptionId, action: { in: SUBSCRIPTION_NOTICE_ACTIONS } }, select: { id: true } });
    if (previous) return false;
    await tx.platformAuditLog.create({ data: { organizationId, actorEmail: "system@aifrogi.com", actorRole: "SYSTEM", action: "SUBSCRIPTION_NOTICE_RESERVED", targetType: "Subscription", targetId: subscriptionId, summary: "One subscription notice reserved before delivery. Automatic repeats and retries are blocked." } });
    return true;
  }, { maxWait: 5000, timeout: 15000 });
}
