import test from "node:test";
import assert from "node:assert/strict";
import { validPilotPolicy, reservePilotAttempt, CASTLE_PILOT_TENANT } from "../../lib/typesafe-pilot-store";

test("policy rejects expiry, invalid caps, disabled and missing configuration", () => {
  const now = Date.now();
  const good = { enabled: true, expiresAt: new Date(now + 10000).toISOString(), dailyLimit: 20 };
  assert.equal(validPilotPolicy(good, now), true);
  for (const bad of [null, {}, { ...good, enabled: false }, { ...good, expiresAt: "bad" }, { ...good, expiresAt: new Date(now).toISOString() }, { ...good, dailyLimit: 21 }, { ...good, dailyLimit: 0 }, { ...good, dailyLimit: 1.5 }]) assert.equal(validPilotPolicy(bad, now), false);
});

test("durable quota counts failures and legacy samples; lock/expiry/errors fail closed", async () => {
  const previousDb = globalThis.__prisma__, previousUrl = process.env.DATABASE_URL;
  let count = 0, legacy = 2, locked = true, recent = false, offline = false;
  const policy = { enabled: true, expiresAt: new Date(Date.now()+60000).toISOString(), dailyLimit: 20 };
  const tx = {
    $queryRaw: async () => [{ acquired: locked }],
    platformAuditLog: {
      findFirst: async (args: { where: { action: string } }) => args.where.action === "TYPESAFE_PILOT_CONTROL" ? { metadata: policy } : recent ? {} : null,
      count: async (args: { where: { action: string } }) => args.where.action === "TYPESAFE_SHADOW_RESERVED" ? count : legacy,
      create: async () => { count++; return {}; }
    }
  };
  globalThis.__prisma__ = { $transaction: async (work: (tx: unknown) => Promise<unknown>) => { if (offline) throw Error("offline"); return work(tx); } } as unknown as NonNullable<typeof globalThis.__prisma__>;
  process.env.DATABASE_URL = "postgresql://unused/test";
  try {
    assert.equal(await reservePilotAttempt("other-tenant"), false);
    locked = false; assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT), false);
    locked = true; recent = true; assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT), false);
    recent = false;
    for (let i=0;i<18;i++) assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT), true);
    assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT), false);
    assert.equal(count,18);
    count=0; legacy=0; policy.enabled=false; assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT),false);
    policy.enabled=true; policy.expiresAt="2000-01-01"; assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT),false);
    offline=true; assert.equal(await reservePilotAttempt(CASTLE_PILOT_TENANT),false);
  } finally {
    globalThis.__prisma__=previousDb;
    if(previousUrl===undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL=previousUrl;
  }
});
