import assert from "node:assert/strict";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getDb, withDatabaseTransaction } from "../lib/db";
import { queueWebsiteHandoverNotifications, deliverWebsiteHandoverNotification } from "../lib/website-handover-notifications";
import { persistWebsiteTurn } from "../lib/website-persistence";
import { withWebsiteTurnLock } from "../lib/website-turn-lock";

async function main() {
  // Session-local temporary rows only. No business records or schema changes.
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL!, max: 2 }) });
  globalThis.__prisma__ = db;
  try {
    await db.$executeRawUnsafe("CREATE TEMP TABLE b2_persistence_probe (value integer)");
    const failure = await persistWebsiteTurn(async () => { await getDb()!.$executeRawUnsafe("INSERT INTO b2_persistence_probe VALUES (1)"); return Response.json({ error: "synthetic failure" }, { status: 503 }); });
    assert.equal(failure.status, 503);
    assert.equal(Number((await db.$queryRawUnsafe<Array<{ count: bigint }>>("SELECT count(*) AS count FROM b2_persistence_probe"))[0].count), 0);
    const success = await persistWebsiteTurn(async () => { await getDb()!.$executeRawUnsafe("INSERT INTO b2_persistence_probe VALUES (2)"); return Response.json({ ok: true }); });
    assert.equal(success.status, 200);
    assert.equal(Number((await db.$queryRawUnsafe<Array<{ count: bigint }>>("SELECT count(*) AS count FROM b2_persistence_probe"))[0].count), 1);
    console.log("PASS actual database rollback and successful commit; temporary rows only");
    const lead = await db.lead.findUniqueOrThrow({ where: { id: "cmton4enk002g1kkxrux8m3y3" }, select: { id: true, propertyId: true } });
    const id = `b2-sla-rollback-probe-${Date.now()}`;
    const rollback = new Error("Intentional probe rollback");
    try { await db.$transaction(tx => withDatabaseTransaction(tx, async () => {
      await getDb()!.aiOperation.create({ data: { id, propertyId: lead.propertyId, leadId: lead.id, kind: "HUMAN_REVIEW", title: "QA rollback-only SLA probe", createdBy: "website-visitor", dueAt: new Date(Date.now() - 60000) } });
      await queueWebsiteHandoverNotifications({ operationId: id });
      await queueWebsiteHandoverNotifications({ operationId: id });
      const jobs = await getDb()!.automationJob.findMany({ where: { triggerRef: id } });
      assert.equal(jobs.length, 2);
      assert.deepEqual(jobs.map(j => j.triggerType).sort(), ["OVERDUE", "REQUEST"]);
      for (const job of jobs) { assert.equal(job.maxAttempts, 3); const result = await deliverWebsiteHandoverNotification(job, true); assert.equal(result.dryRun, true); }
      throw rollback;
    })); } catch (error) { if (error !== rollback) throw error; }
    assert.equal(await db.aiOperation.count({ where: { id } }), 0);
    assert.equal(await db.automationJob.count({ where: { triggerRef: id } }), 0);
    console.log("PASS scoped overdue/request reconciliation, idempotency and recipient dry-run; all probe rows rolled back, no email sent");
    let entered!: () => void, release!: () => void;
    const started = new Promise<void>(r => { entered = r; });
    const held = new Promise<void>(r => { release = r; });
    const key = `b2-synthetic-lock-${Date.now()}`;
    const first = withWebsiteTurnLock(key, async () => { entered(); await held; return Response.json({ ok: true }); });
    await started;
    try { const second = await withWebsiteTurnLock(key, async () => { throw new Error("Overlapping work must not execute"); }); assert.equal(second.status, 409); }
    finally { release(); }
    assert.equal((await first).status, 200);
    assert.equal((await withWebsiteTurnLock(key, async () => Response.json({ ok: true }))).status, 200);
    console.log("PASS actual concurrent database exclusion and post-release reacquisition");
  } finally { await db.$disconnect(); }
}
// Explicit runner exit only after assertions and awaited database cleanup finish.
main().then(() => process.exit(0), () => { console.error("FAIL scoped database acceptance probe"); process.exit(1); });
