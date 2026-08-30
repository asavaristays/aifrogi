import { getDb } from "@/lib/db";
import { ensureOrganizationSubscription } from "@/lib/billing-super-admin";
import { TRIAL_DAYS } from "@/lib/trial-policy";

export type SubscriptionAccessState = {
  planCode: string;
  planName: string;
  status: string;
  trialEndsAt: Date | null;
  daysLeft: number | null;
  paused: boolean;
  canUsePaidActions: boolean;
  message: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getOrganizationSubscriptionAccess(
  organizationId: string,
  now = new Date()
): Promise<SubscriptionAccessState | null> {
  const db = getDb();
  if (!db) return null;

  await ensureOrganizationSubscription(organizationId);
  let subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true }
  });
  if (!subscription) return null;

  const trialExpired = subscription.plan.code === "TRIAL"
    && Boolean(subscription.trialEndsAt)
    && subscription.trialEndsAt!.getTime() <= now.getTime();

  if (trialExpired && subscription.status !== "PAUSED") {
    subscription = await db.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscription!.id },
        data: { status: "PAUSED" }
      });
      await tx.platformAuditLog.create({
        data: {
          organizationId,
          actorEmail: "system@aifrogi.com",
          actorRole: "SYSTEM",
          action: "TRIAL_AUTOMATICALLY_PAUSED",
          targetType: "Subscription",
          targetId: subscription!.id,
          summary: `${TRIAL_DAYS}-day trial ended; paid actions paused while customer data remains available.`
        }
      });
      return { ...updated, plan: subscription!.plan };
    });
  }

  const paused = ["PAUSED", "SUSPENDED", "CANCELLED"].includes(subscription.status);
  const daysLeft = subscription.plan.code === "TRIAL" && subscription.trialEndsAt
    ? Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - now.getTime()) / DAY_MS))
    : null;

  return {
    planCode: subscription.plan.code,
    planName: subscription.plan.name,
    status: subscription.status,
    trialEndsAt: subscription.trialEndsAt,
    daysLeft,
    paused,
    canUsePaidActions: !paused,
    message: paused
      ? `Your ${TRIAL_DAYS}-day trial has ended. Customer data is preserved, but messaging, campaigns, and automation are paused until a paid plan is activated.`
      : subscription.plan.code === "TRIAL"
        ? `${daysLeft ?? 0} day${daysLeft === 1 ? "" : "s"} remain in your ${TRIAL_DAYS}-day trial.`
        : `${subscription.plan.name} is active.`
  };
}
