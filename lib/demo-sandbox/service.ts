import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { getBotPersonaPack } from "@/lib/bot-persona-packs";
import { DEMO_FIXTURE_VERSION, listDemoFixtures, matchDemoAction, missingDemoActionRequirements, type DemoFixture } from "@/lib/demo-sandbox/fixtures";

const SYSTEM_ACTOR = "demo-sandbox@aifrogi.com";

function actionMode(category: DemoFixture["category"]) {
  return ["PINGBOOK", "FLOWCART"].includes(category) ? "APPROVED_ACTIONS" as const : category === "CUSTOM" ? "HUMAN_APPROVAL" as const : "LEAD_CAPTURE" as const;
}

export async function provisionDemoSandboxes(actorEmail = SYSTEM_ACTOR) {
  const db = getDb();
  if (!db) throw new Error("Database is unavailable.");
  const results: Array<{ slug: string; organizationId: string }> = [];
  for (const fixture of listDemoFixtures()) {
    const pack = getBotPersonaPack(fixture.category);
    const organization = await db.organization.upsert({
      where: { slug: fixture.slug },
      update: { name: fixture.businessName, industry: fixture.industry, status: "ACTIVE", plan: "DEMO", isDemo: true, demoKey: fixture.category, ownerName: "AiFrogi Demo Team", ownerEmail: SYSTEM_ACTOR },
      create: { name: fixture.businessName, slug: fixture.slug, industry: fixture.industry, status: "ACTIVE", plan: "DEMO", isDemo: true, demoKey: fixture.category, ownerName: "AiFrogi Demo Team", ownerEmail: SYSTEM_ACTOR }
    });
    const property = await db.property.upsert({ where: { slug: fixture.slug }, update: { organizationId: organization.id, name: fixture.businessName }, create: { organizationId: organization.id, slug: fixture.slug, name: fixture.businessName } });
    await db.onboardingProfile.upsert({ where: { organizationId: organization.id }, update: { lifecycleStatus: "DEMO_READY", currentStep: 6, progressPercent: 100, businessCategory: fixture.industry, kycStatus: "DEMO_SYNTHETIC", completedAt: new Date() }, create: { organizationId: organization.id, lifecycleStatus: "DEMO_READY", currentStep: 6, progressPercent: 100, businessCategory: fixture.industry, kycStatus: "DEMO_SYNTHETIC", completedAt: new Date() } });
    await db.botProfile.upsert({
      where: { organizationId: organization.id },
      update: { category: fixture.category, personaPackVersion: pack.version, operatingMode: actionMode(fixture.category), channels: ["WEBSITE"], capabilities: pack.defaultCapabilities, humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: pack.defaultPersonaName, businessObjective: fixture.intro, tone: pack.tone, prohibitedClaims: pack.unauthorizedWithoutEscalation, escalationTriggers: pack.hardEscalations, status: "LIVE", installationDetectedAt: new Date(), liveAt: new Date(), configuredBy: actorEmail },
      create: { organizationId: organization.id, category: fixture.category, personaPackVersion: pack.version, operatingMode: actionMode(fixture.category), channels: ["WEBSITE"], capabilities: pack.defaultCapabilities, humanHandoffEnabled: true, actionApprovalNeeded: true, personaName: pack.defaultPersonaName, businessObjective: fixture.intro, tone: pack.tone, prohibitedClaims: pack.unauthorizedWithoutEscalation, escalationTriggers: pack.hardEscalations, status: "LIVE", installationKey: randomBytes(24).toString("base64url"), installationDetectedAt: new Date(), liveAt: new Date(), configuredBy: actorEmail }
    });
    for (const connector of pack.connectors) {
      await db.botConnectorConfiguration.upsert({
        where: { organizationId_connectorKey: { organizationId: organization.id, connectorKey: connector.key } },
        update: { name: `${connector.name} — Mock`, provider: "AIFROGI_DEMO_MOCK", requiredFor: connector.requiredFor, required: connector.requiredFor !== "OPTIONAL", enabled: true, lifecycle: "MONITORED", readOperations: connector.reads, writeOperations: connector.writes, unavailableBehavior: connector.unavailableBehavior, lastVerifiedAt: new Date(), configuredBy: actorEmail },
        create: { organizationId: organization.id, connectorKey: connector.key, name: `${connector.name} — Mock`, provider: "AIFROGI_DEMO_MOCK", requiredFor: connector.requiredFor, required: connector.requiredFor !== "OPTIONAL", enabled: true, lifecycle: "MONITORED", readOperations: connector.reads, writeOperations: connector.writes, unavailableBehavior: connector.unavailableBehavior, lastVerifiedAt: new Date(), configuredBy: actorEmail }
      });
    }
    await db.demoSandbox.upsert({ where: { organizationId: organization.id }, update: { category: fixture.category, fixtureVersion: DEMO_FIXTURE_VERSION, fixture: fixture as unknown as Prisma.InputJsonValue, status: "READY" }, create: { organizationId: organization.id, category: fixture.category, fixtureVersion: DEMO_FIXTURE_VERSION, fixture: fixture as unknown as Prisma.InputJsonValue, status: "READY", lastResetAt: new Date(), lastResetBy: actorEmail } });
    for (const [index, fact] of fixture.facts.entries()) {
      const claimKey = `demo:${fixture.category.toLowerCase()}:${index + 1}`;
      const existing = await db.knowledgeEntry.findFirst({ where: { propertyId: property.id, claimKey }, select: { id: true } });
      const data = { question: fact.question, answer: fact.answer, category: fact.category, status: "PUBLISHED", claimKey, validationStatus: "VALID", conflictStatus: "CLEAR", reliability: "SYNTHETIC_DEMO", authorityLevel: "AIFROGI_DEMO_FIXTURE", fieldApprovedBy: actorEmail, fieldApprovedAt: new Date(), previewApprovedBy: actorEmail, previewApprovedAt: new Date(), publishedAt: new Date(), lastConfirmedAt: new Date(), createdBy: actorEmail, approvedBy: actorEmail, approvedAt: new Date() };
      if (existing) await db.knowledgeEntry.update({ where: { id: existing.id }, data }); else await db.knowledgeEntry.create({ data: { propertyId: property.id, ...data } });
    }
    await db.onboardingActivity.create({ data: { organizationId: organization.id, actorEmail, action: "DEMO_SANDBOX_PROVISIONED", detail: `${pack.productName} fixture ${DEMO_FIXTURE_VERSION}; synthetic data and mock connectors only.` } });
    results.push({ slug: fixture.slug, organizationId: organization.id });
  }
  return results;
}

