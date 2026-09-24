import { getDb } from "@/lib/db";
import { sendSupportTicketMail } from "@/lib/support-mail";

export async function submitSimpleOnboardingForReview(input: { organizationId: string; actorEmail: string }) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const profile = await db.botProfile.findUnique({ where: { organizationId: input.organizationId } });
  if (!profile || !profile.channels.includes("WEBSITE")) throw new Error("A configured AI Bot is required.");
  if (["LIVE", "DELETED"].includes(profile.status)) throw new Error(profile.status === "LIVE" ? "This bot is already live." : "Restore the bot before submitting it.");
  const subscription = await (await import("@/lib/subscription-access")).getOrganizationSubscriptionAccess(input.organizationId);
  if (!subscription?.canUsePaidActions) throw new Error("An active trial or subscription is required.");
  const property = await db.property.findFirst({ where: { organizationId: input.organizationId }, select: { id: true, organization: { select: { name: true } } } });
  if (!property) throw new Error("A business workspace is required.");
  const confirmedAnswers = await db.knowledgeEntry.count({ where: { propertyId: property.id, status: { notIn: ["REJECTED", "SUPERSEDED"] } } });
  const organizationName = property.organization?.name || "New client";
  const knowledgeSummary = confirmedAnswers ? `${confirmedAnswers} owner-confirmed answers were supplied.` : "The client chose to add website and Excel intelligence later.";
  const reviewReference = `ONBOARD-${input.organizationId}`;
  await db.$transaction([
    db.botProfile.update({ where: { organizationId: input.organizationId }, data: { status: "REVIEW_PENDING", lifecycleUpdatedBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "WEBSITE_BOT_SUBMITTED_FOR_REVIEW", detail: `Client completed the three-step onboarding. ${knowledgeSummary} Super Admin must check the website and screen for fake or misleading information before approving or requesting correction.` } }),
    db.supportTicket.upsert({
      where: { reference: reviewReference },
      update: { subject: `${organizationName} is ready for onboarding approval`, category: "ONBOARDING", priority: "HIGH", status: "OPEN", description: `The client completed the three-step onboarding. ${knowledgeSummary} Super Admin must check for fake or misleading information, review the public website when supplied, and approve or return one clear correction request.`, lastActivityBy: "CUSTOMER", resolution: null, resolvedAt: null },
      create: { organizationId: input.organizationId, reference: reviewReference, subject: `${organizationName} is ready for onboarding approval`, category: "ONBOARDING", priority: "HIGH", status: "OPEN", description: `The client completed the three-step onboarding. ${knowledgeSummary} Super Admin must check for fake or misleading information, review the public website when supplied, and approve or return one clear correction request.`, createdByEmail: input.actorEmail, lastActivityBy: "CUSTOMER" }
    })
  ]);
  const notificationAlreadySent = await db.onboardingActivity.findFirst({
    where: { organizationId: input.organizationId, action: "SUPER_ADMIN_ONBOARDING_EMAIL_SENT" },
    select: { id: true }
  });
  if (!notificationAlreadySent) {
    const adminEmail = process.env.AIFROGI_ADMIN_EMAIL?.trim() || "info@aifrogi.com";
    const mail = await sendSupportTicketMail({
      to: adminEmail,
      reference: reviewReference,
      subject: `${organizationName} is ready for onboarding approval`,
      heading: "New client onboarding is ready for review",
      body: `${organizationName} completed the three-step onboarding. ${knowledgeSummary} Check for fake or misleading information, review the public website when supplied, then approve the client or return one clear correction request.`,
      actionLabel: "Review onboarding request"
    });
    await db.onboardingActivity.create({
      data: {
        organizationId: input.organizationId,
        actorEmail: input.actorEmail,
        action: mail.error ? "SUPER_ADMIN_ONBOARDING_EMAIL_FAILED" : "SUPER_ADMIN_ONBOARDING_EMAIL_SENT",
        detail: mail.error ? `Super Admin email delivery failed: ${mail.error}` : `Super Admin notification sent to ${adminEmail}. Message ID: ${mail.messageId || "unavailable"}.`
      }
    });
  }
  return db.organization.findUnique({ where: { id: input.organizationId }, include: { botProfile: true, properties: true, botConnectors: true } });
}
