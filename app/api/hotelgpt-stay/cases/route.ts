import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getDb } from "@/lib/db";
import { hasTrustedSameOrigin } from "@/lib/security/request-origin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await resolveClientWorkspaceAccess({ propertySlug: url.searchParams.get("propertySlug") });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `in-stay-cases:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const leads = await db.lead.findMany({ where: { propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " } }, include: { messages: { orderBy: { sentAt: "asc" }, take: 50 }, tags: { select: { value: true } } }, orderBy: { lastActivityAt: "desc" }, take: 200 });
    const cases = leads.map(lead => ({ id: lead.id, guestName: lead.name, room: lead.stayLabel.replace("In-stay · Room ", ""), phone: lead.phone, kind: lead.intent === "IN_STAY_COMPLAINT" ? "COMPLAINT" : "QUERY", status: lead.stage === "BOOKED" ? "RESOLVED" : lead.stage === "CONTACTED" ? "IN_PROGRESS" : "NEW", priority: lead.isHighPriority ? "URGENT" : "NORMAL", feedback: lead.tags.find(tag => tag.value.startsWith("In-stay feedback:"))?.value.replace("In-stay feedback: ", "") || null, lastActivityAt: lead.lastActivityAt.toISOString(), latestMessage: lead.messages.at(-1)?.body || "" }));
    return NextResponse.json({ cases, metrics: { total: cases.length, queries: cases.filter(item => item.kind === "QUERY").length, complaints: cases.filter(item => item.kind === "COMPLAINT").length, open: cases.filter(item => item.status !== "RESOLVED").length, resolved: cases.filter(item => item.status === "RESOLVED").length, urgent: cases.filter(item => item.priority === "URGENT" && item.status !== "RESOLVED").length } }, { headers: { "Cache-Control": "private, no-store" } });
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { propertySlug?: string; caseId?: string; action?: string } | null;
  const access = await resolveClientWorkspaceAccess({ propertySlug: body?.propertySlug, requireManage: true });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (!hasTrustedSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `in-stay-case-update:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const stage = body?.action === "RESOLVE" ? "BOOKED" : body?.action === "START" ? "CONTACTED" : body?.action === "REOPEN" ? "NEW" : null;
    if (!stage) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    const updated = await db.lead.updateMany({ where: { id: String(body?.caseId || ""), propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " } }, data: { stage, lastActivityAt: new Date() } });
    if (!updated.count) return NextResponse.json({ error: "In-stay case not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  });
}
