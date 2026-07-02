import { loadLeadsWithOptions } from "@/lib/services/lead-service";
import { loadBookingMailbox } from "@/lib/services/mailbox-service";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { currency } from "@/lib/utils";
import type { Lead } from "@/types";

export type LeadHealthStatus = "new" | "responded" | "missed" | "delayed" | "unresponded";
export type LeadTier = "HOT" | "WARM" | "COLD";

export type DemandPoint = {
  label: string;
  leads: number;
  revenue: number;
};

export type FunnelPoint = {
  label: string;
  value: number;
  percentage: number;
};

export type RecoveryLead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  stage: string;
  score: number;
  tier: LeadTier;
  healthStatus: LeadHealthStatus;
  issue: string;
  nextStep: string;
  revenuePotential: number;
  revenuePotentialLabel: string;
  lastActivityLabel: string;
  updatedAtIso: string;
};

export type IntelligenceAction = {
  title: string;
  reason: string;
  revenueImpact: number;
  revenueImpactLabel: string;
  priority: "high" | "medium" | "low";
};

export type DashboardIntelligence = {
  summary: {
    totalLeads: number;
    missedLeads: number;
    delayedLeads: number;
    unrespondedLeads: number;
    emailBacklog: number;
    attentionNeeded: number;
    hotLeads: number;
    convertedLeads: number;
    revenueAtRisk: number;
    averageResponseLabel: string;
    responseLagLabel: string;
  };
  actions: IntelligenceAction[];
  recovery: RecoveryLead[];
  funnel: FunnelPoint[];
  demand: DemandPoint[];
  liveFeed: Lead[];
};

type ConversationSignal = {
  healthStatus: LeadHealthStatus;
  responseMinutes: number | null;
  hasResponse: boolean;
  lastIncomingAt: Date | null;
  lastOutgoingAt: Date | null;
};

const IST = "Asia/Kolkata";

