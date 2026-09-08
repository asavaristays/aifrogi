import { getDb } from "@/lib/db";
import { websiteHandoverEmail } from "@/lib/website-handover-email";

export const WEBSITE_HANDOVER_EMAIL = "WEBSITE_HANDOVER_EMAIL";
/** Reconcile durable requests into the existing leased/retrying automation queue. */
export async function queueWebsiteHandoverNotifications(scope?: { operationId: string }) {
  const db = getDb();
  if (!db) throw new Error("Handover notification database unavailable");
  let queued = 0;
  let examined = 0;
  let cursor: string | undefined;
  for (;;) {
  const requests = await db.aiOperation.findMany({ where: { createdBy: "website-visitor", kind: "HUMAN_REVIEW", status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] }, ...(scope ? { id: scope.operationId } : cursor ? { id: { gt: cursor } } : {}) }, orderBy: { id: "asc" }, take: 250 });
  examined += requests.length;
  for (const request of requests) {
    const events = ["REQUEST", ...(request.dueAt && request.dueAt <= new Date() ? ["OVERDUE"] : [])];
    for (const event of events) {
      const cycle = request.notes?.match(/Handover cycle: ([a-f0-9-]+)/)?.[1] || "initial";
      const idempotencyKey = `website-handover:${request.id}:${cycle}:${event}`;
      await db.automationJob.upsert({ where: { idempotencyKey }, update: {}, create: {
        propertyId: request.propertyId, workflowId: "website-human-handover", triggerType: event, triggerRef: request.id,
        actionType: WEBSITE_HANDOVER_EMAIL, idempotencyKey, payload: { operationId: request.id, event, cycle }, maxAttempts: 3, createdBy: "website-handover-reconciler"
      } });
      queued++;
    }
  }
  if (requests.length < 250) break;
  cursor = requests[requests.length - 1].id;
  }
  return { examined, reconciled: queued };
}

export async function deliverWebsiteHandoverNotification(job: { propertyId: string; triggerRef: string | null; triggerType: string; payload?: unknown }, dryRun = false) {
  const db = getDb();
  if (!db) throw new Error("Handover notification database unavailable");
  const request = await db.aiOperation.findFirst({ where: { id: job.triggerRef || "", propertyId: job.propertyId, createdBy: "website-visitor", kind: "HUMAN_REVIEW" }, include: { property: { include: { organization: { include: { members: true } } } } } });
  if (!request || !["OPEN", "IN_PROGRESS", "BLOCKED"].includes(request.status)) return { skipped: true, reason: "Request no longer open" };
  const cycle = request.notes?.match(/Handover cycle: ([a-f0-9-]+)/)?.[1] || "initial";
  const payload = job.payload && typeof job.payload === "object" ? job.payload as { cycle?: string } : {};
  if ((payload.cycle || "initial") !== cycle) return { skipped: true, reason: "Superseded handover cycle" };
  const overdue = job.triggerType === "OVERDUE";
  if (overdue && (!request.dueAt || request.dueAt > new Date())) return { skipped: true, reason: "Request not overdue" };
  const org = request.property.organization;
  const recipient = overdue ? process.env.AIFROGI_ADMIN_EMAIL?.trim() || "info@aifrogi.com" : org?.members.find(m => m.status === "ACTIVE" && ["OWNER", "ADMIN"].includes(m.role) && m.email.toLowerCase() === org.ownerEmail.toLowerCase())?.email || org?.members.find(m => m.status === "ACTIVE" && ["OWNER", "ADMIN"].includes(m.role))?.email;
  if (!recipient) throw new Error("No active business owner/admin is available for handover notifications");
  if (dryRun) return { dryRun: true, event: job.triggerType, recipientConfigured: true };
  const { sendBookingMail } = await import("@/lib/services/mailbox-service");
  const sent = await sendBookingMail({ to: recipient, ...websiteHandoverEmail(overdue), smtpTimeoutMs: 20000 });
  if (sent.error || !sent.messageId) throw new Error("Handover email was not accepted by SMTP");
  return { smtpAccepted: true, inboxReceiptVerified: false, messageId: sent.messageId, event: job.triggerType };
}
