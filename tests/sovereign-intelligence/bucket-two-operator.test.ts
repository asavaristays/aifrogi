import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import path from "node:path";
import { createRequire } from "node:module";

const f: any = {};
(globalThis as any).__b2operator = f;
let POST: any;
test.before(async () => {
  const adapters: Record<string, string> = {
    "@/generated/prisma/client": "export const Prisma={DbNull:null};",
    "@/lib/auth-server": "export const getCurrentUser=async()=>globalThis.__b2operator.user;",
    "@/lib/client-access": "export const getCurrentClientAccess=async()=>globalThis.__b2operator.access;",
    "@/lib/workspace": "export const getCurrentWorkspaceSlug=async()=>globalThis.__b2operator.slug;",
    "@/lib/services/lead-service": "export const loadLead=async()=>globalThis.__b2operator.lead;export const appendLeadMessage=async()=>{throw Error('Wrong transport')};",
    "@/lib/db": "export const getDb=()=>globalThis.__b2operator.db;"
  };
  const compiled = await build({ entryPoints: [path.resolve("app/api/leads/[id]/messages/route.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "fixture", setup(b) {
    b.onResolve({ filter: /^@\// }, a => adapters[a.path] ? { path: a.path, namespace: "fixture" } : undefined);
    b.onLoad({ filter: /.*/, namespace: "fixture" }, a => ({ contents: adapters[a.path], loader: "js" }));
  } }] });
  const m = { exports: {} as any }; new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(path.resolve("package.json")), m, m.exports); POST = m.exports.POST;
});
test.beforeEach(() => {
  f.user = { username: "agent@example.invalid", role: "hotel_owner" }; f.access = { role: "AGENT", membership: { status: "ACTIVE" }, organization: { properties: [{ slug: "tenant-a" }] } }; f.slug = "tenant-a"; f.lead = { propertySlug: "tenant-a", tags: ["Website Bot"] }; f.status = "HUMAN_REQUESTED"; f.replies = []; f.audit = []; f.operation = {}; f.revokedAt = null;
  const tx = {
    $queryRaw: async () => [{ acquired: !f.busy }],
    websiteVisitorSession: { update: async ({ data }: any) => Object.assign(f, data), updateMany: async ({ data }: any) => { if (f.status === "CLOSED") return { count: 0 }; Object.assign(f, data); return { count: 1 }; }, findUniqueOrThrow: async () => ({ propertyId: "p-a", sessionIdHash: "fixture-session", revokedAt: f.revokedAt, expiresAt: new Date(Date.now() + 60000) }) },
    leadMessage: { create: async ({ data }: any) => { f.replies.push(data); } }, lead: { update: async () => ({}) }, leadTag: { create: async () => ({}), deleteMany: async () => ({ count: 1 }) },
    aiOperation: { updateMany: async ({ data }: any) => Object.assign(f.operation, data) }, platformAuditLog: { create: async ({ data }: any) => { f.audit.push(data); } }
  };
  f.db = { $transaction: async (fn: any) => fn(tx) };
});
async function send(payload: any) { return POST(new Request("https://fixture.invalid/api", { method: "POST", body: JSON.stringify(payload), headers: { "Content-Type": "application/json" } }), { params: Promise.resolve({ id: "lead-a" }) }); }
test("B2-05a unauthenticated operator rejected", async () => { f.user = null; assert.equal((await send({ body: "hello" })).status, 401); assert.equal(f.replies.length, 0); });
test("B2-05b viewer rejected", async () => { f.access.role = "VIEWER"; assert.equal((await send({ body: "hello" })).status, 403); });
test("B2-05c unrelated tenant rejected despite workspace cookie", async () => { f.access.organization.properties = [{ slug: "tenant-b" }]; assert.equal((await send({ body: "hello" })).status, 404); });
test("B2-07 reply assigns ownership and records operator audit", async () => { assert.equal((await send({ body: "Human reply" })).status, 200); assert.equal(f.status, "HUMAN_JOINED"); assert.equal(f.replies[0].sender, "AGENT"); assert.equal(f.operation.assignedTo, f.user.username); assert.equal(f.audit[0].action, "WEBSITE_HUMAN_REPLY"); });
test("B2-07b operator cannot impersonate AI", async () => { assert.equal((await send({ body: "hello", sender: "AI" })).status, 400); assert.equal(f.replies.length, 0); });
test("B2-11b close records audit without revoking final-reply access", async () => { assert.equal((await send({ action: "CLOSE_WEBSITE_CONVERSATION" })).status, 200); assert.equal(f.status, "CLOSED"); assert.equal(f.revokedAt, null); assert.equal(f.audit[0].action, "WEBSITE_CONVERSATION_CLOSED"); });
test("B2-11c closed conversation rejects operator reply", async () => { f.status = "CLOSED"; assert.equal((await send({ body: "hello" })).status, 409); assert.equal(f.replies.length, 0); });
test("B2-takeover busy visitor turn blocks operator write", async () => { f.busy = true; try { assert.equal((await send({ body: "hello" })).status, 409); assert.equal(f.replies.length, 0); } finally { f.busy = false; } });
test("B2-resume agent cannot silently resume AI", async () => { assert.equal((await send({ action: "RESUME_WEBSITE_AI" })).status, 403); assert.equal(f.status, "HUMAN_REQUESTED"); });
test("B2-resume owner resumes AI with reset marker and audit", async () => { f.access.role = "OWNER"; f.status = "HUMAN_JOINED"; assert.equal((await send({ action: "RESUME_WEBSITE_AI" })).status, 200); assert.equal(f.status, "AI_READY"); assert.ok(f.resolutionState.aiResumedAt); assert.equal(f.operation.status, "COMPLETED"); assert.equal(f.audit[0].action, "WEBSITE_AI_RESUMED"); });
test("B2-resume terminal lead cannot misleadingly resume", async () => { f.access.role = "OWNER"; f.lead.stage = "WON"; assert.equal((await send({ action: "RESUME_WEBSITE_AI" })).status, 409); assert.equal(f.audit.length, 0); });
