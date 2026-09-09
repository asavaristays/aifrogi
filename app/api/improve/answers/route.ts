import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { removeImprovementItem, saveImprovementAnswer } from "@/lib/repositories/improvement-answer-repository";

async function access() { return resolveClientWorkspaceAccess({ requireManage: true }); }

export async function POST(request: Request) {
  const current = await access();
  if (!current.ok) return NextResponse.json({ error: current.error }, { status: current.status });
  const payload = await request.json().catch(() => null) as { sourceType?: "FEEDBACK" | "GAP"; sourceId?: string; question?: string; answer?: string; category?: string } | null;
  if (!payload?.sourceType || !payload.sourceId) return NextResponse.json({ error: "Select an improvement item." }, { status: 400 });
  try {
    const result = await saveImprovementAnswer({ propertyId: current.propertyId, sourceType: payload.sourceType, sourceId: payload.sourceId, question: payload.question || "", answer: payload.answer || "", category: payload.category || "General", actorEmail: current.user.username });
    return NextResponse.json({ ok: true, result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save this answer." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const current = await access();
  if (!current.ok) return NextResponse.json({ error: current.error }, { status: current.status });
  const payload = await request.json().catch(() => null) as { sourceType?: "FEEDBACK" | "GAP"; sourceId?: string; entryId?: string } | null;
  if (!payload?.sourceType || !payload.sourceId) return NextResponse.json({ error: "Select an improvement item." }, { status: 400 });
  try {
    const result = await removeImprovementItem({ propertyId: current.propertyId, sourceType: payload.sourceType, sourceId: payload.sourceId, entryId: payload.entryId, actorEmail: current.user.username });
    return NextResponse.json({ ok: true, result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not remove this item." }, { status: 400 }); }
}