export async function resetDemoSandbox(organizationId: string, actorEmail: string) {
  const db = getDb();
  if (!db) throw new Error("Database is unavailable.");
  const organization = await db.organization.findFirst({ where: { id: organizationId, isDemo: true }, include: { properties: { select: { id: true } }, demoSandbox: true } });
  if (!organization?.demoSandbox) throw new Error("Only an isolated demo sandbox can be reset.");
  const propertyIds = organization.properties.map((item) => item.id);
  await db.$transaction(async (tx) => {
    await tx.sovereignAnswerFeedback.deleteMany({ where: { propertyId: { in: propertyIds } } });
    await tx.sovereignAnswerEvidence.deleteMany({ where: { propertyId: { in: propertyIds } } });
    await tx.knowledgeAnswerFlag.deleteMany({ where: { propertyId: { in: propertyIds } } });
    await tx.knowledgeGap.deleteMany({ where: { propertyId: { in: propertyIds } } });
    await tx.lead.deleteMany({ where: { propertyId: { in: propertyIds } } });
    await tx.demoConnectorEvent.deleteMany({ where: { demoSandboxId: organization.demoSandbox!.id } });
    await tx.demoSandbox.update({ where: { id: organization.demoSandbox!.id }, data: { resetCount: { increment: 1 }, lastResetAt: new Date(), lastResetBy: actorEmail, status: "READY" } });
    await tx.onboardingActivity.create({ data: { organizationId, actorEmail, action: "DEMO_SANDBOX_RESET", detail: "Removed synthetic conversations, feedback, flags, gaps and mock connector events." } });
  });
  return { organizationId, resetAt: new Date().toISOString() };
}

export async function resolveDemoConnectorTurn(input: { organizationId: string; category: DemoFixture["category"]; question: string; priorQuestions?: string[]; sessionId: string }) {
  const db = getDb();
  if (!db) return null;
  const sandbox = await db.demoSandbox.findUnique({ where: { organizationId: input.organizationId }, select: { id: true, status: true } });
  if (!sandbox || sandbox.status !== "READY") return null;
  const normalized = input.question.toLowerCase();
  const conversation = [...(input.priorQuestions || []), input.question];
  const action = matchDemoAction(input.category, conversation.join(" \n "));
  if (!action) return null;
  const missing = missingDemoActionRequirements(input.category, conversation);
  if (missing.length) return { answer: `Before I use the demo connector, please provide ${missing.join(" and ")}. Use fictional details only.`, connectorKey: action.connectorKey, operation: action.operation, status: "CLARIFY" };
  const forcedFailure = /\b(unavailable|offline|failure|fail|down)\b/.test(normalized);
  const idempotencyKey = createHash("sha256").update(`${input.sessionId}:${action.connectorKey}:${action.operation}:${normalized.replace(/\s+/g, " ").trim()}`).digest("hex");
  const status = forcedFailure ? "SAFE_FAILURE" : "SUCCEEDED";
  const answer = forcedFailure ? `${getBotPersonaPack(input.category).connectors.find((item) => item.key === action.connectorKey)?.unavailableBehavior || "The mock connector is unavailable, so no action was performed."} DEMO: no external system was contacted.` : action.answer;
  const response = forcedFailure ? { demo: true, performed: false, reason: "SIMULATED_CONNECTOR_UNAVAILABLE" } : { demo: true, performed: true, ...action.response };
  await db.demoConnectorEvent.upsert({ where: { demoSandboxId_idempotencyKey: { demoSandboxId: sandbox.id, idempotencyKey } }, update: { status, response: response as Prisma.InputJsonValue }, create: { demoSandboxId: sandbox.id, connectorKey: action.connectorKey, operation: action.operation, idempotencyKey, status, request: { demo: true, question: input.question } as Prisma.InputJsonValue, response: response as Prisma.InputJsonValue } });
  return { answer, connectorKey: action.connectorKey, operation: action.operation, status };
}