function dateLabel(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function parseBudgetValue(label: string) {
  const normalized = label.toLowerCase();
  const numeric = normalized.match(/(?:₹|rs\.?|inr)?\s*([\d,.]+)\s*(l|k|lac|lakh)?/i);
  if (!numeric) return null;

  const value = Number.parseFloat(numeric[1].replace(/,/g, ""));
  if (Number.isNaN(value)) return null;

  const multiplier = numeric[2]?.toLowerCase();
  if (multiplier === "l" || multiplier === "lac" || multiplier === "lakh") return value * 100000;
  if (multiplier === "k") return value * 1000;
  return value;
}

function parseStayNights(label: string) {
  const matches = label.match(/(\d{1,2})\s*[-/]\s*(\d{1,2})/);
  if (!matches) return 2;

  const start = Number.parseInt(matches[1], 10);
  const end = Number.parseInt(matches[2], 10);
  const nights = end - start;
  return Number.isFinite(nights) && nights > 0 ? nights : 2;
}

function containsAny(text: string, words: string[]) {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function hasDateSignal(lead: Lead) {
  const combined = [lead.intent, lead.stay, lead.transcript.map((entry) => entry.text).join(" ")].join(" ");
  return containsAny(combined, [
    "today",
    "tomorrow",
    "weekend",
    "next week",
    "date",
    "oct",
    "nov",
    "dec",
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep"
  ]);
}

function hasBudgetSignal(lead: Lead) {
  const combined = [lead.budget, lead.intent, lead.transcript.map((entry) => entry.text).join(" ")].join(" ");
  return containsAny(combined, ["₹", "budget", "under", "around", "price", "rate", "quote", "package", "budget"]);
}

function countGuestInteractions(lead: Lead) {
  return lead.transcript.filter((entry) => entry.from === "guest").length;
}

function getConversationSignal(lead: Lead): ConversationSignal {
  const ordered = [...lead.transcript].sort((left, right) => new Date(left.sentAtIso).getTime() - new Date(right.sentAtIso).getTime());
  const incoming = ordered.filter((entry) => entry.from === "guest");
  const outgoing = ordered.filter((entry) => entry.from !== "guest");
  const lastIncoming = incoming[incoming.length - 1] ?? null;
  const lastOutgoing = outgoing[outgoing.length - 1] ?? null;
  const lastMessage = ordered[ordered.length - 1] ?? null;

  const hasResponse = Boolean(lastOutgoing && (!lastIncoming || new Date(lastOutgoing.sentAtIso).getTime() >= new Date(lastIncoming.sentAtIso).getTime()));

  if (!lastIncoming) {
    return {
      healthStatus: ordered.length ? "responded" : "new",
      responseMinutes: null,
      hasResponse,
      lastIncomingAt: null,
      lastOutgoingAt: lastOutgoing ? new Date(lastOutgoing.sentAtIso) : null
    };
  }

  const lastIncomingAt = new Date(lastIncoming.sentAtIso);
  const lastOutgoingAt = lastOutgoing ? new Date(lastOutgoing.sentAtIso) : null;
  const responseMinutes = hasResponse && lastOutgoingAt
    ? Math.max(1, Math.round((lastOutgoingAt.getTime() - lastIncomingAt.getTime()) / 60000))
    : null;

  if (!hasResponse) {
    const elapsedMinutes = Math.max(1, Math.round((Date.now() - lastIncomingAt.getTime()) / 60000));
    if (elapsedMinutes > 10) {
      return {
        healthStatus: "missed",
        responseMinutes: null,
        hasResponse,
        lastIncomingAt,
        lastOutgoingAt
      };
    }

    return {
      healthStatus: "unresponded",
      responseMinutes: null,
      hasResponse,
      lastIncomingAt,
      lastOutgoingAt
    };
  }

  if (responseMinutes !== null && responseMinutes > 15) {
    return {
      healthStatus: "delayed",
      responseMinutes,
      hasResponse,
      lastIncomingAt,
      lastOutgoingAt
    };
  }

  return {
    healthStatus: "responded",
    responseMinutes,
    hasResponse,
    lastIncomingAt,
    lastOutgoingAt
  };
}

function scoreLead(lead: Lead, signal: ConversationSignal) {
  let score = Math.max(0, Math.min(100, lead.score || 50));

  if (hasDateSignal(lead)) score += 30;
  if (hasBudgetSignal(lead)) score += 20;
  if (countGuestInteractions(lead) > 1) score += 15;
  if (["whatsapp", "call"].includes(lead.source.trim().toLowerCase())) score += 10;
  if (signal.healthStatus === "missed" || signal.healthStatus === "unresponded") score -= 20;
  if (signal.healthStatus === "delayed") score -= 10;

  return Math.max(0, Math.min(100, score));
}

function tierFromScore(score: number): LeadTier {
  if (score >= 70) return "HOT";
  if (score >= 40) return "WARM";
  return "COLD";
}

function probabilityForTier(tier: LeadTier) {
  if (tier === "HOT") return 0.7;
  if (tier === "WARM") return 0.4;
  return 0.1;
}

function estimateRevenue(lead: Lead, score: number) {
  const budgetBase = parseBudgetValue(lead.budget) ?? 8000;
  const nights = parseStayNights(lead.stay);
  const probability = probabilityForTier(tierFromScore(score));

  return Math.round(budgetBase * nights * probability);
}

function getFunnelStage(lead: Lead, signal: ConversationSignal) {
  const stage = lead.stage.toLowerCase();
  if (stage === "booked") return "Booked";

  const combined = lead.transcript.map((entry) => entry.text.toLowerCase()).join(" ");
  const priceShared = containsAny(combined, ["price", "rate", "quote", "package", "₹", "breakfast"]);

  if (priceShared) return "Price Shared";
  if (signal.hasResponse) return "Responded";
  return "Inquiry";
}

function buildDemandSeries(leads: Lead[], scored: Map<string, { revenue: number }>) {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return dayKey(date);
  });

  return dates.map((key) => {
    const dayLeads = leads.filter((lead) => dayKey(new Date(lead.updatedAtIso)) === key);
    const revenue = dayLeads.reduce((sum, lead) => sum + (scored.get(lead.id)?.revenue ?? 0), 0);

    return {
      label: new Intl.DateTimeFormat("en-IN", { timeZone: IST, day: "2-digit", month: "short" }).format(new Date(`${key}T00:00:00Z`)),
      leads: dayLeads.length,
      revenue
    };
  });
}

