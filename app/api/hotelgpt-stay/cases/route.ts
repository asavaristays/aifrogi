import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getDb } from "@/lib/db";
import { hasTrustedSameOrigin } from "@/lib/security/request-origin";

const DEPARTMENT_PREFIX = "In-stay department: ";
const OWNER_PREFIX = "In-stay owner: ";
const DEPARTMENTS = ["Front Desk", "Housekeeping", "Food & Beverage", "Maintenance", "Safari & Experiences"] as const;

function inferredDepartment(message: string) {
  const value = message.toLowerCase();
  if (/tap|water|electric|light|repair|broken|maintenance|ac\b|air condition/.test(value)) return "Maintenance";
  if (/towel|linen|clean|housekeep|toilet|room service/.test(value)) return "Housekeeping";
  if (/food|breakfast|lunch|dinner|restaurant|drink|tea|coffee/.test(value)) return "Food & Beverage";
  if (/safari|experience|tour|activity|pickup|transport|taxi/.test(value)) return "Safari & Experiences";
  return "Front Desk";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const access = await resolveClientWorkspaceAccess({ propertySlug: url.searchParams.get("propertySlug") });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `in-stay-cases:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const leads = await db.lead.findMany({ where: { propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " } }, include: { messages: { orderBy: { sentAt: "asc" }, take: 50 }, tags: { select: { value: true } } }, orderBy: { lastActivityAt: "desc" }, take: 200 });
    const slaMinutes = Math.min(1440, Math.max(5, Math.round(access.organization.botProfile?.responseSlaMinutes || 60)));
    const reminderPercent = Math.min(90, Math.max(10, Math.round(access.organization.botProfile?.reminderPercent || 50)));
    const now = Date.now();
    const cases = leads.map(lead => {
      const latestMessage = lead.messages.at(-1)?.body || "";
      const department = lead.tags.find(tag => tag.value.startsWith(DEPARTMENT_PREFIX))?.value.slice(DEPARTMENT_PREFIX.length) || inferredDepartment(latestMessage);
      const owner = lead.tags.find(tag => tag.value.startsWith(OWNER_PREFIX))?.value.slice(OWNER_PREFIX.length) || null;
      const receivedAt = lead.createdAt;
      const ageMinutes = Math.max(0, Math.floor((now - receivedAt.getTime()) / 60000));
      const status = lead.stage === "BOOKED" ? "RESOLVED" : lead.stage === "CONTACTED" ? "IN_PROGRESS" : "NEW";
      const slaState = status === "RESOLVED" ? "MET" : ageMinutes >= slaMinutes ? "OVERDUE" : ageMinutes >= slaMinutes * reminderPercent / 100 ? "DUE_SOON" : "ON_TRACK";
      return { id: lead.id, guestName: lead.name, room: lead.stayLabel.replace("In-stay · Room ", ""), phone: lead.phone, kind: lead.intent === "IN_STAY_COMPLAINT" ? "COMPLAINT" : "QUERY", status, priority: lead.isHighPriority ? "URGENT" : "NORMAL", feedback: lead.tags.find(tag => tag.value.startsWith("In-stay feedback:"))?.value.replace("In-stay feedback: ", "") || null, department, owner, slaState, ageMinutes, dueAt: new Date(receivedAt.getTime() + slaMinutes * 60000).toISOString(), lastActivityAt: lead.lastActivityAt.toISOString(), latestMessage };
    });
    return NextResponse.json({ cases, metrics: { total: cases.length, queries: cases.filter(item => item.kind === "QUERY").length, complaints: cases.filter(item => item.kind === "COMPLAINT").length, open: cases.filter(item => item.status !== "RESOLVED").length, unassigned: cases.filter(item => item.status !== "RESOLVED" && !item.owner).length, overdue: cases.filter(item => item.status !== "RESOLVED" && item.slaState === "OVERDUE").length, resolved: cases.filter(item => item.status === "RESOLVED").length, urgent: cases.filter(item => item.priority === "URGENT" && item.status !== "RESOLVED").length }, slaMinutes }, { headers: { "Cache-Control": "private, no-store" } });
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { propertySlug?: string; caseId?: string; action?: string; department?: string } | null;
  const access = await resolveClientWorkspaceAccess({ propertySlug: body?.propertySlug });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.role === "VIEWER") return NextResponse.json({ error: "A front desk agent, admin or owner is required for this action." }, { status: 403 });
  if (!hasTrustedSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `in-stay-case-update:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const action = body?.action;
    const stage = action === "RESOLVE" ? "BOOKED" : action === "START" ? "CONTACTED" : action === "REOPEN" ? "NEW" : null;
    const department = String(body?.department || "").trim();
    if (!stage && action !== "TAKE" && action !== "ASSIGN_DEPARTMENT") return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (action === "ASSIGN_DEPARTMENT" && !DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number])) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
    const caseId = String(body?.caseId || "");
    const updated = await db.lead.updateMany({ where: { id: caseId, propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " } }, data: stage ? { stage, lastActivityAt: new Date() } : {} });
    if (!updated.count) return NextResponse.json({ error: "In-stay case not found" }, { status: 404 });
    if (action === "START" || action === "TAKE") {
      await db.leadTag.deleteMany({ where: { leadId: caseId, value: { startsWith: OWNER_PREFIX } } });
      await db.leadTag.create({ data: { leadId: caseId, value: `${OWNER_PREFIX}${access.user.username}` } });
    }
    if (action === "ASSIGN_DEPARTMENT") {
      await db.leadTag.deleteMany({ where: { leadId: caseId, value: { startsWith: DEPARTMENT_PREFIX } } });
      await db.leadTag.create({ data: { leadId: caseId, value: `${DEPARTMENT_PREFIX}${department}` } });
    }
    return NextResponse.json({ ok: true });
  });
}
