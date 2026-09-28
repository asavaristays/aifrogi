import test from "node:test";
import assert from "node:assert/strict";
import { assertCommercialLaunchInventory, readCommercialLaunchInventory } from "../../lib/commercial-launch-checks";

const healthy = { organizations: 3, liveBots: 3, openIncidents: 0, blockingIncidents: 0, deadJobs: 0 };

test("empty RLS inventory, severe incidents and dead jobs cannot produce a launch pass", () => {
  assert.doesNotThrow(() => assertCommercialLaunchInventory(healthy));
  assert.doesNotThrow(() => assertCommercialLaunchInventory({ ...healthy, openIncidents: 1 }));
  for (const change of [{ organizations: 0 }, { liveBots: 0 }, { blockingIncidents: 1 }, { deadJobs: 1 }, { liveBots: NaN }, { deadJobs: -1 }]) {
    assert.throws(() => assertCommercialLaunchInventory({ ...healthy, ...change }), /Commercial launch blocked/);
  }
});

test("inventory establishes read-only transaction authority before tenant queries", async () => {
  const calls: string[] = [];
  const tx = {
    $executeRaw: async (sql: TemplateStringsArray) => { assert.match(sql.join(""), /SET TRANSACTION READ ONLY/); calls.push("readonly"); },
    $queryRaw: async (sql: TemplateStringsArray) => { assert.deepEqual(calls, ["readonly"]); assert.match(sql.join(""), /set_config\('app.platform_authority', 'true', true\)/); calls.push("identity"); },
    organization: { count: async (args: unknown) => { assert.deepEqual(calls, ["readonly", "identity"]); assert.deepEqual(args, { where: { isDemo: false } }); return 3; } },
    botProfile: { count: async (args: unknown) => { assert.deepEqual(args, { where: { status: "LIVE", organization: { isDemo: false } } }); return 3; } },
    platformIncident: { count: async (args: { where: { severity?: unknown; status: unknown } }) => { assert.deepEqual(args.where.status, { notIn: ["RESOLVED", "CLOSED"] }); if (args.where.severity) assert.deepEqual(args.where.severity, { notIn: ["LOW", "MEDIUM"] }); return 0; } },
    automationJob: { count: async (args: unknown) => { assert.deepEqual(args, { where: { status: "DEAD" } }); return 0; } }
  };
  const db = { $transaction: async (work: (client: typeof tx) => Promise<unknown>) => work(tx) } as unknown as Parameters<typeof readCommercialLaunchInventory>[0];
  assert.deepEqual(await readCommercialLaunchInventory(db), healthy);
});
