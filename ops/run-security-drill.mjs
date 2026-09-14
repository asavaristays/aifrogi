#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import pg from "pg";

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((item) => item.name === "lead-os-ai" && item.pm2_env?.status === "online");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Security drill requires the protected production database configuration.");
const startedAt = new Date();
const checks = [];
const readiness = await fetch("https://app.aifrogi.com/api/health/ready", { cache: "no-store", signal: AbortSignal.timeout(10000) });
checks.push({ control: "external-readiness", passed: readiness.ok });
execFileSync("node", ["ops/verify-first-ten-bot-security.mjs"], { cwd: process.cwd(), stdio: "inherit" });
checks.push({ control: "first-ten-security-gate", passed: true });

const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await client.connect();
try {
  await client.query("BEGIN");
  const candidate = await client.query(`SELECT id, enabled FROM "BotConnectorConfiguration" ORDER BY "updatedAt" DESC LIMIT 1 FOR UPDATE`);
  if (candidate.rowCount) {
    const id = candidate.rows[0].id;
    await client.query(`UPDATE "BotConnectorConfiguration" SET enabled=false, lifecycle='DRILL_DISABLED' WHERE id=$1`, [id]);
    const disabled = await client.query(`SELECT enabled, lifecycle FROM "BotConnectorConfiguration" WHERE id=$1`, [id]);
    checks.push({ control: "connector-emergency-shutdown", passed: disabled.rows[0].enabled === false && disabled.rows[0].lifecycle === "DRILL_DISABLED", mode: "transaction-rollback" });
  } else checks.push({ control: "connector-emergency-shutdown", passed: true, mode: "no-connector-present" });
  await client.query("ROLLBACK");
} catch (error) { await client.query("ROLLBACK"); throw error; }
finally { await client.end(); }

const passed = checks.every((check) => check.passed);
const report = { drill: "SECURITY_INCIDENT_AND_CONNECTOR_SHUTDOWN", startedAt: startedAt.toISOString(), completedAt: new Date().toISOString(), passed, checks, note: "No customer connector or data was changed; shutdown control executed inside a rolled-back transaction." };
mkdirSync("output/security-drills", { recursive: true });
const file = `output/security-drills/${startedAt.toISOString().replaceAll(":", "-")}.json`;
writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ ...report, evidence: file }));
if (!passed) process.exitCode = 2;
