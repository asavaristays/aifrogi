import { getDb } from "@/lib/db";
import { Prisma } from "../generated/prisma/client";
import { TRIAL_DAYS } from "@/lib/trial-policy";

export type PlanLimits = {
  contacts: number;
  messages: number;
  campaigns: number;
  aiReplies: number;
  teamUsers: number;
};

export type BillingHealth = {
  score: number;
  status: "HEALTHY" | "WATCH" | "AT_RISK";
  reasons: string[];
};

export const BILLING_PLAN_CATALOGUE = [
  {
    code: "AI_STARTER_MONTHLY",
    name: "AI Bot Starter Monthly",
    description: "One governed AI Business Bot, billed monthly.",
    billingInterval: "MONTHLY",
    amountPaisa: 49900,
    trialDays: 0,
    sortOrder: 2,
    limits: { contacts: 2000, messages: 5000, campaigns: 0, aiReplies: 1000, teamUsers: 3 }
  },
  {
    code: "AI_STARTER_YEARLY",
    name: "AI Bot Starter Yearly",
    description: "One governed AI Business Bot, billed yearly with ₹989 savings.",
    billingInterval: "YEARLY",
    amountPaisa: 499900,
    trialDays: 0,
    sortOrder: 3,
    limits: { contacts: 2000, messages: 5000, campaigns: 0, aiReplies: 1000, teamUsers: 3 }
  },
  {
    code: "TRIAL",
    name: "15-Day Trial",
    description: "Guided proof-of-value workspace before paid activation.",
    billingInterval: "TRIAL",
    amountPaisa: 0,
    trialDays: TRIAL_DAYS,
    sortOrder: 1,
    limits: { contacts: 250, messages: 500, campaigns: 1, aiReplies: 100, teamUsers: 2 }
  },
  {
    code: "PINGBOOK",
    name: "ClinicGPT Clinic",
    description: "Clinic-first WhatsApp appointment automation with quarterly billing.",
    billingInterval: "QUARTERLY",
    amountPaisa: 375000,
    trialDays: 0,
    sortOrder: 2,
    limits: { contacts: 1000, messages: 3000, campaigns: 0, aiReplies: 0, teamUsers: 3 }
  },
  {
    code: "STARTER",
    name: "Starter",
    description: "Core inbox, campaigns, onboarding and basic automation.",
    billingInterval: "QUARTERLY",
    amountPaisa: 495000,
    trialDays: 0,
    sortOrder: 3,
    limits: { contacts: 2000, messages: 5000, campaigns: 5, aiReplies: 1000, teamUsers: 3 }
  },
  {
    code: "GROWTH",
    name: "Growth",
    description: "Higher messaging volume, team access and workflow automation.",
    billingInterval: "QUARTERLY",
    amountPaisa: 1065000,
    trialDays: 0,
    sortOrder: 4,
    limits: { contacts: 10000, messages: 25000, campaigns: 25, aiReplies: 5000, teamUsers: 8 }
  },
  {
    code: "AI_TOOLS",
    name: "AI Operations",
    description: "Advanced AI assistance, knowledge and automation capacity.",
    billingInterval: "QUARTERLY",
    amountPaisa: 1650000,
    trialDays: 0,
    sortOrder: 5,
    limits: { contacts: 25000, messages: 75000, campaigns: 75, aiReplies: 20000, teamUsers: 15 }
  },
  {
    code: "CUSTOM",
    name: "Custom",
    description: "Contract limits and assisted onboarding for larger customers.",
    billingInterval: "CUSTOM",
    amountPaisa: 0,
    trialDays: 0,
    sortOrder: 6,
    limits: { contacts: 100000, messages: 500000, campaigns: 500, aiReplies: 100000, teamUsers: 100 }
  }
] as const;

function quarterEnd(start: Date) {
  const end = new Date(start);
  end.setMonth(end.getMonth() + 3);
  return end;
}

function billingPeriodEnd(start: Date, interval: string) {
  const end = new Date(start);
  if (interval === "MONTHLY") end.setMonth(end.getMonth() + 1);
  else if (interval === "YEARLY") end.setFullYear(end.getFullYear() + 1);
  else if (interval === "QUARTERLY") end.setMonth(end.getMonth() + 3);
  else return null;
  return end;
}

