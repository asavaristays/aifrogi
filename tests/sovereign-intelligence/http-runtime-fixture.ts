import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";
import { evaluateDecisionBehaviourConsistency } from "../../lib/sovereign-intelligence/evidence-consistency";

// Actual POST handler, retrieval repository, service, HMAC and resolution engine.
// Only infrastructure adapters are replaced. No production tenant or network is used.
export const fixture: any = { claims: [], evidence: [], messages: [], sessions: new Map(), modelAnswer: "", calls: 0, approved: true };
(globalThis as any).__bucketOne = fixture;
process.env.WEBSITE_VISITOR_SESSION_SECRET = "synthetic-bucket-one-test-only-secret";
process.env.OPENAI_API_KEY = "synthetic-not-a-credential";
export const profile = { status: "LIVE", channels: ["WEBSITE"], category: "BUSINESS_AI", kbGateVersion: "1.0", personaName: "Fixture Assistant", personaPackVersion: "1.0", languages: ["EN"], prohibitedClaims: [], escalationTriggers: [], connectors: [], humanHandoffEnabled: true, responseSlaMinutes: 60 };
export const org = { id: "org-a", name: "Fixture Business", isDemo: false, botProfile: profile, updatedAt: new Date(), publicPhone: null, publicEmail: null };
fixture.profile = profile;
const property = { id: "tenant-a", slug: "fixture-a", organization: org };
const matches = (row: any, where: any): boolean => Object.entries(where || {}).every(([key, value]: any) => {
  if (key === "OR") return value.some((part: any) => matches(row, part));
  if (key === "AND") return value.every((part: any) => matches(row, part));
  if (key === "property") return value.slug === "fixture-a" && row.propertyId === "tenant-a";
  if (value && typeof value === "object" && !(value instanceof Date)) return Object.entries(value).every(([op, operand]: any) => op === "in" ? operand.includes(row[key]) : op === "not" ? row[key] !== operand : op === "gt" ? row[key] > operand : op === "lte" ? row[key] <= operand && row[key] !== null : false);
  return row[key] === value;
});
fixture.db = {
  demoSandbox: { findUnique: async ({ where }: any) => org.isDemo && where.organizationId === org.id ? { id: "sandbox-a", status: "READY" } : null },
  demoConnectorEvent: { upsert: async ({ where, create, update }: any) => { const key = where.demoSandboxId_idempotencyKey.idempotencyKey; const old = fixture.connectorEvents.get(key); const row = old ? { ...old, ...update } : create; fixture.connectorEvents.set(key, row); return row; } },
  $transaction: async (fn: any) => {
    const snapshot = structuredClone({ messages: fixture.messages, evidence: fixture.evidence, sessions: fixture.sessions, operations: fixture.operations });
    try { return await fn({ $queryRaw: async () => [{ acquired: !fixture.busy }], ...fixture.db }); }
    catch (error) { Object.assign(fixture, snapshot); throw error; }
  },
  aiOperation: { upsert: async ({ where, create }: any) => { if (fixture.failHandover) throw new Error("Synthetic queue outage"); if (!fixture.operations.has(where.id)) fixture.operations.set(where.id, create); return fixture.operations.get(where.id); } },
  property: { findUnique: async ({ where }: any) => where.slug === property.slug ? property : null },
  knowledgeEntry: {
    updateMany: async ({ where, data }: any) => { const found = fixture.claims.filter((r: any) => matches(r, where)); found.forEach((r: any) => Object.assign(r, data)); return { count: found.length }; },
    findMany: async ({ where, take }: any) => fixture.claims.filter((r: any) => matches(r, where)).slice(0, take)
  },
  lead: { findFirst: async ({ where }: any) => ({ stage: "NEW", tags: fixture.closed ? [{ value: "Resolved" }] : [], messages: fixture.agentMessages.filter((m: any) => m.leadId === where.id) }) },
  leadMessage: { findMany: async ({ where }: any) => fixture.messages.filter((m: any) => m.leadId === where.leadId).slice().reverse(), updateMany: async ({ where, data }: any) => { const found = fixture.agentMessages.filter((m: any) => matches(m, where)); found.forEach((m: any) => Object.assign(m, data)); return { count: found.length }; } },
  sovereignAnswerEvidence: {
    findFirst: async ({ where }: any) => fixture.evidence.filter((e: any) => matches(e, where)).at(-1) || null,
    create: async ({ data }: any) => { if (fixture.failEvidence) throw new Error("Synthetic evidence outage"); const row = { id: `e-${fixture.evidence.length + 1}`, ...data }; fixture.evidence.push(row); return row; }
  },
  websiteVisitorSession: {
    findFirst: async ({ where }: any) => [...fixture.sessions.values()].find((s: any) => matches(s, where)) || null,
    update: async ({ where, data }: any) => { const s: any = [...fixture.sessions.values()].find((v: any) => v.id === where.id); Object.assign(s, data); return s; },
    upsert: async ({ where, create, update }: any) => { const old = fixture.sessions.get(where.leadId); fixture.sessions.set(where.leadId, old ? { ...old, ...update } : { revokedAt: null, ...create }); }
  }
};
fixture.capture = async (input: any) => { const leadId = input.conversationId; fixture.messages.push({ leadId, body: input.message, aiReply: input.aiReply }); return { lead: { id: leadId, propertySlug: input.propertySlug } }; };
const adapters: Record<string, string> = {
  "@/lib/db": "export const getDb=()=>globalThis.__bucketOne.db;export const withDatabaseTransaction=(_tx,work)=>work();",
  "@/lib/repositories/knowledge-repository": "export const readKnowledgeSettings=async()=>({approvedForAi:globalThis.__bucketOne.approved,handoffTopics:[]}); export const writeKnowledgeSettings=async()=>{};",
  "@/lib/repositories/knowledge-content-repository": "export const recordKnowledgeGap=async()=>{};",
  "@/lib/repositories/bot-profile-repository": "export const getBotPersonaForPropertySlug=async()=>globalThis.__bucketOne.profile;",
  "@/lib/services/lead-service": "export const captureIncomingAiBotMessage=(x)=>globalThis.__bucketOne.capture(x);",
  "@/generated/prisma/client": "export const Prisma={};",
  "@/lib/subscription-access": "export const getOrganizationSubscriptionAccess=async()=>({canUsePaidActions:true});"
};
export let POST: any, GET: any, PATCH: any;
test.before(async () => {
const compiled = await build({ entryPoints: [path.resolve("app/api/public/website-bot/[slug]/route.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "isolated-adapters", setup(b) {
  b.onResolve({ filter: /^@\// }, (args) => adapters[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
  b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({ contents: adapters[args.path], loader: "js" }));
} }] });
const module = { exports: {} as any };
new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(path.resolve("package.json")), module, module.exports);
POST = module.exports.POST;
GET = module.exports.GET;
PATCH = module.exports.PATCH;
});
const realFetch = globalThis.fetch;
test.after(() => { globalThis.fetch = realFetch; delete (globalThis as any).__bucketOne; });
globalThis.fetch = async () => { fixture.calls++; return Response.json({ output_text: fixture.modelAnswer }); };
const link = "https://fixture.example/training-booking/";
export function claim(status = "PUBLISHED", extra = {}) { return { id: "claim-a", propertyId: "tenant-a", claimKey: "training", question: "How can I book training?", answer: `Book training at ${link}`, category: "Training", status, conflictStatus: "NONE", version: 1, expiresAt: null, effectiveAt: new Date(0), fieldApprovedBy: "owner", previewApprovedBy: "owner", ...extra }; }
let counter = 0;
export function session() {
  const sessionId = `case-${++counter}`; let visitorToken: string | undefined;
  return async (message: string, extra: any = {}) => {
    const response = await POST(new Request("https://fixture.example/api", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": sessionId }, body: JSON.stringify({ message, sessionId, visitorToken, ...extra }) }), { params: Promise.resolve({ slug: "fixture-a" }) });
    const body = await response.json(); visitorToken = body.visitorToken || visitorToken;
    fixture.lastToken = visitorToken;
    if (response.status === 200 && !body.messageAccepted) { const e = fixture.evidence.at(-1); assert.ok(e, "Successful response requires evidence"); assert.equal(e.answer, body.answer); assert.equal(e.disposition, body.governance.disposition); assert.equal(e.grounded, body.grounded); assert.equal(e.decisionConsistent, true, e.consistencyReason); const check = evaluateDecisionBehaviourConsistency({ disposition: e.disposition, answer: e.answer, resolutionState: e.resolutionState, circuitBreaker: e.circuitBreaker, actionPerformed: e.permittedOperation === "ACT", failureLayer: e.failureLayer }); assert.equal(check.decisionConsistent, true, check.consistencyReason); }
    return { ...body, httpStatus: response.status };
  };
}
test.beforeEach(() => { fixture.claims = [claim()]; fixture.evidence = []; fixture.messages = []; fixture.agentMessages = []; fixture.closed = false; fixture.sessions.clear(); fixture.operations = new Map(); fixture.failHandover = false; profile.humanHandoffEnabled = true; fixture.modelAnswer = `Book training at ${link}. Would you like booking details?`; fixture.calls = 0; fixture.approved = true; fixture.failEvidence = false; });
test.beforeEach(() => { org.isDemo = false; profile.category = "BUSINESS_AI"; fixture.connectorEvents = new Map(); });
