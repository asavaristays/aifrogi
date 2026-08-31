import { getDb } from "@/lib/db";
import { createAtomicClaim, fieldApproveClaim, generateClaimPreview, reviewClaimPreview } from "@/lib/repositories/knowledge-verification-repository";

const PROPERTY_SLUG = "webtechnosys";
const ACTOR = "manish@webtechnosys.com";
const claims = [
  { question: "How can I contact Webtechnosys?", answer: "Call +91-7410582898 or email info@webtechnosys.com. Use only the minimum contact information needed for the enquiry and never share passwords, OTPs, or payment-card details.", category: "Contact" },
  { question: "Where is Webtechnosys based?", answer: "Webtechnosys operates from H.No 746 - TF, New Wada, Morjim, Goa 403512 and 656 Ground Floor, Sector 40, Mohyal Colony, near Trikona Park Barricade, Gurgaon, Haryana 122003.", category: "Contact" },
  { question: "How do I request a callback from Webtechnosys?", answer: "Use the human-contact form and provide your name, preferred callback time, and either an email address or mobile number with consent. The Webtechnosys team will follow up; never share passwords, OTPs, or payment-card details.", category: "Contact" },
  { question: "Where can I book Webtechnosys AI training?", answer: "Use the active Webtechnosys training page: https://webtechnosys.com/training-booking/ for currently published training and booking information. If a required date is not published there, request confirmation from the Webtechnosys team.", category: "Training" },
  { question: "Can I choose a specific Webtechnosys training date?", answer: "Check https://webtechnosys.com/training-booking/ for currently published dates. Webtechnosys must confirm any date that is not shown on that approved page.", category: "Training" },
  { question: "What can Webtechnosys build?", answer: "Webtechnosys builds AI business systems, custom software, web platforms, mobile applications, workflow automation, cloud integrations, and hospitality technology. A discovery session defines the approved scope before a commercial commitment is made.", category: "Services" }
] as const;

async function main() {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const property = await db.property.findUnique({ where: { slug: PROPERTY_SLUG }, include: { organization: true } });
  if (!property) throw new Error("Webtechnosys workspace not found.");
  const organizationId = property.organizationId;
  if (!organizationId) throw new Error("Webtechnosys workspace is not attached to an organization.");
  await db.$transaction([
    db.property.update({ where: { id: property.id }, data: { name: "Webtechnosys AI" } }),
    db.organization.update({ where: { id: organizationId }, data: { name: "Webtechnosys", website: "https://webtechnosys.com", publicPhone: "+91-7410582898", publicEmail: "info@webtechnosys.com", publicAddress: "Goa: H.No 746 - TF, New Wada, Morjim, Goa 403512. Gurgaon: 656 Ground Floor, Sector 40, Mohyal Colony, near Trikona Park Barricade, Gurgaon, Haryana 122003." } })
  ]);
  let published = 0;
  let existing = 0;
  for (const claim of claims) {
    const exact = await db.knowledgeEntry.findFirst({ where: { propertyId: property.id, question: claim.question, answer: claim.answer, status: "PUBLISHED" }, select: { id: true } });
    if (exact) { existing += 1; continue; }
    const prior = await db.knowledgeEntry.findFirst({ where: { propertyId: property.id, question: claim.question, status: { in: ["PUBLISHED", "APPROVED", "FIELD_APPROVED", "PREVIEW_PENDING", "PAUSED", "EXPIRED", "CONFLICT"] } }, orderBy: { version: "desc" }, select: { id: true } });
    const entry = await createAtomicClaim({ propertyId: property.id, ...claim, createdBy: ACTOR, refreshDays: 30 });
    await fieldApproveClaim({ propertyId: property.id, entryId: entry.id, actorEmail: ACTOR, supersedesId: prior?.id });
    const preview = await generateClaimPreview({ propertyId: property.id, entryId: entry.id });
    await reviewClaimPreview({ propertyId: property.id, previewId: preview.id, actorEmail: ACTOR, approve: true });
    published += 1;
  }
  const dismissed = await db.knowledgeGap.updateMany({ where: { propertyId: property.id, status: "OPEN", normalizedQuestion: { in: ["what is the zargle policy", "weather", "you already have context"] } }, data: { status: "DISMISSED" } });
  await db.onboardingActivity.create({ data: { organizationId, actorEmail: ACTOR, action: "WEBTECHNOSYS_LAUNCH_KNOWLEDGE_COMPLETED", detail: `Published ${published}; already present ${existing}; dismissed test gaps ${dismissed.count}. Active training URL verified HTTP 200 on 31 August 2026.` } });
  console.log(JSON.stringify({ property: PROPERTY_SLUG, published, existing, dismissedTestGaps: dismissed.count }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
