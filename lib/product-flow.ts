import { getDb } from "@/lib/db";

export type ProductFlowOwner = "Customer" | "AiFrogi" | "Meta";
export type ProductFlowStatus = "complete" | "current" | "waiting" | "blocked";

export type ProductFlowStage = {
  id: string;
  label: string;
  description: string;
  owner: ProductFlowOwner;
  status: ProductFlowStatus;
  evidence: string;
  action: string;
  href: string;
};

export type ProductFlowInput = {
  organizationActive: boolean;
  businessProfileComplete: boolean;
  kycStatus: string;
  phoneVerificationStatus: string;
  facebookStatus: string;
  metaStatus: string;
  integrationStatus: string;
  webhookStatus: string;
  tokenStatus: string;
  metaBillingStatus: string;
  templateStatus: string;
  firstMessageStatus: string;
  approvedKnowledgeCount: number;
  liveCampaignCount: number;
  completedAutomationCount: number;
  deadAutomationCount: number;
  subscriptionStatus: string;
  overdueInvoiceCount: number;
};

export type ProductFlow = {
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  phase: "ACTIVATE" | "CONNECT" | "PROVE" | "OPERATE" | "GROW";
  headline: string;
  summary: string;
  nextAction: ProductFlowStage | null;
  stages: ProductFlowStage[];
  customerActions: ProductFlowStage[];
  platformActions: ProductFlowStage[];
  externalDependencies: ProductFlowStage[];
};