function trialEnd(start: Date, days: number) {
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return end;
}

function readLimits(value: Prisma.JsonValue): PlanLimits {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const number = (key: keyof PlanLimits) => Math.max(0, Number(source[key]) || 0);
  return {
    contacts: number("contacts"),
    messages: number("messages"),
    campaigns: number("campaigns"),
    aiReplies: number("aiReplies"),
    teamUsers: number("teamUsers")
  };
}

export async function ensureBillingPlans() {
  const db = getDb();
  if (!db) return [];
  await db.$transaction(BILLING_PLAN_CATALOGUE.map((plan) => db.billingPlan.upsert({
    where: { code: plan.code },
    update: {
      name: plan.name,
      description: plan.description,
      billingInterval: plan.billingInterval,
      amountPaisa: plan.amountPaisa,
      trialDays: plan.trialDays,
      limits: plan.limits,
      sortOrder: plan.sortOrder,
      isActive: true
    },
    create: {
      code: plan.code,
      name: plan.name,
      description: plan.description,
      billingInterval: plan.billingInterval,
      amountPaisa: plan.amountPaisa,
      trialDays: plan.trialDays,
      limits: plan.limits,
      sortOrder: plan.sortOrder
    }
  })));
  return db.billingPlan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
}

export async function ensureOrganizationSubscription(organizationId: string, requestedPlan?: string) {
  const db = getDb();
  if (!db) return null;
  const plans = await ensureBillingPlans();
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, plan: true, createdAt: true }
  });
  if (!organization) return null;
  const planCode = String(requestedPlan || organization.plan || "TRIAL").toUpperCase();
  const plan = plans.find((item) => item.code === planCode) || plans.find((item) => item.code === "TRIAL");
  if (!plan) return null;
  const now = new Date();
  const periodEnd = billingPeriodEnd(now, plan.billingInterval) || (plan.trialDays ? trialEnd(now, plan.trialDays) : null);

  return db.subscription.upsert({
    where: { organizationId },
    update: {},
    create: {
      organizationId,
      planId: plan.id,
      status: plan.code === "TRIAL" ? "TRIALING" : "ACTIVE",
      paymentProvider: "MANUAL",
      startedAt: organization.createdAt,
      trialEndsAt: plan.trialDays ? trialEnd(organization.createdAt, plan.trialDays) : null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd
    },
    include: { plan: true }
  });
}

export async function syncAllOrganizationSubscriptions() {
  const db = getDb();
  if (!db) return [];
  await ensureBillingPlans();
  const organizations = await db.organization.findMany({ select: { id: true, plan: true } });
  for (const organization of organizations) {
    await ensureOrganizationSubscription(organization.id, organization.plan);
  }
  return db.subscription.findMany({ include: { plan: true } });
}

export async function updateOrganizationPlan(input: {
  organizationId: string;
  planCode: string;
  actorEmail: string;
}) {
  const db = getDb();
  if (!db) return null;
  const plans = await ensureBillingPlans();
  const plan = plans.find((item) => item.code === input.planCode.toUpperCase());
  if (!plan) throw new Error("Unknown billing plan.");
  const existing = await db.subscription.findUnique({
    where: { organizationId: input.organizationId },
    include: { plan: true }
  });
  if (existing?.plan.code === plan.code) {
    await db.organization.update({ where: { id: input.organizationId }, data: { plan: plan.code } });
    return existing;
  }
  const now = new Date();
  const currentPeriodEnd = billingPeriodEnd(now, plan.billingInterval) || (plan.trialDays ? trialEnd(now, plan.trialDays) : null);

  const [, subscription] = await db.$transaction([
    db.organization.update({ where: { id: input.organizationId }, data: { plan: plan.code } }),
    db.subscription.upsert({
      where: { organizationId: input.organizationId },
      update: {
        planId: plan.id,
        status: plan.code === "TRIAL" ? "TRIALING" : "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd,
        trialEndsAt: plan.trialDays ? trialEnd(now, plan.trialDays) : null,
        paymentProvider: "MANUAL"
      },
      create: {
        organizationId: input.organizationId,
        planId: plan.id,
        status: plan.code === "TRIAL" ? "TRIALING" : "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd,
        trialEndsAt: plan.trialDays ? trialEnd(now, plan.trialDays) : null,
        paymentProvider: "MANUAL"
      }
    }),
    db.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "SUBSCRIPTION_PLAN_CHANGED",
        targetType: "Subscription",
        summary: `Plan changed to ${plan.code}`,
        metadata: { planCode: plan.code, paymentProvider: "MANUAL" }
      }
    })
  ]);
  return subscription;
}

