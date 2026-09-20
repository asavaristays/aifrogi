import assert from "node:assert/strict";
import test from "node:test";
import { estimatedUsageCostPaisa, recordTenantAnswerUsage } from "../../lib/tenant-usage-metering";
import { withDatabaseIdentity } from "../../lib/db";

test("usage metering calculates tenant cost from configured token rates", () => {
  assert.equal(estimatedUsageCostPaisa({ inputTokens: 500_000, outputTokens: 250_000, model: "test", attempts: 1, latencyMs: 10 }, { inputPaisaPerMillion: 100, outputPaisaPerMillion: 400 }), 150);
});

test("usage metering never invents an unconfigured price", () => {
  assert.equal(estimatedUsageCostPaisa({ inputTokens: 1000, outputTokens: 1000, model: "test", attempts: 1, latencyMs: 10 }, { inputPaisaPerMillion: 0, outputPaisaPerMillion: 0 }), 0);
});

test("metering writes all four metrics inside the identity-bound transaction", async () => {
  const previousDb = globalThis.__prisma__;
  const previousUrl = process.env.DATABASE_URL;
  const writes: unknown[] = [];
  let identitySettings = 0;
  const transaction = {
    $queryRaw: async () => { identitySettings++; },
    usageRecord: { upsert: async (args: unknown) => { writes.push(args); return {}; } }
  };
  globalThis.__prisma__ = {
    $transaction: async (work: unknown) => {
      assert.equal(typeof work, "function", "RLS requires callback transactions");
      return (work as (tx: typeof transaction) => Promise<unknown>)(transaction);
    },
    usageRecord: { upsert: () => { throw new Error("Write escaped transaction"); } }
  } as unknown as NonNullable<typeof globalThis.__prisma__>;
  process.env.DATABASE_URL = "postgresql://unused/test";
  try {
    await withDatabaseIdentity({ organizationId: "tenant-a", platformAuthority: false, actor: "test", systemPurpose: "metering-test" }, () => recordTenantAnswerUsage({
      organizationId: "tenant-a", evidenceId: "case-1", certification: true,
      usage: { inputTokens: 20, outputTokens: 5, attempts: 1, latencyMs: 10, model: "test" }
    }));
    assert.equal(identitySettings, 4);
    assert.equal(writes.length, 4);
    for (const write of writes) {
      const row = write as { create: { organizationId: string; idempotencyKey: string } };
      assert.equal(row.create.organizationId, "tenant-a");
      assert.match(row.create.idempotencyKey, /^cert:case-1:/);
    }
  } finally {
    globalThis.__prisma__ = previousDb;
    if (previousUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousUrl;
  }
});
