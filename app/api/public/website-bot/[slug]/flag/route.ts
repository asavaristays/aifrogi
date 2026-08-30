import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { flagKnowledgeAnswer } from "@/lib/repositories/knowledge-verification-repository";
import { hashWebsiteVisitorValue, verifyWebsiteVisitorToken } from "@/lib/website-visitor-session";

const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const authorization = request.headers.get("authorization") || "";
  const rawToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  const token = verifyWebsiteVisitorToken(rawToken, slug);
  if (!token) return NextResponse.json({ error: "Visitor session is invalid or expired." }, { status: 401, headers });
  const payload = await request.json().catch(() => null) as { evidenceId?: string; reason?: string } | null;
  if (!payload?.evidenceId) return NextResponse.json({ error: "Answer evidence is required." }, { status: 400, headers });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Review service is unavailable." }, { status: 503, headers });
  const session = await db.websiteVisitorSession.findFirst({ where: { property: { slug }, leadId: token.leadId, capabilityHash: hashWebsiteVisitorValue(rawToken), revokedAt: null, expiresAt: { gt: new Date() } }, select: { propertyId: true } });
  if (!session) return NextResponse.json({ error: "Visitor session is invalid or closed." }, { status: 401, headers });
  const evidence = await db.sovereignAnswerEvidence.findFirst({ where: { id: payload.evidenceId, propertyId: session.propertyId, leadId: token.leadId }, select: { id: true, knowledgeClaimIds: true } });
  if (!evidence) return NextResponse.json({ error: "This answer does not belong to the active conversation." }, { status: 404, headers });
  const claimIds = [...new Set(evidence.knowledgeClaimIds)];
  const created = claimIds.length
    ? await Promise.all(claimIds.map((entryId) => flagKnowledgeAnswer({ propertyId: session.propertyId, entryId, evidenceId: evidence.id, reporterType: "WEBSITE_VISITOR", reporterId: token.leadId, reason: payload.reason || "Visitor reported this answer as incorrect." })))
    : [await flagKnowledgeAnswer({ propertyId: session.propertyId, evidenceId: evidence.id, reporterType: "WEBSITE_VISITOR", reporterId: token.leadId, reason: payload.reason || "Visitor reported this answer as incorrect." })];
  return NextResponse.json({ ok: true, flagged: created.length, message: "The answer has been paused for review where applicable. Our team can correct the approved fact without removing the bot." }, { status: 201, headers });
}
