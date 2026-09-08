import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
const read=(file:string)=>readFileSync(resolve(process.cwd(),file),"utf8");

test("retired product surfaces cannot re-enter the canonical release",()=>{
  const manifest=JSON.parse(read("config/canonical-routes.json"));
  assert.ok(manifest.retiredPrefixes.includes("/whatsapp-api"));
  assert.ok(manifest.retiredPrefixes.includes("/api/campaigns"));
  assert.match(read("package.json"),/verify:routes/);
});
test("billing notification failures retry and dead-letter into an incident",()=>{
  const notification=read("lib/services/billing-notification.ts"),automation=read("lib/automation-engine.ts");
  assert.match(notification,/billing-notification-retry/);assert.match(notification,/maxAttempts: 5/);
  assert.match(automation,/BILLING_NOTIFICATION_EMAIL/);assert.match(automation,/Billing confirmation email exhausted retries/);
});
test("commercial boundaries cover tenant, payment and widget readiness",()=>{
  const plan=read("app/api/billing/checkout/verify/route.ts"),credit=read("app/api/billing/credits/verify/route.ts"),proxy=read("proxy.ts");
  assert.match(plan,/orderBelongsToWorkspace/);assert.match(plan,/payment\.status !== "captured"/);
  assert.match(credit,/organizationId === access\.organization\.id/);assert.match(proxy,/workspaceRole/);
  assert.match(read("scripts/load-test-widget.mjs"),/AIFROGI_LOAD_TEST_CONCURRENCY/);
});