function normalized(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

function stage(input: Omit<ProductFlowStage, "status"> & { complete: boolean; blocked?: boolean }): ProductFlowStage & { complete: boolean; blocked: boolean } {
  return { ...input, status: input.complete ? "complete" : input.blocked ? "blocked" : "waiting", complete: input.complete, blocked: Boolean(input.blocked) };
}

export function calculateProductFlow(input: ProductFlowInput): ProductFlow {
  const kyc = normalized(input.kycStatus);
  const meta = normalized(input.metaStatus);
  const template = normalized(input.templateStatus);
  const firstMessage = normalized(input.firstMessageStatus);
  const billing = normalized(input.metaBillingStatus);
  const subscription = normalized(input.subscriptionStatus);

  const candidates = [
    stage({ id: "account", label: "Account and organization", description: "Private owner access and complete business identity.", owner: "Customer", complete: input.organizationActive && input.businessProfileComplete, evidence: input.organizationActive && input.businessProfileComplete ? "Owner access and company profile are ready" : "Owner access or company profile is incomplete", action: "Complete business profile", href: "/onboarding" }),
    stage({ id: "verification", label: "Business verification", description: "Business details and proof reviewed before connection.", owner: kyc === "SUBMITTED" ? "AiFrogi" : "Customer", complete: kyc === "APPROVED", blocked: kyc === "REJECTED", evidence: kyc === "APPROVED" ? "Business verification approved" : kyc === "REJECTED" ? "Business details need correction" : kyc === "SUBMITTED" ? "Submitted for AiFrogi review" : "Verification has not been submitted", action: kyc === "SUBMITTED" ? "Await AiFrogi review" : "Complete verification", href: "/onboarding" }),
    stage({ id: "connection", label: "WhatsApp connection", description: "Phone, Meta authorization, token, and webhook operating together.", owner: meta !== "LIVE" && input.facebookStatus === "CONNECTED" ? "Meta" : input.facebookStatus !== "CONNECTED" ? "Customer" : "AiFrogi", complete: meta === "LIVE" && normalized(input.integrationStatus) === "CONNECTED" && normalized(input.webhookStatus) === "CONNECTED" && normalized(input.tokenStatus) === "ACTIVE", blocked: meta === "REJECTED" || normalized(input.phoneVerificationStatus) === "FAILED", evidence: meta === "LIVE" && normalized(input.integrationStatus) === "CONNECTED" ? "WhatsApp API and inbound webhook are connected" : meta === "REJECTED" ? "Meta returned an action item" : input.facebookStatus === "CONNECTED" ? "Secure connection completed; activation is still processing" : "Secure business authorization is required", action: input.facebookStatus === "CONNECTED" ? "Check connection health" : "Connect WhatsApp", href: "/onboarding" }),
    stage({ id: "first_message", label: "Template and first message", description: "One approved template and a proven inbound/outbound test.", owner: template === "PENDING" ? "Meta" : template === "APPROVED" && firstMessage !== "PASSED" ? "AiFrogi" : "Customer", complete: template === "APPROVED" && firstMessage === "PASSED", blocked: template === "REJECTED" || firstMessage === "FAILED", evidence: template !== "APPROVED" ? `Template ${template.toLowerCase().replaceAll("_", " ") || "not started"}` : firstMessage === "PASSED" ? "Approved template and two-way message test passed" : "Template approved; two-way test still required", action: template === "APPROVED" ? "Run message test" : "Prepare approved template", href: "/campaigns" }),
    stage({ id: "knowledge", label: "Knowledge and handoff", description: "Approved answers, safe fallback, and human takeover.", owner: "Customer", complete: input.approvedKnowledgeCount > 0, evidence: input.approvedKnowledgeCount > 0 ? `${input.approvedKnowledgeCount} approved knowledge item${input.approvedKnowledgeCount === 1 ? "" : "s"}` : "No approved knowledge is available", action: "Approve business knowledge", href: "/knowledge" }),
    stage({ id: "campaign", label: "First compliant campaign", description: "Consent evidence, test send, cost review, and measured delivery.", owner: "Customer", complete: input.liveCampaignCount > 0, evidence: input.liveCampaignCount > 0 ? `${input.liveCampaignCount} live campaign${input.liveCampaignCount === 1 ? "" : "s"} recorded` : "No live compliant campaign recorded", action: "Create first campaign", href: "/campaigns" }),
    stage({ id: "automation", label: "Bot action proof", description: "Approved connector actions complete with retries and human control available.", owner: "AiFrogi", complete: input.completedAutomationCount > 0 && input.deadAutomationCount === 0, blocked: input.deadAutomationCount > 0, evidence: input.deadAutomationCount > 0 ? `${input.deadAutomationCount} automation job${input.deadAutomationCount === 1 ? "" : "s"} need intervention` : input.completedAutomationCount > 0 ? `${input.completedAutomationCount} completed automation job${input.completedAutomationCount === 1 ? "" : "s"}` : "No connector-based action is enabled", action: input.deadAutomationCount > 0 ? "Contact AiFrogi support" : "Configure through Super Admin", href: "/support" }),
    stage({ id: "billing", label: "Billing readiness", description: "Active plan, Meta billing, and no overdue invoice blocker.", owner: billing === "BLOCKED" ? "Customer" : billing !== "CONFIRMED" ? "Meta" : "AiFrogi", complete: ["TRIALING", "ACTIVE"].includes(subscription) && billing === "CONFIRMED" && input.overdueInvoiceCount === 0, blocked: billing === "BLOCKED" || input.overdueInvoiceCount > 0, evidence: billing === "BLOCKED" ? "Meta billing needs customer action" : input.overdueInvoiceCount > 0 ? `${input.overdueInvoiceCount} overdue invoice${input.overdueInvoiceCount === 1 ? "" : "s"}` : billing !== "CONFIRMED" ? "Meta billing eligibility is not confirmed" : ["TRIALING", "ACTIVE"].includes(subscription) ? "Plan and Meta billing are ready" : "AiFrogi subscription is not active", action: billing === "CONFIRMED" ? "Review subscription" : "Confirm Meta billing", href: "/support" })
  ];

  const firstIncomplete = candidates.findIndex((item) => !item.complete);
  const stages = candidates.map((item, index) => ({
    id: item.id,
    label: item.label,
    description: item.description,
    owner: item.owner,
    evidence: item.evidence,
    action: item.action,
    href: item.href,
    status: item.complete ? "complete" : item.blocked ? "blocked" : index === firstIncomplete ? "current" : "waiting"
  } satisfies ProductFlowStage));
  const completedCount = candidates.filter((item) => item.complete).length;
  const progressPercent = Math.round((completedCount / candidates.length) * 100);
  const nextAction = stages.find((item) => item.status === "blocked" || item.status === "current") ?? null;
  const phase = completedCount < 2 ? "ACTIVATE" : completedCount < 4 ? "CONNECT" : completedCount < 6 ? "PROVE" : completedCount < candidates.length ? "OPERATE" : "GROW";
  const headline = nextAction ? nextAction.label : "Ready to grow";
  const summary = nextAction ? nextAction.evidence : "Activation, messaging, campaigns, automation, and billing have operating evidence.";

  return {
    progressPercent,
    completedCount,
    totalCount: candidates.length,
    phase,
    headline,
    summary,
    nextAction,
    stages,
    customerActions: stages.filter((item) => item.owner === "Customer" && item.status !== "complete"),
    platformActions: stages.filter((item) => item.owner === "AiFrogi" && item.status !== "complete"),
    externalDependencies: stages.filter((item) => item.owner === "Meta" && item.status !== "complete")
  };
}

export async function loadOrganizationProductFlow(organizationId: string) {
  const db = getDb();
  if (!db) return null;
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      onboarding: true,
      subscription: true,
      invoices: { select: { status: true, dueAt: true } },
      properties: {
        include: {
          whatsappIntegration: { select: { status: true } },
          knowledgeEntries: { where: { status: "APPROVED" }, select: { id: true } },
          campaigns: { where: { testMode: false, status: { in: ["SENT", "COMPLETED", "PARTIAL"] } }, select: { id: true } },
          automationJobs: { where: { status: { in: ["COMPLETED", "DEAD"] } }, select: { status: true } }
        }
      }
    }
  });
  if (!organization) return null;
  const onboarding = organization.onboarding;
  const now = new Date();
  const propertyEvidence = organization.properties.reduce((result, property) => ({
    integrationStatus: result.integrationStatus === "CONNECTED" ? result.integrationStatus : property.whatsappIntegration?.status || "DISCONNECTED",
    approvedKnowledgeCount: result.approvedKnowledgeCount + property.knowledgeEntries.length,
    liveCampaignCount: result.liveCampaignCount + property.campaigns.length,
    completedAutomationCount: result.completedAutomationCount + property.automationJobs.filter((job) => job.status === "COMPLETED").length,
    deadAutomationCount: result.deadAutomationCount + property.automationJobs.filter((job) => job.status === "DEAD").length
  }), { integrationStatus: "DISCONNECTED", approvedKnowledgeCount: 0, liveCampaignCount: 0, completedAutomationCount: 0, deadAutomationCount: 0 });
  const overdueInvoiceCount = organization.invoices.filter((invoice) => invoice.status !== "PAID" && invoice.dueAt && invoice.dueAt < now).length;

  return calculateProductFlow({
    organizationActive: organization.status !== "SUSPENDED" && organization.status !== "PENDING_EMAIL",
    businessProfileComplete: Boolean(organization.name && organization.website && organization.businessAddress && organization.ownerMobile),
    kycStatus: onboarding?.kycStatus || "NOT_SUBMITTED",
    phoneVerificationStatus: onboarding?.phoneVerificationStatus || "NOT_STARTED",
    facebookStatus: onboarding?.facebookStatus || "NOT_CONNECTED",
    metaStatus: onboarding?.metaStatus || "NOT_STARTED",
    integrationStatus: propertyEvidence.integrationStatus,
    webhookStatus: onboarding?.webhookStatus || "NOT_CONFIGURED",
    tokenStatus: onboarding?.tokenStatus || "NOT_CONFIGURED",
    metaBillingStatus: onboarding?.metaBillingStatus || "NOT_CONFIRMED",
    templateStatus: onboarding?.templateStatus || "NOT_STARTED",
    firstMessageStatus: onboarding?.firstMessageStatus || "NOT_STARTED",
    approvedKnowledgeCount: propertyEvidence.approvedKnowledgeCount,
    liveCampaignCount: propertyEvidence.liveCampaignCount,
    completedAutomationCount: propertyEvidence.completedAutomationCount,
    deadAutomationCount: propertyEvidence.deadAutomationCount,
    subscriptionStatus: organization.subscription?.status || "NOT_STARTED",
    overdueInvoiceCount
  });
}

export async function loadMemberProductFlow(email: string) {
  const db = getDb();
  if (!db) return null;
  const membership = await db.organizationMember.findFirst({
    where: { email: email.trim().toLowerCase(), status: "ACTIVE" },
    select: { organizationId: true },
    orderBy: { createdAt: "asc" }
  });
  return membership ? loadOrganizationProductFlow(membership.organizationId) : null;
}
