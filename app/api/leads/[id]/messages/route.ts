import { NextResponse } from "next/server";
import { appendLeadMessage, loadLead } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getDb } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-server";
import { getCurrentClientAccess } from "@/lib/client-access";
import { websiteHandoverOperationId } from "@/lib/website-handover";

const allowedSenders = new Set(["GUEST", "AGENT", "AI"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const access = user.role === "admin" ? null : await getCurrentClientAccess();
  if (user.role !== "admin" && (!access || access.membership?.status !== "ACTIVE" || !["OWNER", "ADMIN", "AGENT"].includes(access.role))) return NextResponse.json({ error: "Operator access required" }, { status: 403 });
  const [lead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);
  if (!lead || lead.propertySlug !== propertySlug || (access && !access.organization.properties.some((p) => p.slug === lead.propertySlug))) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const payload = await request.json().catch(() => null);
  if (payload?.action === "RESUME_WEBSITE_AI") {
    if (["BOOKED", "WON", "LOST"].includes(lead.stage)) return NextResponse.json({ error: "This lead is completed. Start a new conversation instead." }, { status: 409 });
    if (user.role !== "admin" && !["OWNER", "ADMIN"].includes(access?.role || "")) return NextResponse.json({ error: "Owner or admin approval is required to resume AI." }, { status: 403 });
    if (!lead.tags.includes("Website Bot")) return NextResponse.json({ error: "Not a website conversation" }, { status: 400 });
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    try {
      await db.$transaction(async tx => {
        const session = await tx.websiteVisitorSession.findUniqueOrThrow({ where: { leadId: id } });
        const lock = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`${propertySlug}:${session.sessionIdHash}`}, 0)) AS acquired`;
        if (!lock[0]?.acquired || session.revokedAt || session.expiresAt <= new Date()) throw new Error("Session unavailable");
        await tx.websiteVisitorSession.update({ where: { leadId: id }, data: { status: "AI_READY", resolutionState: { aiResumedAt: new Date().toISOString() } } });
        await tx.leadTag.deleteMany({ where: { leadId: id, value: { in: ["resolved", "closed"], mode: "insensitive" } } });
        await tx.aiOperation.updateMany({ where: { id: websiteHandoverOperationId(session.propertyId, id) }, data: { status: "COMPLETED", outcomeType: "RESOLVED", outcomeEvidence: `AI resumed by ${user.username}`, completedAt: new Date() } });
        await tx.platformAuditLog.create({ data: { actorEmail: user.username, actorRole: user.role, action: "WEBSITE_AI_RESUMED", targetType: "LEAD", targetId: id, summary: "Owner/admin explicitly resumed AI; prior handover completed." } });
      });
      return NextResponse.json({ resumed: true });
    } catch { return NextResponse.json({ error: "Session is busy, revoked or expired. Refresh and retry." }, { status: 409 }); }
  }
  if (payload?.action === "CLOSE_WEBSITE_CONVERSATION") {
    if (!lead.tags.includes("Website Bot")) return NextResponse.json({ error: "This is not a website conversation" }, { status: 400 });
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    try { await db.$transaction(async (tx) => {
      const session = await tx.websiteVisitorSession.findUniqueOrThrow({ where: { leadId: id } });
      const lock = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`${propertySlug}:${session.sessionIdHash}`}, 0)) AS acquired`;
      if (!lock[0]?.acquired) throw new Error("Conversation update in progress; retry shortly");
      if (!lead.tags.some((tag) => ["resolved", "closed"].includes(tag.toLowerCase()))) await tx.leadTag.create({ data: { leadId: id, value: "Resolved" } });
      // Closed means read-only until the existing capability expires, not revoked.
      await tx.websiteVisitorSession.updateMany({ where: { leadId: id, revokedAt: null }, data: { status: "CLOSED" } });
      await tx.aiOperation.updateMany({ where: { leadId: id, kind: "HUMAN_REVIEW", createdBy: "website-visitor", status: { in: ["OPEN", "IN_PROGRESS"] } }, data: { status: "COMPLETED", outcomeType: "RESOLVED", outcomeEvidence: `Conversation closed by ${user.username}`, completedAt: new Date() } });
      await tx.platformAuditLog.create({ data: { actorEmail: user.username, actorRole: user.role, action: "WEBSITE_CONVERSATION_CLOSED", targetType: "LEAD", targetId: id, summary: "Operator closed conversation; final replies remain readable until visitor session expiry." } });
    }); } catch { return NextResponse.json({ error: "Conversation is busy or unavailable. Please retry." }, { status: 409 }); }
    return NextResponse.json({ closed: true });
  }
  const sender = typeof payload?.sender === "string" ? payload.sender : "AGENT";
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";

  if (!allowedSenders.has(sender)) {
    return NextResponse.json({ error: "Invalid sender" }, { status: 400 });
  }

  if (!body) {
    return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
  }
  if (lead.tags.includes("Website Bot")) {
    if (sender !== "AGENT") return NextResponse.json({ error: "Website operators may send only human replies" }, { status: 400 });
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    try {
      await db.$transaction(async (tx) => {
        const currentSession = await tx.websiteVisitorSession.findUniqueOrThrow({ where: { leadId: id } });
        const lock = await tx.$queryRaw<Array<{ acquired: boolean }>>`SELECT pg_try_advisory_xact_lock(hashtextextended(${`${propertySlug}:${currentSession.sessionIdHash}`}, 0)) AS acquired`;
        if (!lock[0]?.acquired) throw new Error("Conversation update in progress; retry shortly");
        const claimed = await tx.websiteVisitorSession.updateMany({ where: { leadId: id, revokedAt: null, status: { not: "CLOSED" }, expiresAt: { gt: new Date() } }, data: { status: "HUMAN_JOINED" } });
        if (!claimed.count) throw new Error("Conversation is closed or expired");
        await tx.leadMessage.create({ data: { leadId: id, sender: "AGENT", body: body.slice(0, 5000), sentAt: new Date() } });
        await tx.lead.update({ where: { id }, data: { lastActivityAt: new Date() } });
        const session = await tx.websiteVisitorSession.findUniqueOrThrow({ where: { leadId: id } });
        await tx.aiOperation.updateMany({ where: { id: websiteHandoverOperationId(session.propertyId, id), status: "OPEN" }, data: { status: "IN_PROGRESS", assignedTo: user.username } });
        await tx.platformAuditLog.create({ data: { actorEmail: user.username, actorRole: user.role, action: "WEBSITE_HUMAN_REPLY", targetType: "LEAD", targetId: id, summary: "Human reply saved; AI ownership paused." } });
      });
      return NextResponse.json({ lead: await loadLead(id) });
    } catch {
      return NextResponse.json({ error: "Reply could not be saved. Check that the conversation is open and retry." }, { status: 409 });
    }
  }

  const result = await appendLeadMessage(id, {
    sender: sender as "GUEST" | "AGENT" | "AI",
    body
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: result.lead }, { status: result.status });
}
