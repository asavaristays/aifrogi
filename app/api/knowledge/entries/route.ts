import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { createKnowledgeEntry, reviewKnowledgeEntry } from "@/lib/repositories/knowledge-content-repository";

async function context() {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role)) return null;
  const property = await getPropertyBySlug(await getCurrentWorkspaceSlug());
  return property ? { access, property } : null;
}

export async function POST(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { question?: string; answer?: string; category?: string; gapId?: string } | null;
  try {
    const entry = await createKnowledgeEntry({ propertyId: current.property.id, question: payload?.question || "", answer: payload?.answer || "", category: payload?.category || "General", gapId: payload?.gapId, createdBy: current.access.user.username });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save this answer." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { id?: string; action?: "APPROVE" | "REJECT" | "DELETE"; confirmConflict?: boolean } | null;
  try {
    const entry = await reviewKnowledgeEntry({ propertyId: current.property.id, id: payload?.id || "", action: payload?.action || "REJECT", actorEmail: current.access.user.username, confirmConflict: payload?.confirmConflict });
    return NextResponse.json({ ok: true, entry });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update this answer." }, { status: 400 });
  }
}