export async function grantComplimentarySubscription(input: { organizationId: string; planCode: string; endsAt: Date; reason: string; actorEmail: string }) {
  const db = getDb();
  if (!db) return null;
  if (input.endsAt <= new Date()) throw new Error("Complimentary expiry must be in the future.");
  const plans = await ensureBillingPlans();
  const plan = plans.find((item) => item.code === input.planCode.toUpperCase() && item.code !== "TRIAL");
  if (!plan) throw new Error("Select a paid plan entitlement for complimentary access.");
  const now = new Date();
  return db.$transaction(async (tx) => {
    await tx.organization.update({ where: { id: input.organizationId }, data: { plan: plan.code } });
    const subscription = await tx.subscription.upsert({ where: { organizationId: input.organizationId }, update: { planId: plan.id, status: "COMPLIMENTARY", paymentProvider: "COMPLIMENTARY", currentPeriodStart: now, currentPeriodEnd: input.endsAt, trialEndsAt: null, graceEndsAt: null, complimentaryEndsAt: input.endsAt, complimentaryReason: input.reason, complimentaryGrantedBy: input.actorEmail }, create: { organizationId: input.organizationId, planId: plan.id, status: "COMPLIMENTARY", paymentProvider: "COMPLIMENTARY", currentPeriodStart: now, currentPeriodEnd: input.endsAt, complimentaryEndsAt: input.endsAt, complimentaryReason: input.reason, complimentaryGrantedBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "SUPER_ADMIN", action: "COMPLIMENTARY_ACCESS_GRANTED", targetType: "Subscription", targetId: subscription.id, summary: `Complimentary ${plan.name} granted until ${input.endsAt.toISOString().slice(0,10)}`, metadata: { planCode: plan.code, endsAt: input.endsAt.toISOString(), reason: input.reason } } });
    return subscription;
  });
}

export async function addConnectorBilling(input: { organizationId: string; category: string; name: string; setupFeePaisa: number; recurringFeePaisa: number; billingInterval: string; externalFeeNote?: string | null; notes?: string | null; actorEmail: string }) {
  const db = getDb();
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const addon = await tx.billingAddon.create({ data: { organizationId: input.organizationId, category: input.category, name: input.name, setupFeePaisa: input.setupFeePaisa, recurringFeePaisa: input.recurringFeePaisa, billingInterval: input.billingInterval, externalFeeNote: input.externalFeeNote || null, notes: input.notes || null, createdBy: input.actorEmail } });
    await tx.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: "SUPER_ADMIN", action: "CONNECTOR_ADDON_CREATED", targetType: "BillingAddon", targetId: addon.id, summary: `${input.name} connector billing added`, metadata: { category: input.category, setupFeePaisa: input.setupFeePaisa, recurringFeePaisa: input.recurringFeePaisa, billingInterval: input.billingInterval } } });
    return addon;
  });
}

export async function createManualInvoice(input: {
  organizationId: string;
  actorEmail: string;
  platformFeePaisa: number;
  metaChargesPaisa?: number;
  aiOveragePaisa?: number;
  servicesPaisa?: number;
  taxPaisa?: number;
  adjustmentPaisa?: number;
  dueAt?: Date | null;
  notes?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  const subscription = await ensureOrganizationSubscription(input.organizationId);
  if (!subscription) throw new Error("Subscription could not be created.");
  const periodStart = subscription.currentPeriodStart;
  const periodEnd = subscription.currentPeriodEnd || quarterEnd(periodStart);
  const totalPaisa = input.platformFeePaisa
    + (input.metaChargesPaisa || 0)
    + (input.aiOveragePaisa || 0)
    + (input.servicesPaisa || 0)
    + (input.taxPaisa || 0)
    + (input.adjustmentPaisa || 0);
  const invoiceNumber = `AIF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-6)}`;

  return db.$transaction(async (tx) => {
    const invoice = await tx.billingInvoice.create({
      data: {
        organizationId: input.organizationId,
        subscriptionId: subscription.id,
        invoiceNumber,
        status: "ISSUED",
        periodStart,
        periodEnd,
        platformFeePaisa: input.platformFeePaisa,
        metaChargesPaisa: input.metaChargesPaisa || 0,
        aiOveragePaisa: input.aiOveragePaisa || 0,
        servicesPaisa: input.servicesPaisa || 0,
        taxPaisa: input.taxPaisa || 0,
        adjustmentPaisa: input.adjustmentPaisa || 0,
        totalPaisa,
        dueAt: input.dueAt || null,
        notes: input.notes || null,
        createdBy: input.actorEmail
      }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "INVOICE_ISSUED",
        targetType: "BillingInvoice",
        targetId: invoice.id,
        summary: `${invoice.invoiceNumber} issued for ${formatMoney(totalPaisa)}`,
        metadata: { invoiceNumber, totalPaisa }
      }
    });
    return invoice;
  });
}

