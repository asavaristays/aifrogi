import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";

const f = { prepare: async () => ({ processed: 0 }), calls: [] as string[] };
(globalThis as Record<string, unknown>).__levelOneCron = f;
let route: typeof import("../../app/api/automation/run/route");
const priorSecret = process.env.AUTOMATION_CRON_SECRET;
const request = (authorized = true) => new Request("https://app.example/api/automation/run", { method: "POST", headers: authorized ? { authorization: "Bearer synthetic-cron-secret" } : {} });
test.before(async () => {
  const adapters: Record<string, string> = {
    "@/lib/security/tenant-database-context": "export const withSystemDatabaseIdentity=async(_actor,_purpose,fn)=>fn()",
    "@/lib/services/level-one-preparation": "export const runLevelOnePreparation=()=>globalThis.__levelOneCron.prepare()"
  };
  for (const [module, name] of [
    ["automation-engine", "runDueAutomationJobs"],
    ["repositories/knowledge-verification-repository", "processKnowledgeFlagSla"],
    ["subscription-lifecycle", "processSubscriptionLifecycleBatch"],
    ["support-email-sync", "importSupportEmailReplies"],
    ["website-handover-notifications", "queueWebsiteHandoverNotifications"],
    ["services/website-knowledge-service", "refreshDueTenantKnowledge"]
  ]) adapters[`@/lib/${module}`] = `export const ${name}=async()=>{globalThis.__levelOneCron.calls.push('${name}');return {processed:0}}`;
  const compiled = await build({ entryPoints: [path.resolve("app/api/automation/run/route.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "synthetic-adapters", setup(b) {
    b.onResolve({ filter: /^@\// }, args => adapters[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
    b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: adapters[args.path], loader: "js" }));
  } }] });
  const mod = { exports: {} as typeof route };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(path.resolve("package.json")), mod, mod.exports);
  route = mod.exports;
});
test.beforeEach(() => { f.calls = []; f.prepare = async () => ({ processed: 0 }); process.env.AUTOMATION_CRON_SECRET = "synthetic-cron-secret"; });
test.after(() => { if (priorSecret === undefined) delete process.env.AUTOMATION_CRON_SECRET; else process.env.AUTOMATION_CRON_SECRET = priorSecret; delete (globalThis as Record<string, unknown>).__levelOneCron; });

test("unauthorized cron requests start neither preparation nor normal work", async () => {
  f.prepare = async () => { throw new Error("Must not run"); };
  assert.equal((await route.POST(request(false))).status, 401); assert.deepEqual(f.calls, []);
});
test("a preparation failure remains observable without suppressing ordinary cron work", async () => {
  f.prepare = async () => { throw new Error("Synthetic database outage"); };
  const response = await route.POST(request());
  assert.equal(response.status, 503); assert.equal((await response.json()).status, "degraded"); assert.equal(f.calls.length, 6);
});
test("ordinary cron work completes while website preparation is still waiting", async () => {
  let finish!: (value: { processed: number }) => void;
  f.prepare = () => new Promise(resolve => { finish = resolve; });
  const pending = route.POST(request());
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(f.calls.length, 6);
  finish({ processed: 1 });
  assert.equal((await pending).status, 200);
});
