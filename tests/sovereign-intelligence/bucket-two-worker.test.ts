import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";
const f: any = {};
(globalThis as any).__b2worker = f;
let api: any;
test.before(async () => {
  const stubs: Record<string, string> = {
    "@/lib/db": "export const getDb=()=>globalThis.__b2worker.db;",
    "../generated/prisma/client": "export const Prisma={};",
    "@/lib/website-handover-notifications": "export const WEBSITE_HANDOVER_EMAIL='WEBSITE_HANDOVER_EMAIL';export const deliverWebsiteHandoverNotification=async()=>{globalThis.__b2worker.sent++;return {smtpAccepted:true,inboxReceiptVerified:false};};",
    "@/lib/services/whatsapp-service": "export const sendWhatsAppTemplateMessage=async()=>{throw Error('Outside test scope')};",
    "@/lib/repositories/campaign-repository": "export const finalizeCampaignRun=async()=>{};export const recordCampaignRecipientResult=async()=>{};",
    "@/lib/subscription-access": "export const getOrganizationSubscriptionAccess=async()=>null;",
    "@/lib/services/mailbox-service": "export const sendBookingMail=async()=>{throw Error('Outside test scope')};"
  };
  const out = await build({ entryPoints: [path.resolve("lib/automation-engine.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "worker-fixtures", setup(b) {
    b.onResolve({ filter: /.*/ }, a => stubs[a.path] ? { path: a.path, namespace: "fixture" } : undefined);
    b.onLoad({ filter: /.*/, namespace: "fixture" }, a => ({ contents: stubs[a.path], loader: "js" }));
  } }] });
  const m = { exports: {} }; new Function("require", "module", "exports", out.outputFiles[0].text)(createRequire(path.resolve("package.json")), m, m.exports); api = m.exports;
});
test.beforeEach(() => { f.sent = 0; f.writes = []; f.acquired = true; f.db = { automationJob: { updateMany: async (input: any) => { f.writes.push(input); return { count: f.acquired ? 1 : 0 }; } } }; });
const job = { id: "job", actionType: "WEBSITE_HANDOVER_EMAIL", propertyId: "tenant", attemptCount: 1, maxAttempts: 3, lockedBy: "worker-a" };
test("B2-worker expired lease cannot send", async () => { f.acquired = false; assert.equal(await api.executeAutomationJob(job), null); assert.equal(f.sent, 0); });
test("B2-worker successful send is lease-fenced and never claims inbox receipt", async () => { await api.executeAutomationJob(job); assert.equal(f.sent, 1); assert.equal(f.writes[0].where.lockedBy, "worker-a"); assert.equal(f.writes[1].where.attemptCount, 1); assert.equal(f.writes[1].data.status, "SUCCEEDED"); assert.equal(f.writes[1].data.result.inboxReceiptVerified, false); });
test("B2-worker first failure schedules bounded retry", async () => { await api.failAutomationJob(job, new Error("Synthetic SMTP failure")); assert.equal(f.writes[0].data.status, "RETRY"); assert.ok(f.writes[0].data.nextRunAt > new Date()); assert.equal(f.writes[0].where.lockedBy, "worker-a"); });
test("B2-worker third failure is dead-lettered visibly", async () => { await api.failAutomationJob({ ...job, attemptCount: 3 }, new Error("Synthetic SMTP failure")); assert.equal(f.writes[0].data.status, "DEAD"); assert.equal(f.writes[0].data.deadLetterReason, "Synthetic SMTP failure"); assert.equal(f.writes[0].where.attemptCount, 3); });