export async function activateRazorpaySubscription(input: {
  organizationId: string;
  actorEmail: string;
  planCode: "AI_STARTER_MONTHLY" | "AI_STARTER_YEARLY";
  orderId: string;
  paymentId: string;
  amountPaisa: number;
  currency: string;
}) {
  const db = getDb();
  if (!db) throw new Error("Billing database is unavailable.");
  const plans = await ensureBillingPlans();
  const plan = plans.find((item) => item.code === input.planCode);
  if (!plan || plan.amountPaisa !== input.amountPaisa || plan.currency !== input.currency) {
    throw new Error("The verified payment does not match the selected plan.");
  }
  const existingInvoice = await db.billingInvoice.findFirst({
    where: { organizationId: input.organizationId, paymentReference: input.paymentId }
  });
  if (existingInvoice) return existingInvoice;

  const now = new Date();
  const currentPeriodEnd = billingPeriodEnd(now, plan.billingInterval);
  if (!currentPeriodEnd) throw new Error("Unsupported paid billing interval.");
  const invoiceNumber = `AIF-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${input.paymentId.slice(-8).toUpperCase()}`;

  return db.$transaction(async (tx) => {
    await tx.organization.update({ where: { id: input.organizationId }, data: { plan: plan.code } });
    const subscription = await tx.subscription.upsert({
      where: { organizationId: input.organizationId },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        paymentProvider: "RAZORPAY",
        externalSubscriptionId: input.orderId,
        currentPeriodStart: now,
        currentPeriodEnd,
        trialEndsAt: null,
        graceEndsAt: null,
        cancelAtPeriodEnd: false
      },
      create: {
        organizationId: input.organizationId,
        planId: plan.id,
        status: "ACTIVE",
        paymentProvider: "RAZORPAY",
        externalSubscriptionId: input.orderId,
        currentPeriodStart: now,
        currentPeriodEnd
      }
    });
    const invoice = await tx.billingInvoice.create({
      data: {
        organizationId: input.organizationId,
        subscriptionId: subscription.id,
        invoiceNumber,
        status: "PAID",
        currency: input.currency,
        periodStart: now,
        periodEnd: currentPeriodEnd,
        platformFeePaisa: input.amountPaisa,
        totalPaisa: input.amountPaisa,
        paidAt: now,
        paymentReference: input.paymentId,
        notes: `Razorpay order ${input.orderId}`,
        createdBy: input.actorEmail
      }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "CLIENT_ADMIN",
        action: "RAZORPAY_PLAN_ACTIVATED",
        targetType: "BillingInvoice",
        targetId: invoice.id,
        summary: `${plan.name} activated after verified Razorpay payment`,
        metadata: { planCode: plan.code, orderId: input.orderId, paymentId: input.paymentId, amountPaisa: input.amountPaisa }
      }
    });
    return invoice;
  });
}

export async function markInvoicePaid(input: {
  organizationId: string;
  invoiceId: string;
  actorEmail: string;
  paymentReference: string;
}) {
  const db = getDb();
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const invoice = await tx.billingInvoice.update({
      where: { id: input.invoiceId, organizationId: input.organizationId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentReference: input.paymentReference
      }
    });
    await tx.subscription.updateMany({
      where: { organizationId: input.organizationId },
      data: { status: "ACTIVE", graceEndsAt: null }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "INVOICE_MARKED_PAID",
        targetType: "BillingInvoice",
        targetId: invoice.id,
        summary: `${invoice.invoiceNumber} marked paid`,
        metadata: { paymentReference: input.paymentReference }
      }
    });
    return invoice;
  });
}

