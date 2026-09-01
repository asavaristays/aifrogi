import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import { addSupportTicketMessage, createSupportTicket, getSupportTicket, listSupportTickets, updateSupportTicket } from "@/lib/repositories/support-repository";
import { logSupportDataAccess } from "@/lib/support-access";
import { sendSupportTicketMail } from "@/lib/support-mail";
import { containsUnsafeSupportSecret, structuredResolution, SUPPORT_STATUSES, supportSlaState } from "@/lib/support-policy";

const categories = new Set(["AI_BOT", "KNOWLEDGE", "CONNECTOR", "ONBOARDING", "BILLING", "ACCOUNT", "WHATSAPP", "OTHER"]);
const priorities = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);
const statuses = new Set<string>(SUPPORT_STATUSES);
const supportEmail = process.env.BOOKING_INBOX_EMAIL?.trim() || "info@aifrogi.com";

async function getAccess() {
  const user = await getCurrentUser();
  if (!user) return { user: null, organization: null };
  return { user, organization: user.role === "admin" ? null : await getOrganizationForMember(user.username) };
}
function clean(value: unknown, max: number) { return String(value || "").trim().slice(0, max); }
function serialize<T extends { priority: string; status: string; createdAt: Date; updatedAt: Date }>(ticket: T) { return { ...ticket, sla: supportSlaState(ticket) }; }
async function notify(input: Parameters<typeof sendSupportTicketMail>[0]) {
  try { await sendSupportTicketMail(input); } catch (error) { console.error("Support email notification failed", error instanceof Error ? error.message : "Unknown error"); }
}

export async function GET() {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && !organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const tickets = await listSupportTickets({ organizationId: organization?.id, includeMessages: user.role !== "admin" });
  return NextResponse.json({ tickets: tickets.map(serialize) });
}

export async function POST(request: Request) {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const organizationId = user.role === "admin" ? clean(payload?.organizationId, 100) : organization?.id;
  const subject = clean(payload?.subject, 160), description = clean(payload?.description, 5000);
  const category = clean(payload?.category || "OTHER", 30).toUpperCase(), priority = clean(payload?.priority || "NORMAL", 20).toUpperCase();
  if (!organizationId || !subject || !description) return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
  if (!categories.has(category) || !priorities.has(priority)) return NextResponse.json({ error: "Select a valid category and priority" }, { status: 400 });
  if (containsUnsafeSupportSecret(`${subject}\n${description}`)) return NextResponse.json({ error: "Remove passwords, OTPs, API keys, tokens, or card details before sending." }, { status: 400 });
  const ticket = await createSupportTicket({ organizationId, subject, description, category, priority, createdByEmail: user.username });
  if (!ticket) return NextResponse.json({ error: "Support service unavailable" }, { status: 503 });
  await Promise.all([
    notify({ to: supportEmail, reference: ticket.reference, subject, heading: `New ${priority.toLowerCase()} support request`, body: `${ticket.organization.name}\n${category.replaceAll("_", " ")}\n\n${description}` }),
    notify({ to: ticket.organization.ownerEmail, reference: ticket.reference, subject, heading: "Your support request is open", body: `We received your request and will respond within the ${priority.toLowerCase()} priority service window.` })
  ]);
  return NextResponse.json({ ticket: serialize(ticket) }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const ticketId = clean(payload?.ticketId, 100), ticket = ticketId ? await getSupportTicket(ticketId) : null;
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (user.role !== "admin" && ticket.organizationId !== organization?.id) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const message = clean(payload?.message, 5000);
  if (message) {
    if (containsUnsafeSupportSecret(message)) return NextResponse.json({ error: "Remove passwords, OTPs, API keys, tokens, or card details before sending." }, { status: 400 });
    if (user.role === "admin") await logSupportDataAccess({ organizationId: ticket.organizationId, actorEmail: user.username, scope: "CONVERSATIONS", targetType: "SUPPORT_TICKET", targetId: ticket.id, granted: true, summary: "Support replied to content explicitly submitted in this ticket; other client data remains access-controlled." });
    const updated = await addSupportTicketMessage({ ticketId, authorEmail: user.username, authorRole: user.role === "admin" ? "ADMIN" : "CUSTOMER", body: message });
    if (!updated) return NextResponse.json({ error: "Support service unavailable" }, { status: 503 });
    await notify({ to: user.role === "admin" ? ticket.organization.ownerEmail : supportEmail, reference: ticket.reference, subject: ticket.subject, heading: user.role === "admin" ? "AiFrogi Support replied" : "Customer replied", body: message });
    return NextResponse.json({ ticket: serialize(updated) });
  }
  const action = clean(payload?.action, 30).toUpperCase();
  if (user.role !== "admin") {
    const nextStatus = action === "CONFIRM_RESOLUTION" && ticket.status === "RESOLVED" ? "CLOSED" : action === "REOPEN" && ["RESOLVED", "CLOSED"].includes(ticket.status) ? "OPEN" : null;
    if (!nextStatus) return NextResponse.json({ error: "Add a reply, confirm the resolution, or reopen the ticket." }, { status: 400 });
    const updated = await updateSupportTicket({ ticketId, status: nextStatus, assignedToEmail: ticket.assignedToEmail, resolution: ticket.resolution });
    if (!updated) return NextResponse.json({ error: "Support service unavailable" }, { status: 503 });
    await notify({ to: supportEmail, reference: ticket.reference, subject: ticket.subject, heading: nextStatus === "CLOSED" ? "Customer confirmed resolution" : "Customer reopened ticket", body: `${ticket.organization.name} changed the ticket to ${nextStatus.replaceAll("_", " ")}.` });
    return NextResponse.json({ ticket: serialize(updated) });
  }
  const requested = clean(payload?.status, 30).toUpperCase();
  const status = requested === "IN_PROGRESS" ? "INVESTIGATING" : requested === "WAITING_FOR_CUSTOMER" ? "WAITING_FOR_CLIENT" : requested;
  if (!statuses.has(status)) return NextResponse.json({ error: "Select a valid status" }, { status: 400 });
  let resolution: string | null = clean(payload?.resolution, 5000) || null;
  if (status === "RESOLVED") {
    const fields = { cause: clean(payload?.cause, 1200), action: clean(payload?.actionTaken, 1200), verification: clean(payload?.verification, 1200), prevention: clean(payload?.prevention, 1200) };
    if (Object.values(fields).some((value) => !value)) return NextResponse.json({ error: "Cause, action taken, verification evidence, and prevention are required to resolve a ticket." }, { status: 400 });
    resolution = structuredResolution(fields);
  }
  const updated = await updateSupportTicket({ ticketId, status, assignedToEmail: clean(payload?.assignedToEmail || user.username, 180), resolution });
  if (!updated) return NextResponse.json({ error: "Support service unavailable" }, { status: 503 });
  await notify({ to: ticket.organization.ownerEmail, reference: ticket.reference, subject: ticket.subject, heading: status === "RESOLVED" ? "Resolution ready for confirmation" : `Support status: ${status.replaceAll("_", " ")}`, body: resolution || `Your request is now ${status.replaceAll("_", " ").toLowerCase()}.` });
  return NextResponse.json({ ticket: serialize(updated) });
}
