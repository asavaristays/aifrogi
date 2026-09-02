import { getDb } from "@/lib/db";
import { getBillingCommandCenter, usagePercent } from "@/lib/billing-super-admin";

export async function getMessageMatrix() {
  const db = getDb();
  if (!db) return [];
  const { customers } = await getBillingCommandCenter();
  return Promise.all(customers.map(async ({ organization, subscription, usage, limits }) => {
    const period = subscription ? { gte: subscription.currentPeriodStart, ...(subscription.currentPeriodEnd ? { lt: subscription.currentPeriodEnd } : {}) } : undefined;
    const evidenceWhere = { property: { organizationId: organization.id }, ...(period ? { createdAt: period } : {}) };
    const [decisions, safe, escalated, helpful, negative] = await Promise.all([
      db.sovereignAnswerEvidence.count({ where: evidenceWhere }),
      db.sovereignAnswerEvidence.count({ where: { ...evidenceWhere, safeResolution: true } }),
      db.sovereignAnswerEvidence.count({ where: { ...evidenceWhere, escalationTier: { not: "TIER_0_SELF_RESOLVE" } } }),
      db.sovereignAnswerFeedback.count({ where: { property: { organizationId: organization.id }, helpful: true, ...(period ? { createdAt: period } : {}) } }),
      db.sovereignAnswerFeedback.count({ where: { property: { organizationId: organization.id }, helpful: false, ...(period ? { createdAt: period } : {}) } })
    ]);
    const messageLimit = subscription?.messageLimitOverride ?? limits.messages;
    const aiReplyLimit = subscription?.aiReplyLimitOverride ?? limits.aiReplies;
    const extraMessages = Math.max(0, usage.messages - messageLimit);
    const extraAiReplies = Math.max(0, usage.aiReplies - aiReplyLimit);
    const projectedOveragePaisa = subscription?.overageApproved ? extraMessages * (subscription.messageOveragePaisa || 0) + extraAiReplies * (subscription.aiReplyOveragePaisa || 0) : 0;
    const feedback = helpful + negative;
    return { organization, subscription, usage, messageLimit, aiReplyLimit, messagePercent: usagePercent(usage.messages, messageLimit), aiReplyPercent: usagePercent(usage.aiReplies, aiReplyLimit), decisions, safeResolutionRate: decisions ? Math.round((safe / decisions) * 100) : null, helpfulRate: feedback ? Math.round((helpful / feedback) * 100) : null, negative, escalated, projectedOveragePaisa, restriction: subscription?.overageApproved ? "APPROVED_OVERAGE" : usage.messages >= messageLimit || usage.aiReplies >= aiReplyLimit ? "HARD_STOP" : "WITHIN_LIMIT" };
  }));
}

export async function updateMessageMatrixPolicy(input: { organizationId: string; messageLimitOverride: number | null; aiReplyLimitOverride: number | null; messageOveragePaisa: number; aiReplyOveragePaisa: number; overageApproved: boolean; actorEmail: string }) {
  const db = getDb();
  if (!db) return null;
  const values = [input.messageLimitOverride, input.aiReplyLimitOverride, input.messageOveragePaisa, input.aiReplyOveragePaisa].filter((value): value is number => value !== null);
  if (values.some((value) => !Number.isInteger(value) || value < 0)) throw new Error("Limits and overage rates must be non-negative whole numbers.");
  return db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({ where: { organizationId: input.organizationId }, data: { messageLimitOverride: input.messageLimitOverride, aiReplyLimitOverride: input.aiReplyLimitOverride, messageOveragePaisa: input.messageOveragePaisa, aiReplyOveragePaisa: input.aiReplyOveragePaisa, overageApproved: input.overageApproved } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "SUPER_ADMIN", action: "MESSAGE_MATRIX_POLICY_UPDATED", targetType: "Subscription", targetId: subscription.id, summary: input.overageApproved ? "Customer-approved message overage enabled" : "Hard usage stop configured", metadata: { messageLimitOverride: input.messageLimitOverride, aiReplyLimitOverride: input.aiReplyLimitOverride, messageOveragePaisa: input.messageOveragePaisa, aiReplyOveragePaisa: input.aiReplyOveragePaisa, overageApproved: input.overageApproved } } });
    return subscription;
  });
}
