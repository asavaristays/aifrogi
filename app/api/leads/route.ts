import { NextResponse } from "next/server";
import { createLead, loadLeads } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET() {
  const propertySlug = await getCurrentWorkspaceSlug();
  const leads = await loadLeads(propertySlug);
  return NextResponse.json({ leads });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const propertySlug = await getCurrentWorkspaceSlug();
  const result = await createLead(payload, propertySlug);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: result.lead }, { status: result.status });
}
