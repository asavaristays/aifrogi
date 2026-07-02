import { NextResponse } from "next/server";
import { appendLeadMessage, loadLead } from "@/lib/services/lead-service";
import { getCurrentWorkspaceSlug } from "@/lib/workspace";

const allowedSenders = new Set(["GUEST", "AGENT", "AI"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const [lead, propertySlug] = await Promise.all([loadLead(id), getCurrentWorkspaceSlug()]);
  if (!lead || lead.propertySlug !== propertySlug) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const payload = await request.json().catch(() => null);
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
