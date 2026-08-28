import { getDb } from "../lib/db";
import { writeKnowledgeSettings } from "../lib/repositories/knowledge-repository";
import { getWebsiteKnowledgeBase } from "../lib/services/website-knowledge-service";

const ORGANIZATION_SLUG = "webtechnosys";
const OWNER_EMAIL = "manish@webtechnosys.com";

async function main() {
  const db = getDb();
  if (!db) throw new Error("DATABASE_URL is required");

  const organization = await db.organization.upsert({
    where: { slug: ORGANIZATION_SLUG },
    update: { name: "Webtechnosys", industry: "AI software, automation and digital transformation", website: "https://webtechnosys.com", ownerName: "Manish Purohit", ownerEmail: OWNER_EMAIL },
    create: {
      name: "Webtechnosys", slug: ORGANIZATION_SLUG, industry: "AI software, automation and digital transformation", website: "https://webtechnosys.com", ownerName: "Manish Purohit", ownerEmail: OWNER_EMAIL, status: "ACTIVE", plan: "AI_TOOLS",
      members: { create: { email: OWNER_EMAIL, name: "Manish Purohit", role: "OWNER", status: "ACTIVE", joinedAt: new Date() } },
      onboarding: { create: { currentStep: 2, progressPercent: 30, lifecycleStatus: "BOT_PROFILE_CONFIGURED", legalName: "Webtechnosys", businessCategory: "AI software and automation" } },
      properties: { create: { name: "Webtechnosys AI Demo", slug: ORGANIZATION_SLUG, timezone: "Asia/Kolkata" } },
      activities: { create: { actorEmail: OWNER_EMAIL, action: "DEMO_ORGANIZATION_CREATED", detail: "Parent-brand reusable AI business bot demo" } }
    }
  });

  const property = await db.property.upsert({
    where: { slug: ORGANIZATION_SLUG },
    update: { organizationId: organization.id, name: "Webtechnosys AI Demo" },
    create: { organizationId: organization.id, name: "Webtechnosys AI Demo", slug: ORGANIZATION_SLUG, timezone: "Asia/Kolkata" }
  });

  await db.organizationMember.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: OWNER_EMAIL } },
    update: { name: "Manish Purohit", role: "OWNER", status: "ACTIVE" },
    create: { organizationId: organization.id, email: OWNER_EMAIL, name: "Manish Purohit", role: "OWNER", status: "ACTIVE", joinedAt: new Date() }
  });
  await db.onboardingProfile.upsert({
    where: { organizationId: organization.id },
    update: { lifecycleStatus: "BOT_PROFILE_CONFIGURED", legalName: "Webtechnosys", businessCategory: "AI software and automation" },
    create: { organizationId: organization.id, currentStep: 2, progressPercent: 30, lifecycleStatus: "BOT_PROFILE_CONFIGURED", legalName: "Webtechnosys", businessCategory: "AI software and automation" }
  });

  await db.botProfile.upsert({
    where: { organizationId: organization.id },
    update: { category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE", "WHATSAPP"], capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS"], humanHandoffEnabled: true, actionApprovalNeeded: true, status: "CONFIGURED", configuredBy: OWNER_EMAIL },
    create: { organizationId: organization.id, category: "BUSINESS_AI", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE", "WHATSAPP"], capabilities: ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS"], humanHandoffEnabled: true, actionApprovalNeeded: true, status: "CONFIGURED", configuredBy: OWNER_EMAIL }
  });

  await writeKnowledgeSettings(property.slug, { sourceUrl: "https://webtechnosys.com", approvedForAi: true, autoRefreshHours: 24, status: "DRAFT", customInstructions: "Answer from Webtechnosys public service information. Identify the visitor's business need, recommend the relevant service, capture name, business, phone or email with consent, and hand off pricing, contracts, legal, or sensitive requests to a human.", handoffTopics: ["Pricing commitments", "Contracts and legal terms", "Complaints", "Sensitive personal data", "Custom delivery promises"] });
  const knowledge = await getWebsiteKnowledgeBase(property.slug, true);
  console.log(JSON.stringify({ organization: organization.slug, property: property.slug, category: "BUSINESS_AI", channels: ["WEBSITE", "WHATSAPP"], knowledgePages: knowledge.pages.length, source: knowledge.baseUrl }));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exit(1); });
