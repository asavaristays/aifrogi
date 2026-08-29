import { NextResponse } from "next/server";
import { appendLeadMessage, loadLead } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";
import { getDb } from "@/lib/db";

const allowedSenders = new Set(["GUEST", "AGENT", "AI"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [lead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);
  if (!lead || lead.propertySlug !== propertySlug) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const payload = await request.json().catch(() => null);
  if (payload?.action === "CLOSE_WEBSITE_CONVERSATION") {
    if (!lead.tags.includes("Website Bot")) return NextResponse.json({ error: "This is not a website conversation" }, { status: 400 });
    const db = getDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    if (!lead.tags.some((tag) => ["resolved", "closed"].includes(tag.toLowerCase()))) {
      await db.leadTag.create({ data: { leadId: id, value: "Resolved" } });
    }
    await db.websiteVisitorSession.updateMany({ where: { leadId: id, revokedAt: null }, data: { status: "CLOSED", revokedAt: new Date() } });
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

  const result = await appendLeadMessage(id, {
    sender: sender as "GUEST" | "AGENT" | "AI",
    body
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ lead: result.lead }, { status: result.status });
}
