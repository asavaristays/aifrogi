#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import pg from "pg";

const slug = process.argv[2]?.trim().toLowerCase();
if (!/^[a-z0-9-]{2,80}$/.test(slug || "")) {
  throw new Error("Usage: node scripts/audit-webtechnosys-reset.mjs <exact-slug>");
}

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((candidate) => candidate.name === "lead-os-ai");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Protected production database environment is unavailable.");

const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await client.connect();
try {
  const tenant = await client.query(
    'SELECT id, name, slug, status, "createdAt" FROM "Organization" WHERE lower(slug) = $1',
    [slug]
  );
  if (tenant.rowCount !== 1) throw new Error(`Expected one tenant; found ${tenant.rowCount}.`);
  const organization = tenant.rows[0];
  const properties = await client.query(
    `SELECT p.id, p.name, p.slug,
      (SELECT count(*)::int FROM "KnowledgeDocument" d WHERE d."propertyId" = p.id) AS knowledge_documents,
      (SELECT count(*)::int FROM "KnowledgeEntry" e WHERE e."propertyId" = p.id) AS knowledge_entries,
      (SELECT count(*)::int FROM "KnowledgeEntry" e WHERE e."propertyId" = p.id AND e.status = 'PUBLISHED') AS published_entries
     FROM "Property" p WHERE p."organizationId" = $1`,
    [organization.id]
  );
  const onboarding = await client.query(
    'SELECT count(*)::int AS documents FROM "OnboardingDocument" WHERE "organizationId" = $1',
    [organization.id]
  );
  const activities = await client.query(
    'SELECT action, detail, "createdAt" FROM "OnboardingActivity" WHERE "organizationId" = $1 ORDER BY "createdAt" ASC',
    [organization.id]
  );
  console.log(JSON.stringify({
    organization,
    onboardingDocuments: onboarding.rows[0].documents,
    properties: properties.rows,
    activities: activities.rows
  }, null, 2));
} finally {
  await client.end();
}