function makeAction(title: string, reason: string, revenueImpact: number, priority: "high" | "medium" | "low"): IntelligenceAction {
  return {
    title,
    reason,
    revenueImpact,
    revenueImpactLabel: currency(revenueImpact),
    priority
  };
}

function buildActions(summary: DashboardIntelligence["summary"], recovery: RecoveryLead[], hotLeads: RecoveryLead[], emailBacklog: number) {
  const actions: IntelligenceAction[] = [];
  const topRisk = recovery.slice(0, 3).reduce((sum, item) => sum + item.revenuePotential, 0);

  if (summary.missedLeads > 0) {
    actions.push(
      makeAction(
        "Call back missed leads now",
        `${summary.missedLeads} leads have crossed the response threshold. Fast callbacks protect the highest-intent bookings.`,
        Math.round(topRisk * 0.45),
        "high"
      )
    );
  }

  if (summary.unrespondedLeads > 0 || emailBacklog > 0) {
    actions.push(
      makeAction(
        "Clear the booking inbox",
        `${summary.unrespondedLeads + emailBacklog} booking emails or threads are still waiting for a reply.`,
        Math.round(topRisk * 0.28),
        "high"
      )
    );
  }

  if (summary.delayedLeads > 0) {
    actions.push(
      makeAction(
        "Reduce delayed replies below 15 minutes",
        `${summary.delayedLeads} conversations are slipping outside the ideal response window.`,
        Math.round(topRisk * 0.2),
        "medium"
      )
    );
  }

  if (hotLeads.length > 0) {
    actions.push(
      makeAction(
        "Prioritize hot leads before new inquiries",
        `${hotLeads.length} hot leads are ready for human follow-up or conversion push.`,
        Math.round(hotLeads.reduce((sum, lead) => sum + lead.revenuePotential, 0) * 0.35),
        "high"
      )
    );
  }

  if (summary.revenueAtRisk > 0) {
    actions.push(
      makeAction(
        "Protect revenue at risk",
        `Unresponded and delayed conversations expose about ${currency(summary.revenueAtRisk)} in recoverable booking value.`,
        Math.round(summary.revenueAtRisk * 0.25),
        "medium"
      )
    );
  }

  if (!actions.length) {
    actions.push(
      makeAction(
        "Keep response speed under control",
        "There are no urgent recovery items right now. Continue monitoring live leads and response timing.",
        0,
        "low"
      )
    );
  }

  return actions.slice(0, 5);
}

