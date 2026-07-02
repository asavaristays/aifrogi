import { isDatabaseAccessError } from "@/lib/errors";
import { DEFAULT_PROPERTY_SLUG } from "@/lib/env";
import { currency } from "@/lib/utils";
import { getLatestDashboardMetric } from "@/lib/repositories/dashboard-repository";
import type { Metric } from "@/types";

export async function loadDashboardMetrics(propertySlug = DEFAULT_PROPERTY_SLUG): Promise<Metric[]> {
  let record = null;

  try {
    record = await getLatestDashboardMetric(propertySlug);
  } catch (error) {
    if (!isDatabaseAccessError(error)) {
      throw error;
    }
  }

  if (!record) {
    return [];
  }

  return [
    {
      label: "Total Leads This Month",
      value: String(record.totalLeads),
      delta: "+23%",
      tone: "primary",
      helper: `${record.highScoreLeadCount} high-score leads`,
      trend: [22, 32, 28, 40, 34, 49, 43]
    },
    {
      label: "Confirmed Bookings",
      value: currency(record.confirmedRevenue),
      delta: "+31%",
      tone: "secondary",
      helper: `${record.confirmedBookings} bookings confirmed`,
      trend: [12, 18, 27, 23, 31, 42, 38]
    },
    {
      label: "Channel Capture Value",
      value: currency(record.otaCommissionSaved),
      delta: "combined",
      tone: "tertiary",
      helper: `${record.directGuestsAcquired} direct guests acquired`,
      trend: [9, 10, 17, 20, 16, 24, 28]
    },
    {
      label: "Avg India Lead Score",
      value: `${Math.round(record.averageLeadScore)}/100`,
      delta: "Target 65",
      tone: "neutral",
      helper: "Highest from WhatsApp + family travel",
      trend: [54, 58, 60, 57, 62, 61, 61]
    }
  ];
}
