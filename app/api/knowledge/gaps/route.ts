import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { dismissKnowledgeGap } from "@/lib/repositories/knowledge-content-repository";

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const property = await getPropertyBySlug(await getCurrentWorkspaceSlug());
  const payload = await request.json().catch(() => null) as { id?: string } | null;
  if (!property || !payload?.id) return NextResponse.json({ error: "Knowledge gap not found." }, { status: 404 });
  await dismissKnowledgeGap(property.id, payload.id);
  return NextResponse.json({ ok: true });
}
