import { getDb } from "@/lib/db";
import { sendBookingMail } from "@/lib/services/mailbox-service";
import { botLiveEmail } from "@/lib/bot-live-email-template";

/** SMTP acceptance is recorded separately from activation; it is not inbox delivery proof. */
export async function notifyBotLive(organizationId: string, actorEmail: string) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const organization = await db.organization.findUnique({ where: { id: organizationId }, include: { botProfile: true, properties: { take: 1, orderBy: { createdAt: "asc" } } } });
  if (!organization || organization.botProfile?.status !== "LIVE") throw new Error("Only a live bot can send a live confirmation.");
  const lastSent = await db.onboardingActivity.findFirst({ where: { organizationId, action: "BOT_LIVE_EMAIL_ACCEPTED", createdAt: { gte: organization.botProfile.liveAt || new Date() } } });
  if (lastSent) return { accepted: true, message: "Live confirmation was already accepted by the mail server." };
  let accepted = false;
  try {
    const slug = organization.properties[0]?.slug;
    if (!slug) throw new Error("Workspace unavailable.");
    const result = await sendBookingMail({
      to: organization.ownerEmail,
      subject: "Your AiFrogi bot is live",
      ...botLiveEmail({ ownerName: organization.ownerName, businessName: organization.name, slug })
    });
    accepted = !result.error && Boolean(result.messageId);
  } catch { /* Do not expose SMTP configuration or provider errors to clients. */ }
  await db.onboardingActivity.create({ data: { organizationId, actorEmail, action: accepted ? "BOT_LIVE_EMAIL_ACCEPTED" : "BOT_LIVE_EMAIL_FAILED", detail: accepted ? "SMTP accepted the live confirmation; inbox delivery is not verified." : "Live confirmation was not accepted. Retry from Website installation." } });
  return { accepted, message: accepted ? "Bot live. Confirmation email accepted by the mail server." : "Bot live, but confirmation email could not be sent. Use Retry live email." };
}
