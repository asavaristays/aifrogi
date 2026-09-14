#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import pg from "pg";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Security monitor cannot access the protected production database configuration.");
const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
const findings = [];
await client.connect();
try {
  const expiring = await client.query(`SELECT o.slug, c."connectorKey", k."expiresAt" FROM "BotConnectorCredential" k JOIN "BotConnectorConfiguration" c ON c.id=k."connectorId" JOIN "Organization" o ON o.id=c."organizationId" WHERE k."revokedAt" IS NULL AND k."expiresAt" IS NOT NULL AND k."expiresAt" <= now() + interval '30 days' ORDER BY k."expiresAt"`);
  for (const row of expiring.rows) findings.push({ severity: row.expiresAt <= new Date() ? "CRITICAL" : "WARNING", code: "CREDENTIAL_EXPIRY", tenant: row.slug, connector: row.connectorKey, deadline: row.expiresAt.toISOString() });
  const failedActions = await client.query(`SELECT count(*)::int count FROM "PlatformAuditLog" WHERE "createdAt" >= now() - interval '24 hours' AND action IN ('CONNECTOR_AUTH_TEST_FAILED','SUPPORT_EMAIL_REPLY_REJECTED')`);
  if (failedActions.rows[0].count >= 5) findings.push({ severity: "WARNING", code: "REPEATED_SECURITY_FAILURES", count: failedActions.rows[0].count });
  const invalidLive = await client.query(`SELECT count(*)::int count FROM "BotConnectorConfiguration" c LEFT JOIN "BotConnectorCredential" k ON k."connectorId"=c.id WHERE c.enabled=true AND c.lifecycle='LIVE' AND c."authType"<>'NONE' AND (k.id IS NULL OR k."revokedAt" IS NOT NULL OR (k."expiresAt" IS NOT NULL AND k."expiresAt"<=now()))`);
  if (invalidLive.rows[0].count) findings.push({ severity: "CRITICAL", code: "INVALID_LIVE_CONNECTOR", count: invalidLive.rows[0].count });
} finally { await client.end(); }

const report = { checkedAt: new Date().toISOString(), status: findings.some((item) => item.severity === "CRITICAL") ? "CRITICAL" : findings.length ? "WARNING" : "HEALTHY", findings };
mkdirSync("/var/log/aifrogi", { recursive: true, mode: 0o700 });
appendFileSync("/var/log/aifrogi/security-monitor.jsonl", `${JSON.stringify(report)}\n`, { mode: 0o600 });
console.log(JSON.stringify(report));
if (report.status === "CRITICAL") process.exitCode = 2;