export async function loadRevenueIntelligence(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<DashboardIntelligence> {
  const [leads, mailbox] = await Promise.all([
    loadLeadsWithOptions(propertySlug, { fallbackToMock: false }),
    loadBookingMailbox(12).catch(() => null)
  ]);
  const scored = new Map<
    string,
    {
      score: number;
      tier: LeadTier;
      revenue: number;
      signal: ConversationSignal;
      stage: string;
      source: string;
      lastActivityIso: string;
      lastActivityLabel: string;
    }
  >();

  const recovery: RecoveryLead[] = [];
  let missedLeads = 0;
  let delayedLeads = 0;
  let unrespondedLeads = 0;
  let hotLeads = 0;
  let convertedLeads = 0;
  let revenueAtRisk = 0;
  let responseTotalMinutes = 0;
  let responseCount = 0;
  const emailBacklog = mailbox?.configured
    ? Math.max(mailbox.stats.unreadCount, mailbox.stats.receivedCount - mailbox.stats.sentCount, 0)
    : 0;

  const normalizedLeads = leads.map((lead) => {
    const signal = getConversationSignal(lead);
    const score = scoreLead(lead, signal);
    const tier = tierFromScore(score);
    const revenue = estimateRevenue(lead, score);
    const stage = lead.stage;
    const source = lead.source;
    const lastActivity = new Date(lead.updatedAtIso);
    const lastActivityLabel = dateLabel(lastActivity);

    scored.set(lead.id, {
      score,
      tier,
      revenue,
      signal,
      stage,
      source,
      lastActivityIso: lead.updatedAtIso,
      lastActivityLabel
    });

    if (tier === "HOT") hotLeads += 1;
    if (stage.toLowerCase() === "booked") convertedLeads += 1;
    if (signal.healthStatus === "missed") missedLeads += 1;
    if (signal.healthStatus === "delayed") delayedLeads += 1;
    if (signal.healthStatus === "unresponded") unrespondedLeads += 1;
    if (signal.responseMinutes) {
      responseTotalMinutes += signal.responseMinutes;
      responseCount += 1;
    }

    if (signal.healthStatus === "missed" || signal.healthStatus === "delayed" || signal.healthStatus === "unresponded") {
      revenueAtRisk += revenue;
    }

    if (signal.healthStatus === "missed" || signal.healthStatus === "delayed" || signal.healthStatus === "unresponded") {
      recovery.push({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        source: lead.source,
        stage: lead.stage,
        score,
        tier,
        healthStatus: signal.healthStatus,
        issue:
          signal.healthStatus === "missed"
            ? "No reply after the 10 minute window"
            : signal.healthStatus === "delayed"
              ? "Response took longer than 15 minutes"
              : "Last guest message is still waiting for a reply",
        nextStep:
          signal.healthStatus === "missed"
            ? "Call back immediately"
            : signal.healthStatus === "delayed"
              ? "Send a quick follow-up now"
              : "Reply and move the lead forward",
        revenuePotential: revenue,
        revenuePotentialLabel: currency(revenue),
        lastActivityLabel,
        updatedAtIso: lead.updatedAtIso
      });
    }

    return lead;
  });

  const stagePriority = new Map<string, number>([
    ["Inquiry", 0],
    ["Responded", 1],
    ["Price Shared", 2],
    ["Booked", 3]
  ]);

  const funnelCounts = normalizedLeads.reduce(
    (acc, lead) => {
      const signal = scored.get(lead.id)?.signal ?? getConversationSignal(lead);
      const stage = getFunnelStage(lead, signal);
      acc.set(stage, (acc.get(stage) ?? 0) + 1);
      return acc;
    },
    new Map<string, number>()
  );

  const funnel: FunnelPoint[] = Array.from(funnelCounts.entries())
    .map(([label, value]) => ({
      label,
      value,
      percentage: normalizedLeads.length ? Math.round((value / normalizedLeads.length) * 100) : 0
    }))
    .sort((left, right) => (stagePriority.get(left.label) ?? 0) - (stagePriority.get(right.label) ?? 0));

  const demand = buildDemandSeries(normalizedLeads, scored);

  const summary: DashboardIntelligence["summary"] = {
    totalLeads: normalizedLeads.length,
    missedLeads,
    delayedLeads,
    unrespondedLeads,
    emailBacklog,
    attentionNeeded: missedLeads + delayedLeads + unrespondedLeads + emailBacklog,
    hotLeads,
    convertedLeads,
    revenueAtRisk,
    averageResponseLabel: responseCount ? `${Math.max(1, Math.round(responseTotalMinutes / responseCount))}m` : "—",
    responseLagLabel:
      missedLeads + delayedLeads + unrespondedLeads + emailBacklog > 0
        ? `${missedLeads + delayedLeads + unrespondedLeads + emailBacklog} leads need attention`
        : "All clear right now"
  };

  const hotRecoveryLeads = [...recovery]
    .filter((lead) => lead.tier === "HOT")
    .sort((left, right) => right.revenuePotential - left.revenuePotential);

  const actions = buildActions(summary, recovery, hotRecoveryLeads, emailBacklog);

  return {
    summary,
    actions,
    recovery: recovery.sort((left, right) => right.revenuePotential - left.revenuePotential).slice(0, 6),
    funnel,
    demand,
    liveFeed: normalizedLeads.sort((left, right) => new Date(right.updatedAtIso).getTime() - new Date(left.updatedAtIso).getTime()).slice(0, 6)
  };
}
