import type { Lead } from "@/types";

export const REPORT_PERIODS = ["today", "7d", "30d", "all"] as const;
export type ReportPeriod = typeof REPORT_PERIODS[number];

export function resolveReportPeriod(value: string | undefined, now = new Date()) {
  const period: ReportPeriod = REPORT_PERIODS.includes(value as ReportPeriod) ? value as ReportPeriod : "7d";
  if (period === "all") return { period, since: null, label: "All-time" };
  const indiaOffsetMs = 330 * 60_000;
  const india = new Date(now.getTime() + indiaOffsetMs);
  const days = period === "today" ? 0 : period === "7d" ? 6 : 29;
  const since = new Date(Date.UTC(india.getUTCFullYear(), india.getUTCMonth(), india.getUTCDate() - days) - indiaOffsetMs);
  return { period, since, label: period === "today" ? "Today" : period === "7d" ? "Last 7 days" : "Last 30 days" };
}

export function websiteLeadsForPeriod(leads: Lead[], since: Date | null) {
  return leads.filter((lead) => Boolean(lead.websiteSession) || /website|ai bot/i.test(lead.source)).map((lead) => ({
    ...lead,
    transcript: since ? lead.transcript.filter((message) => new Date(message.sentAtIso) >= since) : lead.transcript
  })).filter((lead) => lead.transcript.length > 0);
}

export function websiteOutcomeSummary(leads: Lead[]) {
  const qualified = leads.filter((lead) => lead.score >= 60).length;
  const captured = leads.filter((lead) => Boolean(lead.websiteSession?.consentedAt && lead.websiteSession.contactValue)).length;
  return {
    qualified,
    captured,
    qualificationRate: leads.length ? Math.round((qualified / leads.length) * 100) : 0,
    captureRate: leads.length ? Math.round((captured / leads.length) * 100) : 0
  };
}
