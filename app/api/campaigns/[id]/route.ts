import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { cancelScheduledCampaign } from "@/lib/repositories/campaign-repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await request.json().catch(() => ({}));
  if (payload.action !== "cancel") return NextResponse.json({ error: "Unsupported campaign action." }, { status: 400 });
  const access = await resolveClientWorkspaceAccess({
    propertySlug: typeof payload.propertySlug === "string" ? payload.propertySlug : null,
    requireManage: true
  });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  const campaign = await cancelScheduledCampaign({ campaignId: (await params).id, propertyId: access.propertyId, actorEmail: access.user.username });
  if (!campaign) return NextResponse.json({ error: "Scheduled campaign was not found or can no longer be canceled." }, { status: 404 });
  return NextResponse.json({ campaign });
}
