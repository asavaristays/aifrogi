import type { Lead } from "@/types";
import { buildWhatsAppMetrics } from "@/lib/whatsapp-metrics";

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

export type WebsiteMonthlyReportRow = {
  key: string;
  label: string;
  conversations: number;
  incoming: number;
  outgoing: number;
  qualified: number;
  captured: number;
  answerRate: number;
};

function indiaMonthParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit"
  }).formatToParts(date);
  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value)
  };
}

function monthRange(year: number, month: number) {
  const indiaOffsetMs = 330 * 60_000;
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - indiaOffsetMs),
    end: new Date(Date.UTC(year, month, 1) - indiaOffsetMs)
  };
}

export function websiteMonthlyReport(leads: Lead[], now = new Date(), count = 12): WebsiteMonthlyReportRow[] {
  const current = indiaMonthParts(now);
  const websiteLeads = leads.filter((lead) => Boolean(lead.websiteSession) || /website|ai bot/i.test(lead.source));

  return Array.from({ length: count }, (_, index) => {
    const cursor = new Date(Date.UTC(current.year, current.month - 1 - index, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth() + 1;
    const range = monthRange(year, month);
    const active = websiteLeads.map((lead) => ({
      ...lead,
      transcript: lead.transcript.filter((message) => {
        const sentAt = new Date(message.sentAtIso);
        return sentAt >= range.start && sentAt < range.end;
      })
    })).filter((lead) => lead.transcript.length > 0);
    const metrics = buildWhatsAppMetrics(active);
    const qualified = active.filter((lead) => lead.score >= 60).length;
    const captured = active.filter((lead) => {
      const consentedAt = lead.websiteSession?.consentedAt ? new Date(lead.websiteSession.consentedAt) : null;
      return Boolean(consentedAt && consentedAt >= range.start && consentedAt < range.end && lead.websiteSession?.contactValue);
    }).length;
    const answered = Math.max(metrics.contacts - metrics.unanswered, 0);

    return {
      key: `${year}-${String(month).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(range.start),
      conversations: metrics.contacts,
      incoming: metrics.incoming,
      outgoing: metrics.outgoing,
      qualified,
      captured,
      answerRate: metrics.contacts ? Math.round((answered / metrics.contacts) * 100) : 0
    };
  });
}
