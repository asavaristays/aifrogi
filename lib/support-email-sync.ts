import "server-only";
import { getDb } from "@/lib/db";
import { addSupportTicketMessage, getSupportTicketByReference } from "@/lib/repositories/support-repository";
import { loadBookingMailbox } from "@/lib/services/mailbox-service";
import { containsUnsafeSupportSecret } from "@/lib/support-policy";

function senderAddress(value: string) {
  return (value.match(/<([^>]+)>/)?.[1] || value).trim().toLowerCase();
}
function replyBody(value: string) {
  const markers = [/^On .+wrote:$/im, /^From:\s/im, /^-{2,}\s*Original Message\s*-{2,}$/im, /^Open support:/im];
  let end = value.length;
  for (const marker of markers) { const match = marker.exec(value); if (match && match.index < end) end = match.index; }
  return value.slice(0, end).replace(/^>.*$/gm, "").trim().slice(0, 5000);
}

export async function importSupportEmailReplies() {
  const db = getDb();
  if (!db) return { checked: 0, imported: 0, rejected: 0 };
  const mailbox = await loadBookingMailbox(80);
  let imported = 0, rejected = 0;
  const inbox = mailbox.messages.filter((message) => message.folder === "inbox");
  for (const message of inbox) {
    const reference = message.subject.match(/\[(LOS-\d{8}-[A-Z0-9]+)\]/i)?.[1]?.toUpperCase();
    if (!reference) continue;
    const ticket = await getSupportTicketByReference(reference);
    if (!ticket) continue;
    const sourceId = `${ticket.id}:email:${message.id}`;
    if (await db.platformAuditLog.findFirst({ where: { action: "SUPPORT_EMAIL_REPLY_IMPORTED", targetId: sourceId } })) continue;
    const email = senderAddress(message.from);
    const member = await db.organizationMember.findFirst({ where: { organizationId: ticket.organizationId, email: { equals: email, mode: "insensitive" }, status: "ACTIVE" } });
    const authorized = email === ticket.organization.ownerEmail.toLowerCase() || Boolean(member);
    const body = replyBody(message.body);
    if (!authorized || !body || containsUnsafeSupportSecret(body)) {
      rejected += 1;
      await db.platformAuditLog.create({ data: { organizationId: ticket.organizationId, actorEmail: email || "unknown", actorRole: "EMAIL", action: "SUPPORT_EMAIL_REPLY_REJECTED", targetType: "SupportTicket", targetId: sourceId, summary: `${reference} email reply rejected`, metadata: { authorized, hasBody: Boolean(body), unsafeSecret: containsUnsafeSupportSecret(body) } } });
      continue;
    }
    await addSupportTicketMessage({ ticketId: ticket.id, authorEmail: email, authorRole: "CUSTOMER_EMAIL", body });
    await db.platformAuditLog.create({ data: { organizationId: ticket.organizationId, actorEmail: email, actorRole: "CUSTOMER", action: "SUPPORT_EMAIL_REPLY_IMPORTED", targetType: "SupportTicket", targetId: sourceId, summary: `${reference} email reply imported`, metadata: { mailboxMessageId: message.id } } });
    imported += 1;
  }
  return { checked: inbox.length, imported, rejected };
}
