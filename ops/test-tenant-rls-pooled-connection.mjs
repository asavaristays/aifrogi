import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const pool = new Pool({ connectionString, max: 1, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000 });

async function tenantTransaction(organizationId, expectedKnowledgeId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.organization_id', $1, true)", [organizationId]);
    await client.query("SELECT set_config('app.platform_authority', 'false', true)");
    const result = await client.query(`
      SELECT pg_backend_pid() AS backend_pid,
        current_setting('app.organization_id', true) AS organization_id,
        EXISTS (SELECT 1 FROM "KnowledgeEntry" WHERE id = $1) AS own_record_visible
    `, [expectedKnowledgeId]);
    await client.query("COMMIT");
    const row = result.rows[0];
    if (row.organization_id !== organizationId || row.own_record_visible !== true) {
      throw new Error(`Tenant context verification failed for ${organizationId}.`);
    }
    return Number(row.backend_pid);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

async function verifyNoContextLeak() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(`
      SELECT pg_backend_pid() AS backend_pid,
        COALESCE(current_setting('app.organization_id', true), '') AS organization_id,
        (SELECT count(*) FROM "KnowledgeEntry") AS visible_knowledge_count
    `);
    await client.query("COMMIT");
    const row = result.rows[0];
    if (row.organization_id !== "" || Number(row.visible_knowledge_count) !== 0) {
      throw new Error("Tenant identity leaked into a reused pooled connection.");
    }
    return Number(row.backend_pid);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

try {
  const tenantABackend = await tenantTransaction("rls-org-a", "rls-knowledge-a");
  const cleanBackend = await verifyNoContextLeak();
  const tenantBBackend = await tenantTransaction("rls-org-b", "rls-knowledge-b");
  if (tenantABackend !== cleanBackend || cleanBackend !== tenantBBackend) {
    throw new Error("The pool did not reuse one backend; pooled-connection drill is inconclusive.");
  }
  console.log(JSON.stringify({ ok: true, backendReused: true, contextLeak: false, tenants: ["A", "B"] }));
} finally {
  await pool.end();
}
