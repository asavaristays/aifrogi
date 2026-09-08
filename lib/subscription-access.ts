import { getDb } from "@/lib/db";
import { ensureOrganizationSubscription } from "@/lib/billing-super-admin";
import { TRIAL_DAYS } from "@/lib/trial-policy";
import { reconcileSubscriptionLifecycleForOrganization, SUSPENDED_DATA_RETENTION_DAYS } from "@/lib/subscription-lifecycle";

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

  // Isolated synthetic demos have no paid entitlement or trial expiry. This
  // applies only to server-marked demo workspaces with mock-only connectors.
  const demo = await db.organization.findUnique({where:{id:organizationId},select:{isDemo:true,demoSandbox:{select:{status:true}},botConnectors:{select:{provider:true}}}});
  if (demo?.isDemo && demo.demoSandbox?.status === 'READY' && demo.botConnectors.length > 0 && demo.botConnectors.every(c=>c.provider === 'AIFROGI_DEMO_MOCK')) {
    return {planCode:'DEMO',planName:'Synthetic demo',status:'ACTIVE',trialEndsAt:null,daysLeft:null,paused:false,canUsePaidActions:true,message:'Synthetic demonstration only; no real transactions.'};
  }

  await ensureOrganizationSubscription(organizationId);
  let subscription = await db.subscription.findUnique({
    where: { organizationId },
    include: { plan: true }
  });
  if (!subscription) return null;

  await reconcileSubscriptionLifecycleForOrganization(organizationId, now, false);
  subscription = await db.subscription.findUnique({ where: { organizationId }, include: { plan: true } });
  if (!subscription) return null;

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
      ? `Your AI Bot is suspended. Customer data is preserved for ${SUSPENDED_DATA_RETENTION_DAYS} days, but AI replies and automation remain paused until payment is verified.`
      : subscription.status === "GRACE"
        ? "Your plan is in a 3-day payment grace period. Service remains available temporarily; complete payment to avoid suspension."
      : subscription.plan.code === "TRIAL"
        ? `${daysLeft ?? 0} day${daysLeft === 1 ? "" : "s"} remain in your ${TRIAL_DAYS}-day trial.`
        : `${subscription.plan.name} is active.`
  };
}
