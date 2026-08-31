#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import pg from "pg";

export function evaluateOwnershipPlan({ currentRole, tables, approvedOwnerRole }) {
  if (!tables.length) return { ok: false, mode: "BLOCKED", reason: "No existing migration target table was supplied." };
  const missing = tables.filter((table) => !table.owner);
  if (missing.length) return { ok: false, mode: "BLOCKED", reason: `Target table ownership is unresolved: ${missing.map((table) => table.name).join(", ")}.` };
  if (tables.every((table) => table.owner === currentRole)) return { ok: true, mode: "RUNTIME_OWNER", reason: `Runtime role ${currentRole} owns every target table.` };
  const owners = [...new Set(tables.map((table) => table.owner))];
  if (approvedOwnerRole && owners.length === 1 && owners[0] === approvedOwnerRole) return { ok: true, mode: "ADMIN_OWNER_REQUIRED", reason: `Migration must be executed as approved owner ${approvedOwnerRole}; runtime Prisma deploy must not be attempted.` };
  return { ok: false, mode: "BLOCKED", reason: `Runtime role ${currentRole} does not own all targets; owners are ${owners.join(", ")}. Configure an explicit owner-path before migration.` };
}

async function main() {
  const tables = (process.argv[2] || "").split(",").map((value) => value.trim()).filter(Boolean);
  const approvedOwnerRole = process.argv[3]?.trim() || null;
  const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
  const app = apps.find((candidate) => candidate.name === "lead-os-ai");
  if (!app?.pm2_env?.DATABASE_URL) throw new Error("Protected database environment is unavailable.");
  if (!app.pm2_env.BACKUP_ENCRYPTION_PASSPHRASE) throw new Error("Encrypted-backup secret is not configured; migration is blocked.");

  const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    const roleResult = await client.query("SELECT current_user AS role");
    const ownerResult = await client.query(
      "SELECT c.relname AS name, pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname = ANY($1::text[])",
      [tables]
    );
    const owners = new Map(ownerResult.rows.map((row) => [row.name, row.owner]));
    const plan = evaluateOwnershipPlan({ currentRole: roleResult.rows[0].role, tables: tables.map((name) => ({ name, owner: owners.get(name) || null })), approvedOwnerRole });
    console.log(JSON.stringify({ ok: plan.ok, mode: plan.mode, targets: tables, reason: plan.reason }));
    if (!plan.ok) process.exitCode = 2;
  } finally {
    await client.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => { console.error(error instanceof Error ? error.message : "Migration preflight failed."); process.exitCode = 1; });
