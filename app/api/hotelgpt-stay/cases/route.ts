import { NextResponse } from "next/server";
import { resolveClientWorkspaceAccess } from "@/lib/client-access";
import { withTenantDatabaseContext } from "@/lib/security/tenant-database-context";
import { getDb } from "@/lib/db";
import { hasTrustedSameOrigin } from "@/lib/security/request-origin";
import { IN_STAY_DEPARTMENTS } from "@/lib/in-stay-access";

const DEPARTMENT_PREFIX = "In-stay department: ";
const OWNER_PREFIX = "In-stay owner: ";
const DEPARTMENTS = IN_STAY_DEPARTMENTS;

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
    const leads = await db.lead.findMany({ where: { propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " }, ...(access.department ? { tags: { some: { value: `${DEPARTMENT_PREFIX}${access.department}` } } } : {}) }, include: { messages: { orderBy: { sentAt: "asc" }, take: 50 }, tags: { select: { value: true } } }, orderBy: { lastActivityAt: "desc" }, take: 200 });
    const actionLogs = leads.length ? await db.platformAuditLog.findMany({ where: { organizationId: access.organization.id, targetType: "LEAD", targetId: { in: leads.map(item => item.id) }, action: { startsWith: "IN_STAY_" } }, select: { targetId: true, action: true, metadata: true }, orderBy: { createdAt: "desc" } }) : [];
    const latestAction = new Map<string,string>(); const completionNote = new Map<string,string>();
    for (const log of actionLogs) if (log.targetId && !latestAction.has(log.targetId)) { latestAction.set(log.targetId,log.action); const metadata=log.metadata as {note?:unknown}|null; if(log.action==="IN_STAY_COMPLETION_SUBMITTED"&&typeof metadata?.note==="string") completionNote.set(log.targetId,metadata.note); }
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
      return { id: lead.id, guestName: lead.name, room: lead.stayLabel.replace("In-stay · Room ", ""), phone: access.department ? null : lead.phone, kind: lead.intent === "IN_STAY_COMPLAINT" ? "COMPLAINT" : "QUERY", status, priority: lead.isHighPriority ? "URGENT" : "NORMAL", feedback: lead.tags.find(tag => tag.value.startsWith("In-stay feedback:"))?.value.replace("In-stay feedback: ", "") || null, department, owner, completionPending: latestAction.get(lead.id)==="IN_STAY_COMPLETION_SUBMITTED", completionNote: completionNote.get(lead.id)||null, slaState, ageMinutes, dueAt: new Date(receivedAt.getTime() + slaMinutes * 60000).toISOString(), lastActivityAt: lead.lastActivityAt.toISOString(), latestMessage };
    });
    return NextResponse.json({ cases, metrics: { total: cases.length, queries: cases.filter(item => item.kind === "QUERY").length, complaints: cases.filter(item => item.kind === "COMPLAINT").length, open: cases.filter(item => item.status !== "RESOLVED").length, unassigned: cases.filter(item => item.status !== "RESOLVED" && !item.owner).length, overdue: cases.filter(item => item.status !== "RESOLVED" && item.slaState === "OVERDUE").length, resolved: cases.filter(item => item.status === "RESOLVED").length, urgent: cases.filter(item => item.priority === "URGENT" && item.status !== "RESOLVED").length }, slaMinutes }, { headers: { "Cache-Control": "private, no-store" } });
  });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null) as { propertySlug?: string; caseId?: string; action?: string; department?: string; note?: string } | null;
  const access = await resolveClientWorkspaceAccess({ propertySlug: body?.propertySlug });
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });
  if (access.role === "VIEWER") return NextResponse.json({ error: "A front desk agent, admin or owner is required for this action." }, { status: 403 });
  if (!hasTrustedSameOrigin(request)) return NextResponse.json({ error: "Cross-origin request denied" }, { status: 403 });
  return withTenantDatabaseContext({ kind: "tenant", organizationId: access.organization.id, actor: `in-stay-case-update:${access.user.username}` }, async () => {
    const db = getDb(); if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    const action = body?.action;
    const caseId = String(body?.caseId || "");
    const existing = await db.lead.findFirst({ where: { id: caseId, propertyId: access.propertyId, stayLabel: { startsWith: "In-stay · Room " } }, include: { tags: { select: { value: true } } } });
    if (!existing) return NextResponse.json({ error: "In-stay case not found" }, { status: 404 });
    const assignedDepartment = existing.tags.find(tag => tag.value.startsWith(DEPARTMENT_PREFIX))?.value.slice(DEPARTMENT_PREFIX.length) || "Front Desk";
    if (access.department && assignedDepartment !== access.department) return NextResponse.json({ error: "This ticket is assigned to another department." }, { status: 403 });
    if (access.department && !["TAKE", "START", "ADD_NOTE", "SUBMIT_COMPLETION"].includes(String(action))) return NextResponse.json({ error: "Department staff can update work only. Front desk controls routing and guest resolution." }, { status: 403 });
    const stage = action === "RESOLVE" ? "BOOKED" : action === "START" ? "CONTACTED" : action === "REOPEN" ? "NEW" : null;
    const department = String(body?.department || "").trim();
    const note = String(body?.note || "").trim().slice(0, 1000);
    if (!stage && !["TAKE", "ASSIGN_DEPARTMENT", "ADD_NOTE", "SUBMIT_COMPLETION"].includes(String(action))) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    if (["ADD_NOTE", "SUBMIT_COMPLETION"].includes(String(action)) && note.length < 3) return NextResponse.json({ error: "Add a clear work update before submitting." }, { status: 400 });
    if (action === "ASSIGN_DEPARTMENT" && !DEPARTMENTS.includes(department as (typeof DEPARTMENTS)[number])) return NextResponse.json({ error: "Invalid department" }, { status: 400 });
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
    const auditAction = action === "SUBMIT_COMPLETION" ? "IN_STAY_COMPLETION_SUBMITTED" : `IN_STAY_CASE_${action}`;
    await db.platformAuditLog.create({ data: { organizationId: access.organization.id, actorEmail: access.user.username, actorRole: access.role, action: auditAction, targetType: "LEAD", targetId: caseId, summary: action === "SUBMIT_COMPLETION" ? `${assignedDepartment} submitted work for front-desk confirmation.` : `In-stay ticket ${String(action).toLowerCase().replaceAll("_", " ")}.`, metadata: { propertyId: access.propertyId, department: access.department || department || assignedDepartment, note: note || null } } });
    return NextResponse.json({ ok: true, completionPending: action === "SUBMIT_COMPLETION" });
  });
}
