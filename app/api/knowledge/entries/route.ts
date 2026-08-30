import { NextResponse } from "next/server";
import { canManageWorkspace, getCurrentClientAccess } from "@/lib/client-access";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getPropertyBySlug } from "@/lib/repositories/property-repository";
import { createAtomicClaim, deleteUnpublishedClaim, fieldApproveClaim, generateClaimPreview, pauseClaim, reconfirmClaim, reviewClaimPreview } from "@/lib/repositories/knowledge-verification-repository";

async function context() {
  const access = await getCurrentClientAccess();
  if (!access || !canManageWorkspace(access.role)) return null;
  const property = await getPropertyBySlug(await getCurrentWorkspaceSlug());
  return property ? { access, property } : null;
}

export async function POST(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { question?: string; answer?: string; category?: string; gapId?: string; claimType?: string; valueType?: string; currency?: string; effectiveAt?: string; expiresAt?: string; refreshDays?: number } | null;
  try {
    const entry = await createAtomicClaim({ propertyId: current.property.id, question: payload?.question || "", answer: payload?.answer || "", category: payload?.category || "General", gapId: payload?.gapId, createdBy: current.access.user.username, claimType: payload?.claimType, valueType: payload?.valueType, currency: payload?.currency, effectiveAt: payload?.effectiveAt ? new Date(payload.effectiveAt) : null, expiresAt: payload?.expiresAt ? new Date(payload.expiresAt) : null, refreshDays: payload?.refreshDays });
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save this answer." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const current = await context();
  if (!current) return NextResponse.json({ error: "Client Admin access is required." }, { status: 403 });
  const payload = await request.json().catch(() => null) as { id?: string; previewId?: string; action?: "FIELD_APPROVE" | "GENERATE_PREVIEW" | "PREVIEW_APPROVE" | "PREVIEW_REJECT" | "PAUSE" | "RECONFIRM" | "DELETE"; supersedesId?: string; reason?: string } | null;
  try {
    const base = { propertyId: current.property.id, actorEmail: current.access.user.username };
    let result: unknown;
    if (payload?.action === "FIELD_APPROVE") result = await fieldApproveClaim({ ...base, entryId: payload.id || "", supersedesId: payload.supersedesId });
    else if (payload?.action === "GENERATE_PREVIEW") result = await generateClaimPreview({ propertyId: current.property.id, entryId: payload.id || "" });
    else if (payload?.action === "PREVIEW_APPROVE" || payload?.action === "PREVIEW_REJECT") result = await reviewClaimPreview({ ...base, previewId: payload.previewId || "", approve: payload.action === "PREVIEW_APPROVE", reason: payload.reason });
    else if (payload?.action === "PAUSE") result = await pauseClaim({ ...base, entryId: payload.id || "", reason: payload.reason || "Paused by Client Admin for review." });
    else if (payload?.action === "RECONFIRM") result = await reconfirmClaim({ ...base, entryId: payload.id || "" });
    else if (payload?.action === "DELETE") result = await deleteUnpublishedClaim({ propertyId: current.property.id, entryId: payload.id || "" });
    else throw new Error("Select a valid knowledge verification action.");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update this answer." }, { status: 400 });
  }
}
