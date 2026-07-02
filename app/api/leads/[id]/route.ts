import { NextResponse } from "next/server";
import { loadLead, updateLead } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [lead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);

  if (!lead || lead.propertySlug !== propertySlug) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [existingLead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);
  if (!existingLead || existingLead.propertySlug !== propertySlug) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const payload = await request.json();
  const result = await updateLead(id, payload);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: result.lead }, { status: result.status });
}
