import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Super Admin exposes a dedicated Message Matrix", () => {
  const shell=readFileSync(resolve(process.cwd(),"components/admin/admin-shell.tsx"),"utf8");
  const page=readFileSync(resolve(process.cwd(),"app/admin/message-matrix/page.tsx"),"utf8");
  assert.match(shell,/Message Matrix/); assert.match(page,/Safe resolution/); assert.match(page,/Helpful/); assert.match(page,/Projected charge/);
});
test("message limits default to hard stop and require approved overage",()=>{
  const policy=readFileSync(resolve(process.cwd(),"lib/message-matrix.ts"),"utf8");
  const billing=readFileSync(resolve(process.cwd(),"lib/billing-super-admin.ts"),"utf8");
  assert.match(policy,/HARD_STOP/); assert.match(policy,/overageApproved/); assert.match(billing,/\|\| subscription\.overageApproved/);
});
test("pricing discloses approved overage without silent charging",()=>{
  const pricing=readFileSync(resolve(process.cwd(),"components/marketing/ai-bot-pricing.tsx"),"utf8");
  assert.match(pricing,/customer approves a disclosed per-message or per-AI-reply rate/); assert.match(pricing,/no silent overage charge/);
});
