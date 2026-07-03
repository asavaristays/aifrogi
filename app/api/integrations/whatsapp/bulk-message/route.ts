import { NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage, sendWhatsAppTestMessage } from "@/lib/services/whatsapp-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getCurrentUser } from "@/lib/auth-server";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import {
  buildAudienceSnapshot,
  estimateTemplateCostPaisa,
  validateCampaignTemplate,
  validateConsent
} from "@/lib/campaign-compliance";
import {
  createCampaignRun,
  finalizeCampaignRun,
  recordCampaignRecipientResult
} from "@/lib/repositories/campaign-repository";

const MAX_BULK_RECIPIENTS = 20;

function normalizeRecipient(value: string) {
  const digits = String(value || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

function parseRecipients(value: unknown) {
  const rawValues = Array.isArray(value)
    ? value.map((item) => String(item || ""))
    : String(value || "").split(/[\n,;\t ]+/);

  const recipients = rawValues
    .map((item) => normalizeRecipient(item))
    .filter(Boolean);

  return Array.from(new Set(recipients));
}

function parseVariables(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const recipients = parseRecipients(payload?.recipients ?? payload?.numbers ?? "");
  const mode = typeof payload?.mode === "string" ? payload.mode.trim().toLowerCase() : "text";
  const message = typeof payload?.message === "string" ? payload.message.trim() : "";
  const templateName = typeof payload?.templateName === "string" ? payload.templateName.trim() : "";
  const languageCode = typeof payload?.languageCode === "string" && payload.languageCode.trim()
    ? payload.languageCode.trim()
    : "en_US";
  const bodyVariables = parseVariables(payload?.bodyVariables);
  const headerImageUrl = typeof payload?.headerImageUrl === "string" ? payload.headerImageUrl.trim() : "";
  const campaignName = typeof payload?.campaignName === "string" && payload.campaignName.trim()
    ? payload.campaignName.trim()
    : templateName || "WhatsApp broadcast";
  const metaChargeCategory = typeof payload?.metaChargeCategory === "string"
    ? payload.metaChargeCategory.trim().toUpperCase()
    : "MARKETING";
  const consentConfirmed = Boolean(payload?.consentConfirmed ?? payload?.hasConsent);
  const consentSource = typeof payload?.consentSource === "string" ? payload.consentSource.trim() : "";
  const consentProof = typeof payload?.consentProof === "string" ? payload.consentProof.trim() : "";
  const testMode = Boolean(payload?.testMode);
  const selectedWorkspaceSlug = await getCurrentWorkspaceSlug();
  const propertySlug = typeof payload?.propertySlug === "string" && payload.propertySlug.trim()
    ? payload.propertySlug.trim()
    : selectedWorkspaceSlug;
  const propertyId = typeof payload?.propertyId === "string" ? payload.propertyId.trim() : "";
  const operatorId = typeof payload?.operatorId === "string" ? payload.operatorId.trim() : "lead-os-bulk-operator";
  const isTemplateMode = mode === "template";
  const [user, property] = await Promise.all([getCurrentUser(), getPropertyBySlug(propertySlug)]);

  if (!user) {
    return NextResponse.json({ error: "Sign in before sending a campaign." }, { status: 401 });
  }

  if (!isTemplateMode && !message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  if (isTemplateMode && !templateName) {
    return NextResponse.json({ error: "Approved WhatsApp template name is required" }, { status: 400 });
  }

  const templateValidation = isTemplateMode ? validateCampaignTemplate(templateName) : { template: null, error: null };
  if (templateValidation.error) {
    return NextResponse.json({ error: templateValidation.error }, { status: 400 });
  }

  if (!recipients.length) {
    return NextResponse.json({ error: "At least one valid WhatsApp number is required" }, { status: 400 });
  }

  if (recipients.length > MAX_BULK_RECIPIENTS) {
    return NextResponse.json(
      { error: `Bulk send is limited to ${MAX_BULK_RECIPIENTS} numbers at a time` },
      { status: 400 }
    );
  }

  const consentValidation = isTemplateMode
    ? validateConsent({ confirmed: consentConfirmed, source: consentSource, proof: consentProof }, recipients.length)
    : { error: null };
  if (consentValidation.error) {
    return NextResponse.json({ error: consentValidation.error }, { status: 400 });
  }

  if (!property) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const template = templateValidation.template;
  const category = template?.category || metaChargeCategory;
  const estimatedCostPaisa = isTemplateMode
    ? estimateTemplateCostPaisa(category as "MARKETING" | "UTILITY" | "AUTHENTICATION", recipients.length)
    : 0;

  const campaign = await createCampaignRun({
    propertyId: property.id,
    name: campaignName,
    templateName: isTemplateMode ? templateName : undefined,
    languageCode: template?.languageCode || languageCode,
    messageType: isTemplateMode ? "TEMPLATE" : "SESSION_TEXT",
    metaChargeCategory: isTemplateMode ? category : undefined,
    estimatedCostPaisa,
    requestedCount: recipients.length,
    templateStatus: template?.status || "UNKNOWN",
    consentSource: isTemplateMode ? consentSource : undefined,
    consentProof: isTemplateMode ? consentProof : undefined,
    consentConfirmedBy: isTemplateMode ? user?.username : undefined,
    audienceSnapshot: isTemplateMode ? buildAudienceSnapshot({ requestedCount: recipients.length, recipients, source: consentSource, templateName, testMode }) : undefined,
    testMode,
    createdBy: user?.username,
    recipients
  });

  const results = [];

  for (const to of recipients) {
    const result = isTemplateMode
      ? await sendWhatsAppTemplateMessage({
          to,
          templateName,
          languageCode: template?.languageCode || languageCode,
          propertySlug,
          bodyVariables,
          headerImageUrl: headerImageUrl || template?.defaultHeaderImageUrl || ""
        })
      : await sendWhatsAppTestMessage({
          to,
          message,
          propertySlug,
          propertyId,
          operatorId
        });

    results.push({
      to,
      ok: !result.error,
      status: result.status,
      error: result.error ?? null,
      deliveryStatus: result.result?.status ?? null,
      externalMessageId: result.result?.sid ?? null,
      mode: isTemplateMode ? "template" : "text"
    });

    if (campaign) {
      await recordCampaignRecipientResult({
        campaignId: campaign.id,
        phone: to,
        ok: !result.error,
        externalMessageId: result.result?.sid ?? null,
        error: result.error ?? null
      });
    }
  }

  const sent = results.filter((item) => item.ok).length;
  const failed = results.length - sent;
  if (campaign) {
    const errors = Array.from(new Set(results.map((item) => item.error).filter(Boolean)));
    await finalizeCampaignRun({
      campaignId: campaign.id,
      sentCount: sent,
      failedCount: failed,
      errorSummary: errors.join(" | ").slice(0, 1000) || null
    });
  }

  return NextResponse.json({
    summary: {
      requested: recipients.length,
      sent,
      failed,
      mode: isTemplateMode ? "template" : "text",
      templateName: isTemplateMode ? templateName : null,
      testMode
    },
    campaignId: campaign?.id ?? null,
    results
  });
}
