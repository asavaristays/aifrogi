import { getDb } from "@/lib/db";
import { findAiCreditPack, type AiCreditPackCode } from "@/lib/ai-credit-catalog";

export function aiReplyAllowancePosition(input: { included: number; added: number; used: number }) {
  const included = Math.max(0, input.included);
  const added = Math.max(0, input.added);
  const used = Math.max(0, input.used);
  const total = included + added;
  const remaining = Math.max(0, total - used);
  return {
    included,
    added,
    used,
    total,
    remaining,
    percent: total ? Math.min(100, Math.round((used / total) * 100)) : 0,
    available: total === 0 || remaining > 0
  };
}

export async function getActiveAiCreditTotal(organizationId: string, now = new Date()) {
  const db = getDb();
  if (!db) return 0;
  const result = await db.aiCreditTransaction.aggregate({
    where: { organizationId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
    _sum: { credits: true }
  });
  return Math.max(0, result._sum.credits || 0);
}

export async function getAiCreditSummary(input: { organizationId: string; includedCredits: number; usedAiReplies: number; now?: Date }) {
  const db = getDb();
  if (!db) return { granted: 0, purchased: 0, promotional: 0, used: 0, remaining: 0, purchasedRemaining: 0, promotionalRemaining: 0 };
  const now = input.now || new Date();
  const active = { organizationId: input.organizationId, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
  const [purchasedResult, promotionalResult] = await Promise.all([
    db.aiCreditTransaction.aggregate({ where: { ...active, kind: "PURCHASE" }, _sum: { credits: true } }),
    db.aiCreditTransaction.aggregate({ where: { ...active, kind: "FREE_GRANT" }, _sum: { credits: true } })
  ]);
  const purchased = Math.max(0, purchasedResult._sum.credits || 0);
  const promotional = Math.max(0, promotionalResult._sum.credits || 0);
  const granted = purchased + promotional;
  const usedFromCredits = Math.max(0, input.usedAiReplies - input.includedCredits);
  const promotionalUsed = Math.min(promotional, usedFromCredits);
  const purchasedUsed = Math.min(purchased, Math.max(0, usedFromCredits - promotionalUsed));
  return { granted, purchased, promotional, used: promotionalUsed + purchasedUsed, remaining: Math.max(0, granted - usedFromCredits), purchasedRemaining: purchased - purchasedUsed, promotionalRemaining: promotional - promotionalUsed };
}

export type FreeCreditRecommendation = { suggested: boolean; credits: number; reason: string; expiresInDays: number; signal: string };

export function recommendFreeAiCredits(input: { planCode: string; usedAiReplies: number; includedCredits: number; remainingExtraCredits: number; recentFreeGrant: boolean }): FreeCreditRecommendation {
  if (input.recentFreeGrant) return { suggested: false, credits: 0, reason: "A free-credit grant was already issued during the last 30 days.", expiresInDays: 0, signal: "COOLDOWN" };
  if (input.includedCredits <= 0) return { suggested: false, credits: 0, reason: "This account has no measured AI reply allowance.", expiresInDays: 0, signal: "NO_ALLOWANCE" };
  const usagePercent = Math.round((input.usedAiReplies / input.includedCredits) * 100);
  if (input.remainingExtraCredits > 50 || usagePercent < 80) return { suggested: false, credits: 0, reason: "Usage and available credits do not require a retention grant.", expiresInDays: 0, signal: "HEALTHY" };
  if (input.planCode === "TRIAL") return { suggested: true, credits: 100, reason: "Trial usage reached 80%; consider a one-time evaluation extension.", expiresInDays: 30, signal: "TRIAL_RETENTION" };
  if (usagePercent >= 95) return { suggested: true, credits: 250, reason: "Paid account has used at least 95% of its included AI replies.", expiresInDays: 30, signal: "PAID_CRITICAL" };
  return { suggested: true, credits: 100, reason: "Paid account has used at least 80% of its included AI replies.", expiresInDays: 30, signal: "PAID_RETENTION" };
}

export async function grantFreeAiCredits(input: { organizationId: string; credits: number; reason: string; expiresAt?: Date | null; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Billing database is unavailable.");
  if (!Number.isInteger(input.credits) || input.credits < 1 || input.credits > 100000) throw new Error("Free credits must be a whole number between 1 and 100,000.");
  const reason = input.reason.trim();
  if (reason.length < 5) throw new Error("Record a clear reason for the free-credit grant.");
  if (input.expiresAt && input.expiresAt <= new Date()) throw new Error("Credit expiry must be in the future.");
  return db.$transaction(async tx => {
    const grant = await tx.aiCreditTransaction.create({ data: { organizationId: input.organizationId, kind: "FREE_GRANT", credits: input.credits, expiresAt: input.expiresAt || null, reason, createdBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "SUPER_ADMIN", action: "AI_CREDITS_GRANTED", targetType: "AiCreditTransaction", targetId: grant.id, summary: `${input.credits.toLocaleString("en-IN")} free AI reply credits granted`, metadata: { credits: input.credits, reason, expiresAt: input.expiresAt?.toISOString() || null } } });
    return grant;
  });
}

export async function activatePaidAiCredits(input: { organizationId: string; actorEmail: string; packCode: AiCreditPackCode; orderId: string; paymentId: string; amountPaisa: number; currency: string }) {
  const db = getDb();
  if (!db) throw new Error("Billing database is unavailable.");
  const pack = findAiCreditPack(input.packCode);
  if (!pack || pack.amountPaisa !== input.amountPaisa || input.currency !== "INR") throw new Error("The verified payment does not match the selected credit pack.");
  const existing = await db.aiCreditTransaction.findUnique({ where: { paymentReference: input.paymentId } });
  if (existing) return existing;
  const subscription = await db.subscription.findUnique({ where: { organizationId: input.organizationId } });
  if (!subscription) throw new Error("Start a trial or activate a plan before purchasing extra credits.");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  return db.$transaction(async tx => {
    const credit = await tx.aiCreditTransaction.create({ data: { organizationId: input.organizationId, kind: "PURCHASE", credits: pack.credits, packCode: pack.code, amountPaisa: pack.amountPaisa, currency: input.currency, expiresAt, paymentReference: input.paymentId, reason: `Razorpay order ${input.orderId}`, createdBy: input.actorEmail } });
    const invoice = await tx.billingInvoice.create({ data: { organizationId: input.organizationId, subscriptionId: subscription.id, invoiceNumber: `AIF-CREDIT-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${input.paymentId.slice(-8).toUpperCase()}`, status: "PAID", currency: input.currency, periodStart: now, periodEnd: expiresAt, aiOveragePaisa: input.amountPaisa, totalPaisa: input.amountPaisa, paidAt: now, paymentReference: input.paymentId, notes: `${pack.credits} prepaid AI reply credits · Razorpay order ${input.orderId}`, createdBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "CLIENT_ADMIN", action: "AI_CREDITS_PURCHASED", targetType: "AiCreditTransaction", targetId: credit.id, summary: `${pack.credits.toLocaleString("en-IN")} AI reply credits purchased`, metadata: { packCode: pack.code, orderId: input.orderId, paymentId: input.paymentId, invoiceId: invoice.id, expiresAt: expiresAt.toISOString() } } });
    return credit;
  });
}
