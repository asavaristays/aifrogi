import { supportSlaState } from "@/lib/support-policy";

type SupportMessage = { body: string; authorRole: string; createdAt: Date };
type SupportTicketSignal = {
  id: string;
  reference: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastActivityBy: string;
  lastClientViewedAt: Date | null;
  lastAdminViewedAt: Date | null;
  messages?: SupportMessage[];
  organization?: { name: string };
};

export type ClientSupportUpdate = {
  id: string;
  reference: string;
  subject: string;
  status: string;
  summary: string;
  action: string;
};

export type AdminSupportAction = {
  id: string;
  reference: string;
  subject: string;
  organizationName: string;
  priority: string;
  reason: string;
  overdue: boolean;
};

function latestMessage(ticket: SupportTicketSignal) {
  const message = ticket.messages?.at(-1);
  if (ticket.lastActivityBy === "ADMIN" && message?.authorRole !== "ADMIN") {
    return ticket.status === "RESOLVED" ? "A resolution is ready for your confirmation." : `Ticket status updated to ${ticket.status.replaceAll("_", " ").toLowerCase()}.`;
  }
  return message?.body.trim().replace(/\s+/g, " ").slice(0, 180) || "Open the ticket to review the latest activity.";
}

export function getClientSupportUpdates(tickets: SupportTicketSignal[]): ClientSupportUpdate[] {
  return tickets.filter((ticket) => {
    if (ticket.status === "CLOSED") return false;
    const unseenAdminActivity = ticket.lastActivityBy === "ADMIN" && (!ticket.lastClientViewedAt || ticket.updatedAt > ticket.lastClientViewedAt);
    return unseenAdminActivity || ticket.status === "WAITING_FOR_CLIENT" || ticket.status === "RESOLVED";
  }).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).map((ticket) => ({
    id: ticket.id,
    reference: ticket.reference,
    subject: ticket.subject,
    status: ticket.status,
    summary: latestMessage(ticket),
    action: ticket.status === "RESOLVED" ? "Review resolution" : ticket.status === "WAITING_FOR_CLIENT" ? "View and reply" : "View update"
  }));
}

export function getAdminSupportActions(tickets: SupportTicketSignal[]): AdminSupportAction[] {
  return tickets.filter((ticket) => {
    if (["CLOSED", "RESOLVED", "WAITING_FOR_CLIENT"].includes(ticket.status)) return false;
    const unseenClientActivity = ticket.lastActivityBy === "CUSTOMER" && (!ticket.lastAdminViewedAt || ticket.updatedAt > ticket.lastAdminViewedAt);
    const urgent = ["URGENT", "HIGH"].includes(ticket.priority);
    return unseenClientActivity || urgent || supportSlaState(ticket).resolutionOverdue;
  }).map((ticket) => {
    const overdue = supportSlaState(ticket).resolutionOverdue;
    const unseen = ticket.lastActivityBy === "CUSTOMER" && (!ticket.lastAdminViewedAt || ticket.updatedAt > ticket.lastAdminViewedAt);
    return {
      id: ticket.id,
      reference: ticket.reference,
      subject: ticket.subject,
      organizationName: ticket.organization?.name || "Client",
      priority: ticket.priority,
      reason: overdue ? "Resolution target is overdue" : unseen ? "New client activity" : `${ticket.priority.toLowerCase()} priority requires attention`,
      overdue
    };
  }).sort((a, b) => {
    const priority = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 } as Record<string, number>;
    return Number(b.overdue) - Number(a.overdue) || (priority[a.priority] ?? 4) - (priority[b.priority] ?? 4);
  });
}
