import { getDb } from "@/lib/db";

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
  if (!confirmedAnswers) throw new Error("Upload and confirm the completed onboarding workbook before submitting it to AiFrogi.");
  const organizationName = property.organization?.name || "New client";
  const reviewReference = `ONBOARD-${input.organizationId}`;
  await db.$transaction([
    db.botProfile.update({ where: { organizationId: input.organizationId }, data: { status: "REVIEW_PENDING", lifecycleUpdatedBy: input.actorEmail } }),
    db.onboardingActivity.create({ data: { organizationId: input.organizationId, actorEmail: input.actorEmail, action: "WEBSITE_BOT_SUBMITTED_FOR_REVIEW", detail: `Client completed simple onboarding with ${confirmedAnswers} confirmed workbook answer${confirmedAnswers === 1 ? "" : "s"}. AiFrogi Super Admin now owns website review, testing, certification and activation.` } }),
    db.supportTicket.upsert({
      where: { reference: reviewReference },
      update: { subject: `${organizationName} is ready for onboarding approval`, category: "ONBOARDING", priority: "HIGH", status: "OPEN", description: `The client completed the three-step onboarding and confirmed ${confirmedAnswers} workbook answers. Super Admin must review the website and knowledge, run technical checks and approve or return one clear correction request.`, lastActivityBy: "CUSTOMER", resolution: null, resolvedAt: null },
      create: { organizationId: input.organizationId, reference: reviewReference, subject: `${organizationName} is ready for onboarding approval`, category: "ONBOARDING", priority: "HIGH", status: "OPEN", description: `The client completed the three-step onboarding and confirmed ${confirmedAnswers} workbook answers. Super Admin must review the website and knowledge, run technical checks and approve or return one clear correction request.`, createdByEmail: input.actorEmail, lastActivityBy: "CUSTOMER" }
    })
  ]);
  return db.organization.findUnique({ where: { id: input.organizationId }, include: { botProfile: true, properties: true, botConnectors: true } });
}
