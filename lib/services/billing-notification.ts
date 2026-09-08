import { getDb } from "@/lib/db";
import { billingEmail, type BillingEmailEvent } from "@/lib/billing-email-template";
import { sendBookingMail } from "@/lib/services/mailbox-service";

const BILLING_NOTIFICATION_EMAIL = "BILLING_NOTIFICATION_EMAIL";

async function send(input: { organizationId: string; targetId: string; actorEmail: string; event: BillingEmailEvent; description: string; value: string; reference?: string | null; validity?: Date | null }) {
  const db = getDb();
  if (!db) throw new Error("Billing notification database unavailable.");
  const organization = await db.organization.findUnique({ where: { id: input.organizationId }, select: { ownerEmail: true, ownerName: true, name: true } });
  if (!organization) throw new Error("Billing notification customer unavailable.");
  const result = await sendBookingMail({ to: organization.ownerEmail, ...billingEmail({ event: input.event, ownerName: organization.ownerName, businessName: organization.name, description: input.description, value: input.value, reference: input.reference, validity: input.validity }), smtpTimeoutMs: 20000 });
  if (result.error || !result.messageId) throw new Error(result.error || "SMTP did not accept the billing notification.");
  return { accepted: true, messageId: result.messageId };
}

export async function deliverQueuedBillingNotification(payload: Record<string, unknown>) {
  return send({ organizationId: String(payload.organizationId), targetId: String(payload.targetId), actorEmail: String(payload.actorEmail), event: String(payload.event) as BillingEmailEvent, description: String(payload.description), value: String(payload.value), reference: payload.reference ? String(payload.reference) : null, validity: payload.validity ? new Date(String(payload.validity)) : null });
}

export async function notifyBillingEvent(input: { organizationId: string; targetId: string; actorEmail: string; event: BillingEmailEvent; description: string; value: string; reference?: string | null; validity?: Date | null }) {
  const db = getDb();
  if (!db) return { accepted: false, message: "Billing applied; email status unavailable." };
  const acceptedAction = `BILLING_${input.event}_EMAIL_ACCEPTED`;
  const alreadyAccepted = await db.platformAuditLog.findFirst({ where: { targetType: "BillingNotification", targetId: input.targetId, action: acceptedAction } });
  if (alreadyAccepted) return { accepted: true, message: "Billing confirmation was already accepted by the mail server." };
  let accepted = false;
  try {
    await send(input);
    accepted = true;
  } catch { /* Payment/allocation remains successful when email delivery fails. */ }
  await db.platformAuditLog.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, actorRole: input.event === "FREE_CREDITS_GRANTED" ? "SUPER_ADMIN" : "CLIENT_ADMIN", action: accepted ? acceptedAction : `BILLING_${input.event}_EMAIL_FAILED`, targetType: "BillingNotification", targetId: input.targetId, summary: accepted ? "Billing confirmation accepted by SMTP; inbox delivery is not verified" : "Billing applied but confirmation email was not accepted", metadata: { billingTargetId: input.targetId, event: input.event } } });
  if (!accepted) {
    const property = await db.property.findFirst({ where: { organizationId: input.organizationId }, orderBy: { createdAt: "asc" }, select: { id: true } });
    if (property) await db.automationJob.upsert({ where: { idempotencyKey: `billing-email:${input.targetId}` }, update: {}, create: { propertyId: property.id, workflowId: "billing-notification-retry", triggerType: input.event, triggerRef: input.targetId, actionType: BILLING_NOTIFICATION_EMAIL, payload: { ...input, validity: input.validity?.toISOString() || null }, idempotencyKey: `billing-email:${input.targetId}`, priority: 2, maxAttempts: 5, createdBy: input.actorEmail } });
  }
  return { accepted, message: accepted ? "Billing applied. Confirmation email accepted by the mail server." : "Billing applied, but confirmation email could not be sent." };
}
