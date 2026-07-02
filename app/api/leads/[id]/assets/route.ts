import { NextResponse } from "next/server";
import { createLeadAssetShare, loadLeadAssetShares } from "@/lib/services/assets-service";
import { loadLead } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

async function isCurrentWorkspaceLead(id: string) {
  const [lead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);
  return Boolean(lead && lead.propertySlug === propertySlug);
}

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!(await isCurrentWorkspaceLead(id))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const shares = await loadLeadAssetShares(id);
  return NextResponse.json({ shares });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!(await isCurrentWorkspaceLead(id))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const payload = await request.json();
  const result = await createLeadAssetShare({
    leadId: id,
    assetId: payload.assetId,
    channel: payload.channel,
    note: payload.note
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ share: result.share }, { status: result.status });
}
