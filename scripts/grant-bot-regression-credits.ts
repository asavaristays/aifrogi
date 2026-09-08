#!/usr/bin/env -S node --import tsx

import { execFileSync } from "node:child_process";

const propertySlug = process.env.AIFROGI_TEST_PROPERTY_SLUG || "webtechnosys-ai-agency-e5da22";
const credits = Math.max(1, Math.min(Number(process.env.AIFROGI_TEST_CREDIT_GRANT || 1000), 1000));
const grantKey = process.env.AIFROGI_TEST_GRANT_KEY || "BOT_FAMILY_REGRESSION_2026_09";
const actorEmail = process.env.AIFROGI_TEST_ACTOR || "system-regression@aifrogi.com";

async function main() {
if (!process.env.DATABASE_URL) {
  const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const app = apps.find((candidate: { name?: string; pm2_env?: { DATABASE_URL?: string } }) => candidate.name === "lead-os-ai");
  if (!app?.pm2_env?.DATABASE_URL) throw new Error("Protected production database environment is unavailable.");
  process.env.DATABASE_URL = app.pm2_env.DATABASE_URL;
}

const [{ getDb }, { grantFreeAiCredits }] = await Promise.all([import("../lib/db"), import("../lib/ai-credits")]);
const db = getDb();
if (!db) throw new Error("Billing database is unavailable.");

try {
  const property = await db.property.findUnique({ where: { slug: propertySlug }, select: { organizationId: true } });
  if (!property?.organizationId) throw new Error(`No organization owns property ${propertySlug}.`);

  const existing = await db.platformAuditLog.findFirst({
    where: { organizationId: property.organizationId, action: "AI_CREDITS_GRANTED", metadata: { path: ["grantKey"], equals: grantKey } },
    select: { id: true, targetId: true, createdAt: true }
  });
  if (existing) {
    console.log(JSON.stringify({ status: "ALREADY_GRANTED", credits, grantKey, auditId: existing.id, transactionId: existing.targetId, createdAt: existing.createdAt }));
    return;
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const grant = await grantFreeAiCredits({
    organizationId: property.organizationId,
    credits,
    reason: `Capped bot-family regression allowance (${grantKey})`,
    expiresAt,
    actorEmail
  });
  await db.platformAuditLog.updateMany({
    where: { targetId: grant.id, action: "AI_CREDITS_GRANTED" },
    data: { metadata: { credits, grantKey, purpose: "BOT_FAMILY_REGRESSION", expiresAt: expiresAt.toISOString() } }
  });
  console.log(JSON.stringify({ status: "GRANTED", credits, grantKey, transactionId: grant.id, expiresAt }));
} finally {
  await db.$disconnect();
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
