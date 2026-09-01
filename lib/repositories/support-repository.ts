import { getDb } from "@/lib/db";

const ticketInclude = {
  organization: {
    select: { id: true, name: true, slug: true, ownerEmail: true }
  },
  messages: {
    orderBy: { createdAt: "asc" as const }
  }
};

function createReference() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `LOS-${date}-${suffix}`;
}

export async function listSupportTickets(input: { organizationId?: string; status?: string; includeMessages?: boolean }) {
  const db = getDb();
  if (!db) return [];
  return db.supportTicket.findMany({
    where: {
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.status ? { status: input.status } : {})
    },
    include: input.includeMessages ? ticketInclude : { organization: ticketInclude.organization },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getSupportTicket(id: string) {
  const db = getDb();
  if (!db) return null;
  return db.supportTicket.findUnique({ where: { id }, include: ticketInclude });
}

export async function getSupportTicketByReference(reference: string) {
  const db = getDb();
  if (!db) return null;
  return db.supportTicket.findUnique({ where: { reference }, include: ticketInclude });
}

export async function createSupportTicket(input: {
  organizationId: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  createdByEmail: string;
}) {
  const db = getDb();
  if (!db) return null;
  return db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        ...input,
        reference: createReference(),
        messages: {
          create: {
            authorEmail: input.createdByEmail,
            authorRole: "CUSTOMER",
            body: input.description
          }
        }
      },
      include: ticketInclude
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.createdByEmail,
        actorRole: "CLIENT",
        action: "SUPPORT_TICKET_CREATED",
        targetType: "SupportTicket",
        targetId: ticket.id,
        summary: `${ticket.reference} created: ${ticket.subject}`,
        metadata: { category: ticket.category, priority: ticket.priority }
      }
    });
    return ticket;
  });
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  authorEmail: string;
  authorRole: string;
  body: string;
}) {
  const db = getDb();
  if (!db) return null;
  await db.$transaction(async (tx) => {
    const message = await tx.supportTicketMessage.create({ data: input });
    const ticket = await tx.supportTicket.update({
      where: { id: input.ticketId },
      data: { status: input.authorRole === "ADMIN" ? "WAITING_FOR_CLIENT" : "OPEN" }
    });
    await tx.platformAuditLog.create({
      data: {
        organizationId: ticket.organizationId,
        actorEmail: input.authorEmail,
        actorRole: input.authorRole,
        action: "SUPPORT_TICKET_REPLY_ADDED",
        targetType: "SupportTicket",
        targetId: ticket.id,
        summary: `${ticket.reference} received a ${input.authorRole.toLowerCase()} reply`,
        metadata: { messageId: message.id }
      }
    });
  });
  return getSupportTicket(input.ticketId);
}

export async function updateSupportTicket(input: {
  ticketId: string;
  status: string;
  assignedToEmail?: string | null;
  resolution?: string | null;
}) {
  const db = getDb();
  if (!db) return null;
  await db.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.update({
      where: { id: input.ticketId },
      data: {
        status: input.status,
        assignedToEmail: input.assignedToEmail,
        resolution: input.resolution,
        resolvedAt: input.status === "RESOLVED" ? new Date() : null
      }
    });
    await tx.platformAuditLog.create({ data: { organizationId: ticket.organizationId, actorEmail: input.assignedToEmail || "system@aifrogi.com", actorRole: "SUPPORT", action: `SUPPORT_TICKET_${input.status}`, targetType: "SupportTicket", targetId: ticket.id, summary: `${ticket.reference} changed to ${input.status.replaceAll("_", " ")}`, metadata: { hasResolution: Boolean(input.resolution) } } });
  });
  return getSupportTicket(input.ticketId);
}
