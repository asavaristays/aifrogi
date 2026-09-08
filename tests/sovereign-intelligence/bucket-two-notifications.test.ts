import test from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";

const f: any = {};
(globalThis as any).__b2mail = f;
let api: any;
test.before(async () => {
  const stubs: Record<string, string> = { "@/lib/db": "export const getDb=()=>globalThis.__b2mail.db;", "@/lib/services/mailbox-service": "export const sendBookingMail=async(x)=>{globalThis.__b2mail.sent.push(x);return globalThis.__b2mail.result};" };
  const out = await build({ entryPoints: [path.resolve("lib/website-handover-notifications.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "fixtures", setup(b) {
    b.onResolve({ filter: /^@\// }, a => stubs[a.path] ? { path: a.path, namespace: "fixture" } : undefined);
    b.onLoad({ filter: /.*/, namespace: "fixture" }, a => ({ contents: stubs[a.path], loader: "js" }));
  } }] });
  const m = { exports: {} }; new Function("require", "module", "exports", out.outputFiles[0].text)(createRequire(path.resolve("package.json")), m, m.exports); api = m.exports;
});
test.beforeEach(() => {
  f.sent = []; f.result = { error: null, messageId: "fixture-smtp-id" }; f.jobs = new Map();
  f.request = { id: "req", propertyId: "tenant-a", status: "OPEN", dueAt: new Date(Date.now() - 1000), property: { organization: { ownerEmail: "owner@example.invalid", members: [{ email: "owner@example.invalid", status: "ACTIVE", role: "OWNER" }] } } };
  f.db = { aiOperation: { findMany: async () => [f.request], findFirst: async ({ where }: any) => where.propertyId === f.request.propertyId && where.id === f.request.id ? f.request : null }, automationJob: { upsert: async ({ where, create }: any) => { if (!f.jobs.has(where.idempotencyKey)) f.jobs.set(where.idempotencyKey, create); return f.jobs.get(where.idempotencyKey); } } };
});
const job = { propertyId: "tenant-a", triggerRef: "req", triggerType: "REQUEST" };
test("B2-12 SMTP acceptance is not labelled inbox receipt", async () => { const r = await api.deliverWebsiteHandoverNotification(job); assert.equal(r.smtpAccepted, true); assert.equal(r.inboxReceiptVerified, false); assert.equal(f.sent[0].to, "owner@example.invalid"); });
test("B2-13 SMTP rejection throws for bounded queue retry", async () => { f.result = { error: "synthetic failure", messageId: null }; await assert.rejects(api.deliverWebsiteHandoverNotification(job), /not accepted/); });
test("B2-14 overdue requests create one alert job without duplicate notifications", async () => { await api.queueWebsiteHandoverNotifications(); await api.queueWebsiteHandoverNotifications(); assert.equal(f.jobs.size, 2); assert.ok([...f.jobs.values()].every((j: any) => j.maxAttempts === 3)); });
test("B2-14b missing owner fails visibly rather than sending to an unrelated client", async () => { f.request.property.organization.members = []; await assert.rejects(api.deliverWebsiteHandoverNotification(job), /No active/); assert.equal(f.sent.length, 0); });
test("B2-mail-tenant foreign tenant job cannot send request data", async () => { assert.equal((await api.deliverWebsiteHandoverNotification({ ...job, propertyId: "tenant-b" })).skipped, true); assert.equal(f.sent.length, 0); });
test("B2-mail-closed completed requests suppress stale notifications", async () => { f.request.status = "COMPLETED"; assert.equal((await api.deliverWebsiteHandoverNotification(job)).skipped, true); assert.equal(f.sent.length, 0); });
test("B2-mail-dry dry-run never sends", async () => { assert.equal((await api.deliverWebsiteHandoverNotification(job, true)).dryRun, true); assert.equal(f.sent.length, 0); });
test("B2-mail-cycle old retry cannot send after a later handover cycle", async () => { f.request.notes = "Handover cycle: abc-123."; assert.equal((await api.deliverWebsiteHandoverNotification(job)).skipped, true); assert.equal(f.sent.length, 0); });
