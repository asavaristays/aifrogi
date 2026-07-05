import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, billing, subscriptionAccess] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/billing-super-admin"),
    import("@/lib/subscription-access")
  ]);
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const runId = Date.now();
  const slug = `billing-qa-${runId}`;
  let organizationId = "";

  try {
    const plans = await billing.ensureBillingPlans();
    assert(plans.length === 5, "Billing plan catalogue was not synchronized.");
    assert(plans.some((plan) => plan.code === "GROWTH" && plan.amountPaisa > 0), "Growth plan pricing was not stored.");

    const organization = await db.organization.create({
      data: {
        name: `Billing QA ${runId}`,
        slug,
        ownerName: "Billing QA",
        ownerEmail: `billing-${runId}@aifrogi.local`,
        properties: { create: { name: `Billing QA ${runId}`, slug } },
        onboarding: { create: { metaStatus: "LIVE", webhookStatus: "CONNECTED", tokenStatus: "ACTIVE" } }
      }
    });
    organizationId = organization.id;

    const trial = await billing.ensureOrganizationSubscription(organizationId);
    assert(trial?.plan.code === "TRIAL" && trial.status === "TRIALING", "Trial subscription was not created.");
    await db.subscription.update({ where: { organizationId }, data: { trialEndsAt: new Date(Date.now() - 1000) } });
    const expired = await subscriptionAccess.getOrganizationSubscriptionAccess(organizationId);
    assert(expired?.paused && !expired.canUsePaidActions && expired.status === "PAUSED", "Expired trial did not pause automatically.");
    const pauseAudit = await db.platformAuditLog.count({ where: { organizationId, action: "TRIAL_AUTOMATICALLY_PAUSED" } });
    assert(pauseAudit === 1, "Automatic trial pause was not audited exactly once.");

    await billing.updateOrganizationPlan({
      organizationId,
      planCode: "GROWTH",
      actorEmail: "billing-qa@aifrogi.local"
    });
    const growth = await db.subscription.findUnique({ where: { organizationId }, include: { plan: true } });
    assert(growth?.plan.code === "GROWTH" && growth.status === "ACTIVE", "Plan change was not persisted.");

    const invoice = await billing.createManualInvoice({
      organizationId,
      actorEmail: "billing-qa@aifrogi.local",
      platformFeePaisa: 1065000,
      taxPaisa: 191700,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes: "Synthetic Section 06 verification invoice."
    });
    assert(invoice?.status === "ISSUED" && invoice.totalPaisa === 1256700, "Manual invoice totals were not calculated.");

    const paid = await billing.markInvoicePaid({
      organizationId,
      invoiceId: invoice!.id,
      actorEmail: "billing-qa@aifrogi.local",
      paymentReference: `QA-${runId}`
    });
    assert(paid?.status === "PAID" && Boolean(paid.paidAt), "Invoice payment was not recorded.");

    const incident = await billing.createPlatformIncident({
      organizationId,
      actorEmail: "billing-qa@aifrogi.local",
      severity: "HIGH",
      category: "MESSAGING",
      title: "Synthetic delivery incident",
      description: "Verification-only incident."
    });
    assert(incident?.status === "OPEN", "Incident was not opened.");
    const resolved = await billing.resolvePlatformIncident({
      organizationId,
      incidentId: incident!.id,
      actorEmail: "billing-qa@aifrogi.local",
      resolution: "Verification completed."
    });
    assert(resolved?.status === "RESOLVED" && Boolean(resolved.resolvedAt), "Incident was not resolved.");

    const detail = await billing.getCustomerBillingDetail(organizationId);
    assert(detail?.subscription.plan.code === "GROWTH", "Billing detail did not return the active plan.");
    assert(detail.organization.auditLogs.length >= 6, "Audit trail did not record billing operations and trial pause.");

    const health = billing.calculateCustomerHealth({
      metaStatus: "LIVE",
      webhookStatus: "CONNECTED",
      openTickets: 0,
      openIncidents: 0,
      pastDueInvoices: 0,
      failedMessages: 0,
      deadJobs: 0,
      usage: { contacts: 0, messages: 0, campaigns: 0, aiReplies: 0, teamUsers: 0 },
      limits: detail.limits
    });
    assert(health.status === "HEALTHY" && health.score === 100, "Healthy customer score was not calculated.");

    console.log("Billing and Super Admin verification passed.");
  } finally {
    if (organizationId) {
      await db.platformAuditLog.deleteMany({ where: { organizationId } });
      await db.platformIncident.deleteMany({ where: { organizationId } });
      await db.organization.deleteMany({ where: { id: organizationId } });
    }
    const residue = await db.organization.count({ where: { slug } });
    assert(residue === 0, "Synthetic billing organization was not removed.");
    console.log("Synthetic billing organization removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
