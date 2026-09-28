/* Synthetic infrastructure; real preparation state machine and activation gate. */
import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const f: any = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__levelOne = f;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matches(row: any, where: any): boolean {
  return Object.entries(where || {}).every(([key, v]) => {
    const value = v as Record<string, unknown>;
    if (key === "OR") return (v as object[]).some(part => matches(row, part));
    if (value instanceof Date) return +row[key] === +value;
    if (value && typeof value === "object") return Object.entries(value).every(([op, arg]) => op === "in" ? (arg as unknown[]).includes(row[key]) : op === "notIn" ? !(arg as unknown[]).includes(row[key]) : op === "is" ? Boolean(row[key]) && matches(row[key], arg) : op === "some" ? row[key].some((item: unknown) => matches(item, arg)) : op === "gt" ? row[key] > arg! : op === "lt" ? row[key] < arg! : op === "lte" ? row[key] <= arg! : false);
    return row[key] === v;
  });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function update(row: any, data: any) { for (const [key, value] of Object.entries(data)) row[key] = value && typeof value === "object" && "increment" in value ? row[key] + value.increment : value; }
const db = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $transaction: async (work: any) => { const before = structuredClone({ job: f.job, property: f.property, activities: f.activities }); try { return await work(db); } catch (e) { Object.assign(f, before); throw e; } },
  property: { findUnique: async () => structuredClone(f.property) },
  knowledgeEntry: { findMany: async () => structuredClone(f.entries) },
  automationJob: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    findFirst: async ({ where }: any) => matches(f.job, where) ? structuredClone(f.job) : null,
    findUnique: async () => structuredClone(f.job), findUniqueOrThrow: async () => structuredClone(f.job),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateMany: async ({ where, data }: any) => { if (!matches(f.job, where)) return { count: 0 }; update(f.job, data); return { count: 1 }; }
  },
  botProfile: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateMany: async ({ where, data }: any) => { f.beforeActivation?.(); if (f.activationRace || !matches({ ...f.property.organization.botProfile, organization: f.property.organization }, where)) return { count: 0 }; update(f.property.organization.botProfile, data); return { count: 1 }; }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onboardingActivity: { create: async ({ data }: any) => { f.activities.push(data); } }
};
const adapters: Record<string, string> = {
  "@/lib/db": "export const getDb=()=>globalThis.__levelOne.db; export const withDatabaseIdentity=(identity,fn)=>{globalThis.__levelOne.identities.push(identity);return fn()}",
  "@/lib/repositories/knowledge-repository": "export const readKnowledgeSettings=async()=>structuredClone(globalThis.__levelOne.settings);export const writeKnowledgeSettings=async(_slug,data)=>{Object.assign(globalThis.__levelOne.settings,data);return structuredClone(globalThis.__levelOne.settings)}",
  "@/lib/services/website-knowledge-service": "export const readCachedKnowledgeBase=async()=>structuredClone(globalThis.__levelOne.snapshot);export const getWebsiteKnowledgeBase=async()=>{const f=globalThis.__levelOne;f.crawls++;if(f.crawlError)throw Error('synthetic network outage');f.settings.status=f.staleFallback?'ERROR':'READY';return structuredClone(f.snapshot)};export const buildWebsiteKnowledgeAnswer=async(input)=>globalThis.__levelOne.answer(input)",
  "@/lib/subscription-access": "export const getOrganizationSubscriptionAccess=async()=>{const f=globalThis.__levelOne;return {canUsePaidActions:f.entitled,trialEndsAt:f.expired?new Date(0):null}}",
  "@/lib/sovereign-intelligence/answer-grounding": "export const reviewAnswerGrounding=async()=>({supported:!globalThis.__levelOne.failReview,complete:true,issues:[],claims:[{kind:'FACT',supported:true,evidenceQuotes:['Hotel has cottages.']}],inputTokens:10,outputTokens:10})",
  "@/lib/tenant-usage-metering": "export const recordTenantAnswerUsage=async(input)=>{globalThis.__levelOne.usage.push(input)}"
};
let runtime: typeof import("../../lib/services/level-one-preparation");
const runLevelOnePreparation = () => runtime.runLevelOnePreparation();
const executeLevelOneJob: typeof runtime.executeLevelOneJob = job => runtime.executeLevelOneJob(job);
const retryLevelOne = (id: string) => runtime.retryLevelOne(id);
test.before(async () => {
const bundled = await build({ entryPoints: [path.resolve("lib/services/level-one-preparation.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "synthetic-adapters", setup(b) {
  b.onResolve({ filter: /^@\/lib\// }, args => adapters[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
  b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: adapters[args.path], loader: "js" }));
} }] });
const mod = { exports: {} as typeof import("../../lib/services/level-one-preparation") };
new Function("require", "module", "exports", bundled.outputFiles[0].text)(createRequire(path.resolve("package.json")), mod, mod.exports);
runtime = mod.exports;
});
const priorKey = process.env.OPENAI_API_KEY;
test.beforeEach(() => {
  const now = new Date();
  Object.assign(f, { db, identities: [], entries: [], activities: [], usage: [], calls: 0, crawls: 0, entitled: true, expired: false, failReview: false, staleFallback: false, crawlError: false, activationRace: false, mutate: null, beforeActivation: null,
    property: { id: "p1", slug: "hotel", organizationId: "org1", organization: { id: "org1", name: "Hotel", website: "https://hotel.example", status: "ONBOARDING", updatedAt: now, members: [{ email: "owner@example.test", status: "ACTIVE", role: "OWNER", invitedBy: "SELF_SERVICE_REGISTRATION" }], botProfile: { organizationId: "org1", category: "STAY", operatingMode: "LEAD_CAPTURE", channels: ["WEBSITE"], capabilities: ["ANSWER_QUESTIONS"], status: "DRAFT", updatedAt: now } } },
    settings: { sourceUrl: "https://hotel.example", status: "DRAFT", approvedForAi: true, updatedAt: now.toISOString() },
    snapshot: { baseUrl: "https://hotel.example", crawledAt: now.toISOString(), pages: ["/", "/stay"].map(p => ({ url: `https://hotel.example${p}`, text: "Hotel has cottages.", title: "Hotel" })), structuredFacts: ["business_name", "address", "phone", "rooms", "amenities"].map(field => ({ field, sourceType: "WEBSITE", sourceUrl: "https://hotel.example/" })), truthReview: { counts: { conflicts: 0, stale: 0 } }, crawlReport: { readiness: "READY", reasons: [] } },
    job: { id: "job1", propertyId: "p1", idempotencyKey: "level-one:p1", actionType: "PREPARE_LEVEL_ONE", status: "QUEUED", attemptCount: 0, maxAttempts: 3, nextRunAt: new Date(0), result: { stage: "QUEUED", rows: [] } }
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f.answer = async (input: any) => { f.calls++; f.mutate?.(input); return { answer: "We have cottages.", sourceUrls: ["https://hotel.example/stay"], model: input.question.includes("guest who") || input.question.startsWith("Book") ? "CONSTITUTIONAL" : "MODEL", decision: { disposition: input.question.includes("guest who") ? "REFUSE" : "ANSWER" }, reliability: { failureCode: null, attemptCount: 1 }, modelUsage: { inputTokens: 10, outputTokens: 10 } }; };
  process.env.OPENAI_API_KEY = "synthetic-test-only";
});
test.after(() => { if (priorKey === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = priorKey; delete (globalThis as Record<string, unknown>).__levelOne; });

test("verified hotel advances through durable batches and becomes live only after all eight checks", async () => {
  await runLevelOnePreparation();
  assert.equal(f.job.result.stage, "TESTING"); assert.equal(f.calls, 0);
  for (let i = 0; i < 3; i++) { await runLevelOnePreparation(); assert.equal(f.property.organization.botProfile.status, "DRAFT"); }
  await runLevelOnePreparation();
  assert.equal(f.job.status, "SUCCEEDED"); assert.equal(f.job.result.rows.length, 8);
  assert.equal(f.property.organization.botProfile.status, "LIVE"); assert.equal(f.activities.length, 1); assert.equal(f.usage.length, 8);
  assert.deepEqual(await runLevelOnePreparation(), { processed: 0 });
  assert.ok(f.identities.some((i: { organizationId: string; platformAuthority: boolean }) => i.organizationId === "org1" && !i.platformAuthority));
});
test("review-required capture cannot activate and supports explicit retry", async () => {
  f.snapshot.crawlReport.readiness = "REVIEW_REQUIRED";
  await runLevelOnePreparation(); assert.equal(f.job.status, "DEAD"); assert.equal(f.calls, 0);
  await retryLevelOne("p1"); assert.equal(f.job.status, "QUEUED"); assert.deepEqual(f.job.result.rows, []);
});
test("failed refresh with an old snapshot is retried, never passed", async () => {
  f.staleFallback = true;
  for (let n = 0; n < 3; n++) { f.job.nextRunAt = new Date(0); await runLevelOnePreparation(); }
  assert.equal(f.job.status, "DEAD"); assert.equal(f.calls, 0); assert.equal(f.property.organization.botProfile.status, "DRAFT");
});
test("failed real-answer review stops preparation with the answer visible", async () => {
  await runLevelOnePreparation(); f.failReview = true; await runLevelOnePreparation();
  assert.equal(f.job.status, "DEAD"); assert.equal(f.job.result.rows.length, 2); assert.equal(f.job.result.rows[0].passed, false);
});
test("changed governed knowledge invalidates the checked source revision", async () => {
  await runLevelOnePreparation(); f.entries.push({ id: "new", status: "PUBLISHED", updatedAt: new Date() }); await runLevelOnePreparation();
  assert.equal(f.job.status, "DEAD"); assert.equal(f.calls, 0);
});
test("paused knowledge is never silently re-enabled at activation", async () => {
  for (let n = 0; n < 4; n++) await runLevelOnePreparation();
  f.mutate = () => { f.settings.approvedForAi = false; };
  await runLevelOnePreparation();
  assert.equal(f.settings.approvedForAi, false); assert.equal(f.job.status, "DEAD"); assert.equal(f.property.organization.botProfile.status, "DRAFT");
});
test("trial expiry and a concurrent lifecycle edit both prevent the final commit", async () => {
  for (let n = 0; n < 4; n++) await runLevelOnePreparation();
  f.expired = true; await runLevelOnePreparation();
  assert.notEqual(f.job.status, "SUCCEEDED"); assert.equal(f.property.organization.botProfile.status, "DRAFT");
  f.expired = false; f.activationRace = true; f.job.nextRunAt = new Date(0); await runLevelOnePreparation();
  assert.notEqual(f.job.status, "SUCCEEDED"); assert.equal(f.activities.length, 0);
});
test("lease owner changes stop an old worker from publishing", async () => {
  for (let n = 0; n < 4; n++) await runLevelOnePreparation();
  f.mutate = () => { f.job.lockedBy = "replacement-worker"; };
  await runLevelOnePreparation();
  assert.notEqual(f.job.status, "SUCCEEDED"); assert.equal(f.property.organization.botProfile.status, "DRAFT");
});
test("owner revocation immediately before activation rolls back readiness", async () => {
  for (let n = 0; n < 4; n++) await runLevelOnePreparation();
  f.beforeActivation = () => { f.property.organization.members = []; };
  await runLevelOnePreparation();
  assert.notEqual(f.job.status, "SUCCEEDED"); assert.equal(f.property.organization.botProfile.status, "DRAFT"); assert.equal(f.activities.length, 0);
});
test("organization removal immediately before activation rolls back readiness", async () => {
  for (let n = 0; n < 4; n++) await runLevelOnePreparation();
  f.beforeActivation = () => { f.property.organization.status = "REMOVED"; };
  await runLevelOnePreparation();
  assert.notEqual(f.job.status, "SUCCEEDED"); assert.equal(f.property.organization.botProfile.status, "DRAFT"); assert.equal(f.activities.length, 0);
});
test("expired leases recover, but a valid lease is not stolen", async () => {
  f.job.status = "RUNNING"; f.job.lockedBy = "old-worker"; f.job.leaseExpiresAt = new Date(Date.now() + 60000);
  assert.deepEqual(await runLevelOnePreparation(), { processed: 0 });
  f.job.leaseExpiresAt = new Date(0); await runLevelOnePreparation(); assert.equal(f.job.status, "QUEUED"); assert.equal(f.job.result.stage, "TESTING");
});
test("unverified owner, wrong category and paused bot are not activated", async () => {
  for (const change of [() => { f.property.organization.members = []; }, () => { f.property.organization.botProfile.category = "BUSINESS_AI"; }, () => { f.property.organization.botProfile.status = "PAUSED"; }]) {
    change(); f.job.status = "RUNNING"; f.job.lockedBy = "test"; f.job.leaseExpiresAt = new Date(Date.now() + 60000);
    await executeLevelOneJob(structuredClone(f.job)); assert.equal(f.job.status, "DEAD"); assert.equal(f.calls, 0);
  }
});