export async function createPlatformIncident(input: {
  organizationId?: string | null;
  actorEmail: string;
  severity: string;
  category: string;
  title: string;
  description: string;
}) {
  const db = getDb();
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const incident = await tx.platformIncident.create({
      data: {
        organizationId: input.organizationId || null,
        severity: input.severity,
        category: input.category,
        title: input.title,
        description: input.description,
        ownerEmail: input.actorEmail
      }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId || null,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "INCIDENT_OPENED",
        targetType: "PlatformIncident",
        targetId: incident.id,
        summary: `${input.severity} incident opened: ${input.title}`
      }
    });
    return incident;
  });
}

export async function resolvePlatformIncident(input: {
  organizationId?: string | null;
  incidentId: string;
  actorEmail: string;
  resolution: string;
}) {
  const db = getDb();
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const incident = await tx.platformIncident.update({
      where: { id: input.incidentId },
      data: { status: "RESOLVED", resolvedAt: new Date(), resolution: input.resolution }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId || incident.organizationId,
        actorEmail: input.actorEmail,
        actorRole: "SUPER_ADMIN",
        action: "INCIDENT_RESOLVED",
        targetType: "PlatformIncident",
        targetId: incident.id,
        summary: `Incident resolved: ${incident.title}`
      }
    });
    return incident;
  });
}

export async function getCustomerBillingDetail(organizationId: string) {
  const db = getDb();
  if (!db) return null;
  await ensureOrganizationSubscription(organizationId);
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      subscription: { include: { plan: true } },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      billingAddons: { orderBy: { createdAt: "desc" } },
      incidents: { orderBy: { createdAt: "desc" }, take: 10 },
      auditLogs: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });
  if (!organization?.subscription) return null;
  const usage = await getOrganizationUsage(organizationId, organization.subscription.currentPeriodStart, organization.subscription.currentPeriodEnd);
  return {
    organization,
    subscription: organization.subscription,
    limits: readLimits(organization.subscription.plan.limits),
    usage
  };
}

