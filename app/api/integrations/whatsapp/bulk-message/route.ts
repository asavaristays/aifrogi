import { NextResponse } from "next/server";
import { sendWhatsAppTemplateMessage, sendWhatsAppTestMessage } from "@/lib/services/whatsapp-service";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import {
  buildAudienceSnapshot,
  estimateTemplateCostPaisa,
  validateCampaignTemplate,
  validateConsent
} from "@/lib/campaign-compliance";
import {
  createCampaignRun,
  finalizeCampaignRun,
  recordCampaignRecipientResult,
  suppressCampaignRecipient
} from "@/lib/repositories/campaign-repository";
import { AUTOMATION_ACTION_TYPE, enqueueAutomationJob } from "@/lib/automation-engine";
import { checkOrganizationEntitlement } from "@/lib/billing-super-admin";
import { getDb } from "@/lib/db";

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
  const scheduledFor = typeof payload?.scheduledFor === "string" && payload.scheduledFor
    ? new Date(payload.scheduledFor)
    : null;
  const scheduleRequested = Boolean(scheduledFor && !Number.isNaN(scheduledFor.getTime()) && scheduledFor.getTime() > Date.now() + 60_000);
  const workspace = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload?.propertySlug === "string" ? payload.propertySlug : null,
    requireManage: true,
    requireActiveSubscription: true
  });
  const operatorId = typeof payload?.operatorId === "string" ? payload.operatorId.trim() : "lead-os-bulk-operator";
  const isTemplateMode = mode === "template";

  if (!workspace.ok) {
    return NextResponse.json({ error: workspace.error }, { status: workspace.status });
  }

  const [campaignAllowance, messageAllowance] = await Promise.all([
    checkOrganizationEntitlement(workspace.organization.id, "campaigns", 1),
    checkOrganizationEntitlement(workspace.organization.id, "messages", recipients.length)
  ]);
  if (!campaignAllowance.allowed || !messageAllowance.allowed) {
    return NextResponse.json({ error: campaignAllowance.error || messageAllowance.error }, { status: 402 });
  }
  if (!testMode) {
    const localHour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: workspace.organization.timezone || "Asia/Kolkata" }).format(new Date()));
    if (!scheduleRequested && (localHour < 9 || localHour >= 20)) {
      return NextResponse.json({ error: "Campaign quiet hours are active. Schedule the campaign between 09:00 and 20:00 in the workspace time zone." }, { status: 400 });
    }
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

  const consentRequired = isTemplateMode || recipients.length > 1;
  const consentValidation = consentRequired
    ? validateConsent({ confirmed: consentConfirmed, source: consentSource, proof: consentProof }, recipients.length)
    : { error: null };
  if (consentValidation.error) {
    return NextResponse.json({ error: consentValidation.error }, { status: 400 });
  }

  const template = templateValidation.template;
  const category = template?.category || metaChargeCategory;
  const estimatedCostPaisa = isTemplateMode
    ? estimateTemplateCostPaisa(category as "MARKETING" | "UTILITY" | "AUTHENTICATION", recipients.length)
    : 0;

  const campaign = await createCampaignRun({
    propertyId: workspace.propertyId,
    name: campaignName,
    templateName: isTemplateMode ? templateName : undefined,
    languageCode: template?.languageCode || languageCode,
    messageType: isTemplateMode ? "TEMPLATE" : "SESSION_TEXT",
    metaChargeCategory: isTemplateMode ? category : undefined,
    estimatedCostPaisa,
    requestedCount: recipients.length,
    templateStatus: template?.status || "UNKNOWN",
    consentSource: consentRequired ? consentSource : undefined,
    consentProof: consentRequired ? consentProof : undefined,
    consentConfirmedBy: consentRequired ? workspace.user.username : undefined,
    audienceSnapshot: isTemplateMode ? buildAudienceSnapshot({ requestedCount: recipients.length, recipients, source: consentSource, templateName, testMode, bodyVariables, headerImageUrl }) : undefined,
    testMode,
    createdBy: workspace.user.username,
    recipients,
    scheduledFor: scheduleRequested ? scheduledFor : null,
    initialStatus: scheduleRequested ? "SCHEDULED" : "SENDING"
  });

  if (campaign && scheduleRequested && scheduledFor) {
    await enqueueAutomationJob({
      propertyId: workspace.propertyId,
      workflowId: "scheduled_whatsapp_campaign",
      triggerType: "campaign_schedule",
      triggerRef: campaign.id,
      actionType: AUTOMATION_ACTION_TYPE.WHATSAPP_TEMPLATE_CAMPAIGN,
      idempotencyKey: `campaign:${campaign.id}`,
      scheduledFor,
      payload: { campaignId: campaign.id },
      createdBy: workspace.user.username
    });
    return NextResponse.json({
      summary: { requested: recipients.length, sent: 0, failed: 0, mode: "template", templateName, testMode, scheduled: true },
      campaignId: campaign.id,
      scheduledFor: scheduledFor.toISOString(),
      results: []
    });
  }

  const results = [];

  for (const to of recipients) {
    const db = getDb();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [optedOutLead, recentSend] = db ? await Promise.all([
      db.lead.findFirst({ where: { propertyId: workspace.propertyId, phone: to, tags: { some: { value: { in: ["STOP", "OPTED_OUT", "DO_NOT_CONTACT"], mode: "insensitive" } } } }, select: { id: true } }),
      db.campaignRecipient.findFirst({ where: { phone: to, campaign: { propertyId: workspace.propertyId }, sentAt: { gte: oneDayAgo }, campaignId: { not: campaign?.id || "" } }, select: { id: true } })
    ]) : [null, null];
    if (!testMode && (optedOutLead || recentSend)) {
      const error = optedOutLead ? "Recipient opted out." : "24-hour frequency cap applied.";
      results.push({ to, ok: false, status: 409, error, deliveryStatus: "SUPPRESSED", externalMessageId: null, mode: isTemplateMode ? "template" : "text" });
      if (campaign) await suppressCampaignRecipient({ campaignId: campaign.id, phone: to, reason: error });
      continue;
    }
    const result = isTemplateMode
      ? await sendWhatsAppTemplateMessage({
          to,
          templateName,
          languageCode: template?.languageCode || languageCode,
          propertySlug: workspace.propertySlug,
          bodyVariables,
          headerImageUrl: headerImageUrl || template?.defaultHeaderImageUrl || ""
        })
      : await sendWhatsAppTestMessage({
          to,
          message,
          propertySlug: workspace.propertySlug,
          propertyId: workspace.propertyId,
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
