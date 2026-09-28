import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";
import { createRequire } from "node:module";
import path from "node:path";

const f = { access: { organization: { id: "org-a" }, role: "OWNER" } as { organization: { id: string }; role: string } | null, slug: "hotel-a", tenantContext: "", queried: null as unknown, retryCalls: 0, limited: false };
(globalThis as Record<string, unknown>).__levelOneApi = f;
let route: typeof import("../../app/api/onboarding/intelligence/route");
const origin = process.env.NEXT_PUBLIC_APP_URL || "https://app.example";
const request = (from: string | null = new URL(origin).origin) => new Request(`${origin}/api/onboarding/intelligence`, { method: "POST", headers: from ? { origin: from } : {}, body: JSON.stringify({ propertyId: "other-tenant", slug: "hotel-b" }) });
test.before(async () => {
  const adapters: Record<string, string> = {
    "@/lib/client-access": "const f=globalThis.__levelOneApi;export const getCurrentClientAccess=async()=>f.access;export const canManageWorkspace=role=>['OWNER','ADMIN'].includes(role);export const withClientDatabaseContext=async(access,_actor,fn)=>{f.tenantContext=access.organization.id;return fn()}",
    "@/lib/workspace": "export const getCurrentWorkspaceSlug=async()=>globalThis.__levelOneApi.slug",
    "@/lib/db": "export const getDb=()=>({property:{findFirst:async({where})=>{const f=globalThis.__levelOneApi;f.queried=where;return where.slug==='hotel-a'&&where.organizationId==='org-a'?{id:'property-a'}:null}}})",
    "@/lib/rate-limit": "export const consumeRateLimit=()=>({allowed:!globalThis.__levelOneApi.limited})",
    "@/lib/services/level-one-preparation": "export const levelOneStatus=async id=>({propertyId:id,stage:'TESTING'});export const retryLevelOne=async id=>{globalThis.__levelOneApi.retryCalls++;return {propertyId:id,stage:'QUEUED'}}"
  };
  const compiled = await build({ entryPoints: [path.resolve("app/api/onboarding/intelligence/route.ts")], bundle: true, write: false, platform: "node", format: "cjs", packages: "external", plugins: [{ name: "synthetic-adapters", setup(b) {
    b.onResolve({ filter: /^@\// }, args => adapters[args.path] ? { path: args.path, namespace: "fixture" } : undefined);
    b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: adapters[args.path], loader: "js" }));
  } }] });
  const mod = { exports: {} as typeof route };
  new Function("require", "module", "exports", compiled.outputFiles[0].text)(createRequire(path.resolve("package.json")), mod, mod.exports);
  route = mod.exports;
});
test.beforeEach(() => Object.assign(f, { access: { organization: { id: "org-a" }, role: "OWNER" }, slug: "hotel-a", tenantContext: "", queried: null, retryCalls: 0, limited: false }));
test.after(() => { delete (globalThis as Record<string, unknown>).__levelOneApi; });
test("status requires a signed-in member and disables shared caching", async () => {
  f.access = null; assert.equal((await route.GET()).status, 401);
  f.access = { organization: { id: "org-a" }, role: "VIEWER" };
  const response = await route.GET(); assert.equal(response.status, 200); assert.equal(response.headers.get("cache-control"), "no-store"); assert.equal(f.tenantContext, "org-a");
});
test("retry rejects absent/cross-site origin, insufficient role and rate-limit excess", async () => {
  assert.equal((await route.POST(request(null))).status, 403);
  assert.equal((await route.POST(request("https://evil.example"))).status, 403);
  f.access!.role = "VIEWER"; assert.equal((await route.POST(request())).status, 403);
  f.access!.role = "OWNER"; f.limited = true; assert.equal((await route.POST(request())).status, 429); assert.equal(f.retryCalls, 0);
});
test("property comes from the authenticated tenant, never caller-supplied IDs", async () => {
  const response = await route.POST(request()); assert.equal(response.status, 200);
  assert.deepEqual(f.queried, { slug: "hotel-a", organizationId: "org-a" }); assert.equal((await response.json()).preparation.propertyId, "property-a");
  f.slug = "hotel-b"; assert.equal((await route.GET()).status, 404);
});
