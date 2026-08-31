import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashWebsiteVisitorValue, verifyWebsiteVisitorToken } from "@/lib/website-visitor-session";
import { encodeImprovementSignalReason, normalizeImprovementSignal } from "@/lib/improvement-signal";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const authorization = request.headers.get("authorization") || "";
  const rawToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const token = verifyWebsiteVisitorToken(rawToken, slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers });
  const payload = await request.json().catch(() => null) as { evidenceId?: string; helpful?: boolean; reason?: string } | null;
  if (!payload?.evidenceId || typeof payload.helpful !== "boolean") return NextResponse.json({ error: "Answer and feedback choice are required." }, { status: 400, headers });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Feedback service is unavailable." }, { status: 503, headers });
  const session = await db.websiteVisitorSession.findFirst({ where: { property: { slug }, leadId: token.leadId, capabilityHash: hashWebsiteVisitorValue(rawToken), revokedAt: null, expiresAt: { gt: new Date() } }, select: { propertyId: true } });
  if (!session) return NextResponse.json({ error: "Visitor session is invalid or closed." }, { status: 401, headers });
  const evidence = await db.sovereignAnswerEvidence.findFirst({ where: { id: payload.evidenceId, propertyId: session.propertyId, leadId: token.leadId }, select: { id: true } });
  if (!evidence) return NextResponse.json({ error: "This answer does not belong to the active conversation." }, { status: 404, headers });
  const signal = payload.helpful ? null : normalizeImprovementSignal({ propertyId: session.propertyId, type: "NEGATIVE_FEEDBACK", text: payload.reason });
  const storedReason = signal ? encodeImprovementSignalReason(signal, payload.reason) : payload.reason?.trim().slice(0, 1000) || null;
  const feedback = await db.sovereignAnswerFeedback.upsert({
    where: { evidenceId: evidence.id },
    create: { propertyId: session.propertyId, evidenceId: evidence.id, leadId: token.leadId, helpful: payload.helpful, reason: storedReason },
    update: { helpful: payload.helpful, reason: storedReason }
  });
  return NextResponse.json({ ok: true, helpful: feedback.helpful, message: feedback.helpful ? "Thank you. This helps us verify answer quality." : "Thank you. This answer is now part of the review dataset. You can request human help or explicitly flag an incorrect fact." }, { headers });
}