export async function getBillingCommandCenter() {
  const db = getDb();
  if (!db) return { plans: [], customers: [], incidents: [], auditLogs: [] };
  const plans = await ensureBillingPlans();
  await syncAllOrganizationSubscriptions();
  const organizations = await db.organization.findMany({
    include: {
      onboarding: true,
      botProfile: true,
      subscription: { include: { plan: true } },
      invoices: { orderBy: { createdAt: "desc" }, take: 5 },
      incidents: { where: { status: { not: "RESOLVED" } }, orderBy: { createdAt: "desc" } },
      supportTickets: { where: { status: { notIn: ["RESOLVED", "CLOSED"] } } },
      billingAddons: { orderBy: { createdAt: "desc" } }
    },
    orderBy: { updatedAt: "desc" }
  });

  const customers = await Promise.all(organizations.map(async (organization) => {
    const subscription = organization.subscription;
    const limits = readLimits(subscription?.plan.limits || {});
    const usage = subscription
      ? await getOrganizationUsage(organization.id, subscription.currentPeriodStart, subscription.currentPeriodEnd)
      : emptyUsage();
    const failedMessages = await db.leadMessage.count({
      where: { lead: { property: { organizationId: organization.id } }, deliveryStatus: { startsWith: "failed" } }
    });
    const deadJobs = await db.automationJob.count({
      where: { property: { organizationId: organization.id }, status: "DEAD" }
    });
    const health = calculateCustomerHealth({
      metaStatus: organization.onboarding?.metaStatus || "NOT_STARTED",
      webhookStatus: organization.onboarding?.webhookStatus || "NOT_CONFIGURED",
      openTickets: organization.supportTickets.length,
      openIncidents: organization.incidents.length,
      pastDueInvoices: organization.invoices.filter((invoice) => invoice.status === "PAST_DUE" || (invoice.status === "ISSUED" && invoice.dueAt && invoice.dueAt < new Date())).length,
      failedMessages,
      deadJobs,
      usage,
      limits
    });
    return { organization, subscription, limits, usage, health, failedMessages, deadJobs };
  }));

  const [incidents, auditLogs] = await Promise.all([
    db.platformIncident.findMany({ include: { organization: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    db.platformAuditLog.findMany({ include: { organization: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 40 })
  ]);
  return { plans, customers, incidents, auditLogs };
}

export function calculateCustomerHealth(input: {
  metaStatus: string;
  webhookStatus: string;
  openTickets: number;
  openIncidents: number;
  pastDueInvoices: number;
  failedMessages: number;
  deadJobs: number;
  usage: PlanLimits;
  limits: PlanLimits;
}): BillingHealth {
  let score = 100;
  const reasons: string[] = [];
  const reduce = (points: number, reason: string) => {
    score -= points;
    reasons.push(reason);
  };
  if (input.metaStatus !== "LIVE") reduce(20, "WhatsApp activation incomplete");
  if (input.webhookStatus !== "CONNECTED") reduce(15, "Webhook requires attention");
  if (input.pastDueInvoices) reduce(25, "Payment overdue");
  if (input.openIncidents) reduce(15, "Open platform incident");
  if (input.openTickets) reduce(Math.min(15, input.openTickets * 5), "Open support request");
  if (input.failedMessages) reduce(10, "Message delivery failures");
  if (input.deadJobs) reduce(10, "Automation dead-letter jobs");
  if (usagePercent(input.usage.messages, input.limits.messages) >= 90) reduce(8, "Message allowance nearly used");
  if (usagePercent(input.usage.aiReplies, input.limits.aiReplies) >= 90) reduce(8, "AI allowance nearly used");
  score = Math.max(0, score);
  return {
    score,
    status: score >= 80 ? "HEALTHY" : score >= 60 ? "WATCH" : "AT_RISK",
    reasons: reasons.length ? reasons : ["Operating normally"]
  };
}

export async function getOrganizationUsage(organizationId: string, periodStart: Date, periodEnd: Date | null): Promise<PlanLimits> {
  const db = getDb();
  if (!db) return emptyUsage();
  const dateWhere = { gte: periodStart, ...(periodEnd ? { lt: periodEnd } : {}) };
  const [contacts, messages, campaigns, aiReplies, teamUsers] = await Promise.all([
    db.lead.count({ where: { property: { organizationId } } }),
    db.leadMessage.count({ where: { lead: { property: { organizationId } }, sentAt: dateWhere } }),
    db.campaign.count({ where: { property: { organizationId }, createdAt: dateWhere } }),
    db.leadMessage.count({ where: { lead: { property: { organizationId } }, sender: "AI", sentAt: dateWhere } }),
    db.organizationMember.count({ where: { organizationId, status: "ACTIVE" } })
  ]);
  return { contacts, messages, campaigns, aiReplies, teamUsers };
}

export async function checkOrganizationEntitlement(
  organizationId: string,
  metric: keyof PlanLimits,
  additional = 1
) {
  const db = getDb();
  if (!db) return { allowed: false, error: "Billing service is unavailable.", used: 0, limit: 0 };
  const subscription = await ensureOrganizationSubscription(organizationId);
  if (!subscription) return { allowed: false, error: "Subscription is unavailable.", used: 0, limit: 0 };
  const limits = readLimits(subscription.plan.limits);
  if (subscription.messageLimitOverride !== null) limits.messages = subscription.messageLimitOverride;
  if (subscription.aiReplyLimitOverride !== null) limits.aiReplies = subscription.aiReplyLimitOverride;
  const usage = await getOrganizationUsage(organizationId, subscription.currentPeriodStart, subscription.currentPeriodEnd);
  const used = usage[metric];
  const limit = limits[metric];
  const allowed = limit === 0 || used + Math.max(0, additional) <= limit || subscription.overageApproved;
  return {
    allowed,
    used,
    limit,
    error: allowed ? null : `${metric} allowance reached (${used}/${limit}). Choose a higher plan before continuing.`
  };
}

function emptyUsage(): PlanLimits {
  return { contacts: 0, messages: 0, campaigns: 0, aiReplies: 0, teamUsers: 0 };
}

export function usagePercent(value: number, limit: number) {
  if (!limit) return 0;
  return Math.min(999, Math.round((value / limit) * 100));
}

export function formatMoney(paisa: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paisa / 100);
}
