import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { getOrganizationForMember } from "@/lib/repositories/onboarding-repository";
import {
  addSupportTicketMessage,
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  updateSupportTicket
} from "@/lib/repositories/support-repository";

const categories = new Set(["ONBOARDING", "WHATSAPP", "BILLING", "CAMPAIGN", "AUTOMATION", "ACCOUNT", "OTHER"]);
const priorities = new Set(["LOW", "NORMAL", "HIGH", "URGENT"]);
const statuses = new Set(["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"]);

async function getAccess() {
  const user = await getCurrentUser();
  if (!user) return { user: null, organization: null };
  const organization = user.role === "admin" ? null : await getOrganizationForMember(user.username);
  return { user, organization };
}

export async function GET() {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin" && !organization) return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  const tickets = await listSupportTickets({ organizationId: organization?.id });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const organizationId = user.role === "admin" ? String(payload?.organizationId || "").trim() : organization?.id;
  const subject = String(payload?.subject || "").trim();
  const description = String(payload?.description || "").trim();
  const category = String(payload?.category || "OTHER").trim().toUpperCase();
  const priority = String(payload?.priority || "NORMAL").trim().toUpperCase();
  if (!organizationId || !subject || !description) {
    return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
  }
  if (!categories.has(category) || !priorities.has(priority)) {
    return NextResponse.json({ error: "Select a valid category and priority" }, { status: 400 });
  }
  const ticket = await createSupportTicket({ organizationId, subject, description, category, priority, createdByEmail: user.username });
  if (!ticket) return NextResponse.json({ error: "Support service unavailable" }, { status: 503 });
  return NextResponse.json({ ticket }, { status: 201 });
}

export async function PATCH(request: Request) {
  const { user, organization } = await getAccess();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const ticketId = String(payload?.ticketId || "").trim();
  const ticket = ticketId ? await getSupportTicket(ticketId) : null;
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (user.role !== "admin" && ticket.organizationId !== organization?.id) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const message = String(payload?.message || "").trim();
  if (message) {
    const updated = await addSupportTicketMessage({
      ticketId,
      authorEmail: user.username,
      authorRole: user.role === "admin" ? "ADMIN" : "CUSTOMER",
      body: message
    });
    return NextResponse.json({ ticket: updated });
  }

  if (user.role !== "admin") return NextResponse.json({ error: "Add a reply to update this ticket" }, { status: 400 });
  const status = String(payload?.status || "").trim().toUpperCase();
  if (!statuses.has(status)) return NextResponse.json({ error: "Select a valid status" }, { status: 400 });
  const updated = await updateSupportTicket({
    ticketId,
    status,
    assignedToEmail: String(payload?.assignedToEmail || user.username).trim(),
    resolution: String(payload?.resolution || "").trim() || null
  });
  return NextResponse.json({ ticket: updated });
}
