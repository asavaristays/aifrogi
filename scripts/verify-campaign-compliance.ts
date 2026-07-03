import { loadEnvConfig } from "@next/env";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  loadEnvConfig(process.cwd());
  const [{ getDb }, compliance, repository] = await Promise.all([
    import("@/lib/db"),
    import("@/lib/campaign-compliance"),
    import("@/lib/repositories/campaign-repository")
  ]);
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required.");

  const runId = Date.now();
  const slug = `campaign-qa-${runId}`;
  let propertyId = "";

  try {
    const template = compliance.validateCampaignTemplate("goa_ai_audit_image_v2");
    assert(template.template?.status === "APPROVED" && !template.error, "Approved template was not accepted.");
    const pending = compliance.validateCampaignTemplate("audit_request_followup_v1");
    assert(Boolean(pending.error), "Pending template was not blocked.");
    const badConsent = compliance.validateConsent({ confirmed: true, source: "internal_test", proof: "Internal test number" }, 2);
    assert(Boolean(badConsent.error), "Internal test consent allowed more than one recipient.");

    const property = await db.property.create({ data: { name: `Campaign QA ${runId}`, slug } });
    propertyId = property.id;

    const campaign = await repository.createCampaignRun({
      propertyId,
      name: "Synthetic compliance run",
      templateName: "goa_ai_audit_image_v2",
      languageCode: "en_US",
      messageType: "TEMPLATE",
      metaChargeCategory: "MARKETING",
      estimatedCostPaisa: compliance.estimateTemplateCostPaisa("MARKETING", 1),
      requestedCount: 1,
      templateStatus: "APPROVED",
      consentSource: "internal_test",
      consentProof: "Internal test number owned by QA operator.",
      consentConfirmedBy: "campaign-qa@aifrogi.local",
      audienceSnapshot: compliance.buildAudienceSnapshot({ requestedCount: 1, recipients: ["+918800000000"], source: "internal_test", templateName: "goa_ai_audit_image_v2", testMode: true }),
      testMode: true,
      createdBy: "campaign-qa@aifrogi.local",
      recipients: ["+918800000000"]
    });
    assert(campaign?.consentSource === "internal_test", "Campaign consent source was not stored.");
    assert(campaign?.recipients[0]?.consentStatus === "CONFIRMED", "Recipient consent was not recorded.");
    assert(campaign.testMode, "Campaign test mode was not stored.");

    await repository.recordCampaignRecipientResult({ campaignId: campaign.id, phone: "+918800000000", ok: true, externalMessageId: `wamid.${runId}` });
    await repository.finalizeCampaignRun({ campaignId: campaign.id, sentCount: 1, failedCount: 0 });
    const summary = await repository.getCampaignSummary(propertyId);
    assert(summary.total === 1 && summary.sent === 1 && summary.estimatedCostPaisa > 0, "Campaign summary did not include the synthetic run.");
    console.log("Campaign compliance verification passed.");
  } finally {
    if (propertyId) await db.property.deleteMany({ where: { id: propertyId } });
    const residue = await db.property.count({ where: { slug } });
    assert(residue === 0, "Synthetic campaign property was not removed.");
    console.log("Synthetic campaign workspace removed.");
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
