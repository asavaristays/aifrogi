import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { reviewAnswerFlag } from "@/lib/repositories/knowledge-verification-repository";
import { canPerformGovernedKnowledgeAction } from "@/lib/knowledge-authority";

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role) || !canPerformGovernedKnowledgeAction(access.role, "REVIEW_FLAG")) return NextResponse.json({ error: "Client Owner or Admin authority is required to review a knowledge flag." }, { status: 403 });
  const property = await getPropertyBySlug(await getCurrentWorkspaceSlug());
  if (!property) return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  const payload = await request.json().catch(() => null) as { id?: string; action?: "ACKNOWLEDGE" | "RESOLVE"; resolution?: string } | null;
  try {
    if (!payload?.id || !payload.action) throw new Error("Flag and review action are required.");
    const flag = await reviewAnswerFlag({ propertyId: property.id, flagId: payload.id, actorEmail: access.user.username, action: payload.action, resolution: payload.resolution });
    return NextResponse.json({ ok: true, flag });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not review this answer flag." }, { status: 400 });
  }
}
