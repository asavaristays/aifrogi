import { NextResponse } from "next/server";
import { loadDashboardMetrics } from "@/lib/services/dashboard-service";
import { loadRevenueIntelligence } from "@/lib/services/intelligence-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const [metrics, intelligence] = await Promise.all([
    loadDashboardMetrics(propertySlug),
    loadRevenueIntelligence(propertySlug)
  ]);
  return NextResponse.json({ metrics, intelligence });
}
