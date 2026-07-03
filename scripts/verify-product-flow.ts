import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, { calculateProductFlow, loadOrganizationProductFlow }, { updateOrganizationFlowStatus }, billing] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/product-flow"),
    import("@/lib/repositories/onboarding-repository"),
    import("@/lib/billing-super-admin")
  ]);
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const blocked = calculateProductFlow({
    organizationActive: true,
    businessProfileComplete: true,
    kycStatus: "APPROVED",
    phoneVerificationStatus: "VERIFIED",
    facebookStatus: "CONNECTED",
    metaStatus: "LIVE",
    integrationStatus: "CONNECTED",
    webhookStatus: "CONNECTED",
    tokenStatus: "ACTIVE",
    metaBillingStatus: "BLOCKED",
    templateStatus: "REJECTED",
    firstMessageStatus: "FAILED",
    approvedKnowledgeCount: 0,
    liveCampaignCount: 0,
    completedAutomationCount: 0,
    deadAutomationCount: 1,
    subscriptionStatus: "ACTIVE",
    overdueInvoiceCount: 0
  });
  assert(blocked.stages.some((stage) => stage.status === "blocked"), "Blocked operating stages were not marked.");

  const runId = Date.now();
  const slug = `flow-qa-${runId}`;
  let organizationId = "";

  try {
    const organization = await db.organization.create({
      data: {
        name: `Flow QA ${runId}`,
        slug,
        website: "https://example.aifrogi.local",
        businessAddress: "Flow QA Street, Goa",
        ownerName: "Flow QA",
        ownerEmail: `flow-${runId}@aifrogi.local`,
        ownerMobile: "+918800000000",
        status: "ACTIVE",
        properties: {
          create: {
            name: `Flow QA ${runId}`,
            slug,
            whatsappIntegration: { create: { status: "CONNECTED", displayPhoneNumber: "+91 88000 00000" } }
          }
        },
        onboarding: {
          create: {
            lifecycleStatus: "META_REVIEW",
            kycStatus: "APPROVED",
            phoneVerificationStatus: "VERIFIED",
            facebookStatus: "CONNECTED",
            metaStatus: "LIVE",
            webhookStatus: "CONNECTED",
            tokenStatus: "ACTIVE",
            metaBillingStatus: "NOT_CONFIRMED",
            templateStatus: "NOT_STARTED",
            firstMessageStatus: "NOT_STARTED"
          }
        }
      },
      include: { properties: true }
    });
    organizationId = organization.id;
    const propertyId = organization.properties[0]?.id;
    assert(propertyId, "Synthetic property was not created.");

    await billing.ensureOrganizationSubscription(organizationId);
    await Promise.all([
      db.knowledgeEntry.create({
        data: {
          propertyId,
          question: "What does AiFrogi provide?",
          answer: "AiFrogi provides WhatsApp automation, campaigns, and governed replies.",
          status: "APPROVED",
          createdBy: "flow-qa@aifrogi.local",
          approvedBy: "flow-qa@aifrogi.local",
          approvedAt: new Date()
        }
      }),
      db.campaign.create({
        data: {
          propertyId,
          name: "Synthetic first campaign",
          status: "COMPLETED",
          testMode: false,
          sentCount: 1,
          deliveredCount: 1,
          readCount: 1,
          createdBy: "flow-qa@aifrogi.local"
        }
      }),
      db.automationJob.create({
        data: {
          propertyId,
          workflowId: `flow-qa-${runId}`,
          triggerType: "MANUAL",
          actionType: "SEND_REPLY",
          status: "COMPLETED",
          payload: {},
          result: { ok: true },
          idempotencyKey: `flow-qa-${runId}`,
          completedAt: new Date(),
          createdBy: "flow-qa@aifrogi.local"
        }
      })
    ]);

    const preProof = await loadOrganizationProductFlow(organizationId);
    assert(preProof?.nextAction?.id === "first_message", "First message should be the next action before proof statuses are updated.");

    await updateOrganizationFlowStatus({
      organizationId,
      actorEmail: "flow-qa@aifrogi.local",
      metaBillingStatus: "CONFIRMED",
      templateStatus: "APPROVED",
      firstMessageStatus: "PASSED",
      note: "Synthetic flow proof completed."
    });

    const flow = await loadOrganizationProductFlow(organizationId);
    assert(flow?.phase === "GROW", "Operating flow did not reach grow phase.");
    assert(flow.progressPercent === 100, "Operating flow did not reach 100 percent.");
    assert(flow.stages.every((stage) => stage.status === "complete"), "All operating stages should be complete.");

    const auditCount = await db.platformAuditLog.count({ where: { organizationId, action: "FLOW_STATUS_UPDATED" } });
    assert(auditCount === 1, "Flow status update was not recorded in the audit trail.");

    console.log("Product operating flow verification passed.");
  } finally {
    if (organizationId) {
      await db.platformAuditLog.deleteMany({ where: { organizationId } });
      await db.organization.deleteMany({ where: { id: organizationId } });
    }
    const residue = await db.organization.count({ where: { slug } });
    assert(residue === 0, "Synthetic flow organization was not removed.");
    console.log("Synthetic flow organization removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
