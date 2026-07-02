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

export async function listSupportTickets(input: { organizationId?: string; status?: string }) {
  const db = getDb();
  if (!db) return [];
  return db.supportTicket.findMany({
    where: {
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.status ? { status: input.status } : {})
    },
    include: ticketInclude,
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }]
  });
}

export async function getSupportTicket(id: string) {
  const db = getDb();
  if (!db) return null;
  return db.supportTicket.findUnique({ where: { id }, include: ticketInclude });
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
  return db.supportTicket.create({
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
}

export async function addSupportTicketMessage(input: {
  ticketId: string;
  authorEmail: string;
  authorRole: string;
  body: string;
}) {
  const db = getDb();
  if (!db) return null;
  await db.$transaction([
    db.supportTicketMessage.create({ data: input }),
    db.supportTicket.update({
      where: { id: input.ticketId },
      data: { status: input.authorRole === "ADMIN" ? "WAITING_FOR_CUSTOMER" : "OPEN" }
    })
  ]);
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
  await db.supportTicket.update({
    where: { id: input.ticketId },
    data: {
      status: input.status,
      assignedToEmail: input.assignedToEmail,
      resolution: input.resolution,
      resolvedAt: input.status === "RESOLVED" ? new Date() : null
    }
  });
  return getSupportTicket(input.ticketId);
}
