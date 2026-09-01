#!/usr/bin/env node
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import pg from "pg";

const mode = process.argv[2];
const slug = process.argv[3]?.trim().toLowerCase();
const confirmation = process.argv[4];
if (!new Set(["inspect", "delete", "verify"]).has(mode) || !/^[a-z0-9-]{2,80}$/.test(slug || "")) {
  throw new Error("Usage: node ops/tenant-cleanup.mjs <inspect|delete|verify> <exact-slug> [CONFIRM_DELETE]");
}
if (mode === "delete" && confirmation !== "CONFIRM_DELETE") throw new Error("Deletion requires the exact CONFIRM_DELETE argument.");

const apps = JSON.parse(execFileSync("pm2", ["jlist"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const app = apps.find((candidate) => candidate.name === "lead-os-ai");
if (!app?.pm2_env?.DATABASE_URL) throw new Error("Protected production database environment is unavailable.");

const client = new pg.Client({ connectionString: app.pm2_env.DATABASE_URL, connectionTimeoutMillis: 5000 });
await client.connect();
try {
  const result = await client.query(
    'SELECT id, name, slug, "ownerEmail", website, status, "createdAt" FROM "Organization" WHERE lower(slug) = $1',
    [slug]
  );
  if (mode === "verify") {
    const pattern = `%${slug}%`;
    const checks = {
      organizations: (await client.query('SELECT count(*)::int AS count FROM "Organization" WHERE lower(name) LIKE $1 OR lower(slug) LIKE $1 OR lower("ownerEmail") LIKE $1 OR lower(coalesce(website, \'\')) LIKE $1', [pattern])).rows[0].count,
      members: (await client.query('SELECT count(*)::int AS count FROM "OrganizationMember" WHERE lower(email) LIKE $1 OR lower(coalesce(name, \'\')) LIKE $1', [pattern])).rows[0].count,
      properties: (await client.query('SELECT count(*)::int AS count FROM "Property" WHERE lower(name) LIKE $1 OR lower(slug) LIKE $1', [pattern])).rows[0].count,
      platformAuditRows: (await client.query('SELECT count(*)::int AS count FROM "PlatformAuditLog" WHERE lower("actorEmail") LIKE $1 OR lower(summary) LIKE $1', [pattern])).rows[0].count
    };
    console.log(JSON.stringify({ slug, checks, clean: Object.values(checks).every((count) => count === 0) }));
    if (Object.values(checks).some((count) => count !== 0)) process.exitCode = 2;
    process.exit();
  }
  if (result.rowCount !== 1) throw new Error(`Expected exactly one tenant for slug ${slug}; found ${result.rowCount}.`);
  const tenant = result.rows[0];

  const references = await client.query(`
    SELECT child.relname AS table_name, att.attname AS column_name,
      CASE con.confdeltype WHEN 'c' THEN 'CASCADE' WHEN 'r' THEN 'RESTRICT' WHEN 'a' THEN 'NO ACTION' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS on_delete
    FROM pg_constraint con
    JOIN pg_class parent ON parent.oid = con.confrelid
    JOIN pg_class child ON child.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = child.relnamespace
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS keys(attnum, ord) ON true
    JOIN pg_attribute att ON att.attrelid = child.oid AND att.attnum = keys.attnum
    WHERE con.contype = 'f' AND ns.nspname = 'public' AND parent.relname = 'Organization'
    ORDER BY child.relname
  `);
  const dependencies = [];
  for (const reference of references.rows) {
    const table = `"${String(reference.table_name).replaceAll('"', '""')}"`;
    const column = `"${String(reference.column_name).replaceAll('"', '""')}"`;
    const count = await client.query(`SELECT count(*)::int AS count FROM ${table} WHERE ${column} = $1`, [tenant.id]);
    dependencies.push({ table: reference.table_name, column: reference.column_name, onDelete: reference.on_delete, count: count.rows[0].count });
  }

  if (mode === "inspect") {
    console.log(JSON.stringify({ tenant, dependencies }, null, 2));
  } else {
    await client.query("BEGIN");
    try {
      for (const dependency of dependencies.filter((item) => item.count > 0 && item.onDelete === "SET NULL")) {
        const table = `"${String(dependency.table).replaceAll('"', '""')}"`;
        const column = `"${String(dependency.column).replaceAll('"', '""')}"`;
        await client.query(`DELETE FROM ${table} WHERE ${column} = $1`, [tenant.id]);
      }
      const removed = await client.query('DELETE FROM "Organization" WHERE id = $1 RETURNING id, name, slug, "ownerEmail"', [tenant.id]);
      if (removed.rowCount !== 1) throw new Error("Tenant deletion did not remove exactly one organization.");
      const remaining = await client.query('SELECT count(*)::int AS count FROM "Organization" WHERE id = $1 OR lower(slug) = $2', [tenant.id, slug]);
      if (remaining.rows[0].count !== 0) throw new Error("Tenant verification failed before commit.");
      await client.query("COMMIT");
      appendFileSync("/var/log/aifrogi-tenant-operations.log", `${new Date().toISOString()} actor=codex-operation action=tenant-deleted slug=${slug} id=${tenant.id}\n`, { encoding: "utf8", mode: 0o600 });
      console.log(JSON.stringify({ deleted: removed.rows[0], directDependenciesRemoved: dependencies.reduce((sum, item) => sum + item.count, 0), verifiedAbsent: true }));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
