export type CampaignTemplateStatus = "APPROVED" | "PENDING" | "REJECTED" | "DRAFT";
export type CampaignTemplateCategory = "MARKETING" | "UTILITY" | "AUTHENTICATION";
export type CampaignTemplateHeaderType = "NONE" | "IMAGE" | "TEXT";

export type CampaignTemplate = {
  name: string;
  label: string;
  category: CampaignTemplateCategory;
  languageCode: string;
  status: CampaignTemplateStatus;
  headerType: CampaignTemplateHeaderType;
  bodyPreview: string;
  buttonLabels: string[];
  variableHints: string[];
  defaultHeaderImageUrl?: string;
  purpose: string;
};

export type ConsentInput = {
  confirmed?: boolean;
  source?: string;
  proof?: string;
};

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  {
    name: "goa_ai_audit_image_v2",
    label: "Goa AI audit image offer",
    category: "MARKETING",
    languageCode: "en_US",
    status: "APPROVED",
    headerType: "IMAGE",
    defaultHeaderImageUrl: "https://lead.hotelradar.in/media/campaigns/goa-ai-audit-v2.jpg",
    purpose: "Free AI audit campaign for Goa hotels and villas.",
    bodyPreview: "Hi, this is HotelRADAR AI. We are offering a free AI Audit for Goa hotels and villas. Reply AUDIT or TRIAL to continue, or STOP to opt out.",
    buttonLabels: ["AUDIT", "TRIAL", "STOP"],
    variableHints: []
  },
  {
    name: "goa_ai_audit_trial_v1",
    label: "Goa AI audit and trial",
    category: "MARKETING",
    languageCode: "en_US",
    status: "APPROVED",
    headerType: "NONE",
    purpose: "Text opener for AI audit and 15-day working trial.",
    bodyPreview: "Hi, this is HotelRADAR AI. We can review your hotel website, WhatsApp lead flow, and booking gaps. Reply AUDIT for a free AI audit or TRIAL for the 15-day working trial.",
    buttonLabels: ["AUDIT", "TRIAL", "STOP"],
    variableHints: []
  },
  {
    name: "trial_intake_followup_v1",
    label: "Trial intake follow-up",
    category: "MARKETING",
    languageCode: "en_US",
    status: "APPROVED",
    headerType: "NONE",
    purpose: "Follow up with prospects who asked about the working trial.",
    bodyPreview: "Thank you for your interest in the 15-day working trial. Please share your business name, website, WhatsApp number, and the workflow you want to improve first.",
    buttonLabels: ["Share details", "Talk to team", "STOP"],
    variableHints: []
  },
  {
    name: "audit_request_followup_v1",
    label: "Audit details request",
    category: "MARKETING",
    languageCode: "en_US",
    status: "PENDING",
    headerType: "NONE",
    purpose: "Ask for website or Google Business Profile link after an audit request.",
    bodyPreview: "Please share your website or Google Business Profile link so our team can prepare your AI audit.",
    buttonLabels: ["Share website", "Talk to team"],
    variableHints: []
  }
];

export const CONSENT_SOURCES = [
  { value: "internal_test", label: "Internal test number" },
  { value: "website_form", label: "Website form opt-in" },
  { value: "whatsapp_inbound", label: "Inbound WhatsApp request" },
  { value: "existing_customer", label: "Existing customer relationship" },
  { value: "manual_import", label: "Manual import with proof" }
];

export function getCampaignTemplate(name: string) {
  const normalized = name.trim().toLowerCase();
  return CAMPAIGN_TEMPLATES.find((template) => template.name.toLowerCase() === normalized) || null;
}

export function listApprovedCampaignTemplates() {
  return CAMPAIGN_TEMPLATES.filter((template) => template.status === "APPROVED");
}

export function validateCampaignTemplate(name: string) {
  const template = getCampaignTemplate(name);
  if (!template) {
    return { template: null, error: "Select an approved template from the AiFrogi catalogue." };
  }

  if (template.status !== "APPROVED") {
    return { template, error: `${template.name} is ${template.status.toLowerCase()} and cannot be sent yet.` };
  }

  return { template, error: null };
}

export function validateConsent(input: ConsentInput, recipientCount: number) {
  const source = String(input.source || "").trim();
  const proof = String(input.proof || "").trim();
  if (!input.confirmed) return { error: "Confirm consent before sending any campaign." };
  if (!source) return { error: "Select the consent source for this audience." };
  if (!CONSENT_SOURCES.some((item) => item.value === source)) return { error: "Select a valid consent source." };
  if (proof.length < 8) return { error: "Add a short consent proof or note for the audit trail." };
  if (recipientCount > 1 && source === "internal_test") return { error: "Internal test consent can only be used for one recipient." };
  return { error: null };
}

export function estimateTemplateCostPaisa(category: CampaignTemplateCategory, recipientCount: number) {
  const unit = category === "MARKETING" ? 109 : category === "UTILITY" ? 15 : 12;
  return recipientCount * unit;
}

export function buildAudienceSnapshot(input: {
  requestedCount: number;
  recipients: string[];
  source: string;
  templateName: string;
  testMode: boolean;
  bodyVariables?: string[];
  headerImageUrl?: string;
}) {
  return JSON.stringify({
    requestedCount: input.requestedCount,
    uniqueRecipients: input.recipients.length,
    source: input.source,
    templateName: input.templateName,
    testMode: input.testMode,
    bodyVariables: input.bodyVariables || [],
    headerImageUrl: input.headerImageUrl || "",
    capturedAt: new Date().toISOString()
  });
}
