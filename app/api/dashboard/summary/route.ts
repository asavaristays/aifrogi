import { NextResponse } from "next/server";
import { loadRevenueIntelligence } from "@/lib/services/intelligence-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const intelligence = await loadRevenueIntelligence(propertySlug);
  return NextResponse.json({ summary: intelligence.summary });
}
