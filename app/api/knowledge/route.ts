import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getKnowledgeWorkspaceSummary, getWebsiteKnowledgeBase } from "@/lib/services/website-knowledge-service";
import { writeKnowledgeSettings } from "@/lib/repositories/knowledge-repository";
import { getKnowledgeGovernanceSummary } from "@/lib/repositories/knowledge-content-repository";
import { getKnowledgeVerificationReadiness } from "@/lib/repositories/knowledge-verification-repository";
import { getDb } from "@/lib/db";

export async function GET() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const propertySlug = await getCurrentWorkspaceSlug();
  const summary = await getKnowledgeWorkspaceSummary(propertySlug);
  const governance = await getKnowledgeGovernanceSummary(propertySlug);
  const db = getDb();
  const property = db ? await db.property.findUnique({ where: { slug: propertySlug }, select: { organization: { select: { botProfile: { select: { category: true, kbGateVersion: true } } } } } }) : null;
  const rawCategory = property?.organization?.botProfile?.category || "BUSINESS_AI";
  const category = rawCategory === "PINGBOOK" ? "APPOINTMENTS" : rawCategory === "STAY" ? "HOSPITALITY" : rawCategory;
  const verification = governance.propertyId ? await getKnowledgeVerificationReadiness(governance.propertyId, category) : null;
  return NextResponse.json({ ...summary, ...governance, verification, kbGateEnabled: Boolean(property?.organization?.botProfile?.kbGateVersion), propertySlug, canManage: canManageWorkspace(access.role) });
}

export async function PATCH(request: Request) {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });

  const propertySlug = await getCurrentWorkspaceSlug();
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  try {
    const settings = await writeKnowledgeSettings(propertySlug, {
      sourceUrl: typeof payload?.sourceUrl === "string" ? payload.sourceUrl : undefined,
      approvedForAi: typeof payload?.approvedForAi === "boolean" ? payload.approvedForAi : undefined,
      autoRefreshHours: typeof payload?.autoRefreshHours === "number" ? payload.autoRefreshHours : undefined,
      customInstructions: typeof payload?.customInstructions === "string" ? payload.customInstructions : undefined,
      handoffTopics: Array.isArray(payload?.handoffTopics) ? payload.handoffTopics.map(String) : undefined,
      status: typeof payload?.sourceUrl === "string" ? "DRAFT" : undefined
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save knowledge settings." }, { status: 400 });
  }
}

export async function POST() {
  const access = await getCurrentClientAccess();
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(access.role)) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });

  const propertySlug = await getCurrentWorkspaceSlug();
  try {
    const knowledgeBase = await getWebsiteKnowledgeBase(propertySlug, true);
    const summary = await getKnowledgeWorkspaceSummary(propertySlug);
    return NextResponse.json({ ok: true, ...summary, pagesSynced: knowledgeBase.pages.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Knowledge sync failed." }, { status: 502 });
  }
}
