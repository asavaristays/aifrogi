#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import pg from "pg";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("SEC-001 blocked: protected production database configuration is unavailable.");
const env = app.pm2_env;
const failures = [];
const requiredSecrets = ["AUTH_SESSION_SECRET", "LEADOS_FIELD_ENCRYPTION_SECRET", "BACKUP_ENCRYPTION_PASSPHRASE"];
for (const name of requiredSecrets) {
  const value = String(env[name] || "").trim();
  if (value.length < 24 || value === "change-this-in-production") failures.push(`${name} is missing, weak, or uses a default value`);
}
const razorpay = ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_BILLING_WEBHOOK_SECRET"].map((name) => Boolean(String(env[name] || "").trim()));
if (razorpay.some(Boolean) && !razorpay.every(Boolean)) failures.push("Razorpay configuration is incomplete");

const client = new pg.Client({ connectionString: env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await client.connect();
try {
  const invalidLive = await client.query(`
    SELECT o.slug, c."connectorKey"
    FROM "BotConnectorConfiguration" c
    JOIN "Organization" o ON o.id = c."organizationId"
    LEFT JOIN "BotConnectorCredential" k ON k."connectorId" = c.id
    WHERE c.enabled = true AND c.lifecycle = 'LIVE' AND c."authType" <> 'NONE'
      AND (k.id IS NULL OR k."revokedAt" IS NOT NULL OR (k."expiresAt" IS NOT NULL AND k."expiresAt" <= now()))
  `);
  if (invalidLive.rowCount) failures.push(`live connectors with invalid credentials: ${invalidLive.rows.map((row) => `${row.slug}/${row.connectorKey}`).join(", ")}`);
  const duplicateOwners = await client.query(`SELECT lower("ownerEmail") email, count(*)::int count FROM "Organization" WHERE "isDemo" = false GROUP BY lower("ownerEmail") HAVING count(*) > 1`);
  if (duplicateOwners.rowCount) failures.push(`duplicate live tenant owner identities: ${duplicateOwners.rows.map((row) => row.email).join(", ")}`);
  const liveCount = await client.query(`SELECT count(*)::int count FROM "Organization" WHERE status = 'LIVE' AND "isDemo" = false`);
  console.log(`SEC-001 inventory: ${liveCount.rows[0].count} live tenants; ${invalidLive.rowCount} invalid live credentials; ${duplicateOwners.rowCount} duplicate owner identities.`);
} finally { await client.end(); }

if (failures.length) throw new Error(`SEC-001 first-10-bot security gate failed:\n- ${failures.join("\n- ")}`);
console.log("SEC-001 first-10-bot security gate passed: production secrets, payment configuration, tenant identity, and connector credential lifecycle are valid.");
