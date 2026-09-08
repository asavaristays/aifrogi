import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { recommendFreeAiCredits } from "../../lib/ai-credits";

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
test("pricing discloses prepaid credits without silent charging",()=>{
  const pricing=readFileSync(resolve(process.cwd(),"components/marketing/ai-bot-pricing.tsx"),"utf8");
  assert.match(pricing,/prepaid credit pack/); assert.match(pricing,/no automatic overage charge/);
});

test("paid and free credits share an audited immutable ledger",()=>{
  const credits=readFileSync(resolve(process.cwd(),"lib/ai-credits.ts"),"utf8");
  const admin=readFileSync(resolve(process.cwd(),"app\/api\/admin\/message-matrix\/[organizationId]\/route.ts"),"utf8");
  assert.match(credits,/FREE_GRANT/); assert.match(credits,/AI_CREDITS_GRANTED/); assert.match(credits,/AI_CREDITS_PURCHASED/);
  assert.match(admin,/GRANT_FREE_CREDITS/);
});

test("system suggests retention credits but never grants them automatically",()=>{
  assert.deepEqual(recommendFreeAiCredits({planCode:"TRIAL",usedAiReplies:80,includedCredits:100,remainingExtraCredits:0,recentFreeGrant:false}),{suggested:true,credits:100,reason:"Trial usage reached 80%; consider a one-time evaluation extension.",expiresInDays:30,signal:"TRIAL_RETENTION"});
  assert.equal(recommendFreeAiCredits({planCode:"AI_STARTER_MONTHLY",usedAiReplies:960,includedCredits:1000,remainingExtraCredits:0,recentFreeGrant:false}).credits,250);
  assert.equal(recommendFreeAiCredits({planCode:"AI_STARTER_MONTHLY",usedAiReplies:990,includedCredits:1000,remainingExtraCredits:0,recentFreeGrant:true}).suggested,false);
  const control=readFileSync(resolve(process.cwd(),"components/admin/message-policy-control.tsx"),"utf8");
  assert.match(control,/Suggestions never grant automatically/);
});

test("Super Admin Today shows credit usage and separate remaining balances",()=>{
  const today=readFileSync(resolve(process.cwd(),"app/admin/page.tsx"),"utf8");
  assert.match(today,/getMessageMatrix/);
  assert.match(today,/AI replies used/);
  assert.match(today,/Purchased left/);
  assert.match(today,/Promotional left/);
  assert.match(today,/\/admin\/message-matrix/);
});

test("credit allocation is immediate and history is shared by client and Super Admin Billing",()=>{
  const credits=readFileSync(resolve(process.cwd(),"lib/ai-credits.ts"),"utf8");
  const detail=readFileSync(resolve(process.cwd(),"lib/billing-super-admin.ts"),"utf8");
  const client=readFileSync(resolve(process.cwd(),"app/(app)/billing/page.tsx"),"utf8");
  const admin=readFileSync(resolve(process.cwd(),"app/admin/billing/[organizationId]/page.tsx"),"utf8");
  const table=readFileSync(resolve(process.cwd(),"components/billing/credit-history-table.tsx"),"utf8");
  assert.match(credits,/Start a trial or activate a plan/);
  assert.match(detail,/aiCreditTransactions/);
  assert.match(client,/CreditHistoryTable/);
  assert.match(admin,/CreditHistoryTable/);
  assert.match(table,/Current period/);
  assert.match(table,/Credit pack purchased/);
  assert.match(table,/Free credits granted/);
  const checkout=readFileSync(resolve(process.cwd(),"components/billing/buy-ai-credits.tsx"),"utf8");
  assert.match(checkout,/content-type/);
  assert.match(checkout,/Payment service returned an unexpected response/);
});

test("all billing payment points use safe responses and complete Super Admin records",()=>{
  const planCheckout=readFileSync(resolve(process.cwd(),"components/billing/activate-plan.tsx"),"utf8");
  const billingData=readFileSync(resolve(process.cwd(),"lib/billing-super-admin.ts"),"utf8");
  const adminBilling=readFileSync(resolve(process.cwd(),"app/admin/billing/page.tsx"),"utf8");
  assert.match(planCheckout,/content-type/);
  assert.match(planCheckout,/Payment service returned an unexpected response/);
  assert.doesNotMatch(billingData,/invoices: \{ orderBy: \{ createdAt: "desc" \}, take:/);
  assert.match(adminBilling,/Credit transactions/);
  assert.match(adminBilling,/creditTransactions\.map/);
  assert.doesNotMatch(adminBilling,/invoices\.slice/);
});

test("completed billing events notify the client with the configured AiFrogi mail template",()=>{
  const template=readFileSync(resolve(process.cwd(),"lib/billing-email-template.ts"),"utf8");
  const notification=readFileSync(resolve(process.cwd(),"lib/services/billing-notification.ts"),"utf8");
  const planVerify=readFileSync(resolve(process.cwd(),"app/api/billing/checkout/verify/route.ts"),"utf8");
  const creditVerify=readFileSync(resolve(process.cwd(),"app/api/billing/credits/verify/route.ts"),"utf8");
  const adminGrant=readFileSync(resolve(process.cwd(),"app/api/admin/message-matrix/[organizationId]/route.ts"),"utf8");
  assert.match(template,/aifrogi-logo-white\.png/);
  assert.match(template,/never asks for card, bank, UPI, password or OTP/);
  assert.match(notification,/sendBookingMail/);
  assert.match(notification,/EMAIL_ACCEPTED/);
  assert.match(planVerify,/PLAN_ACTIVATED/);
  assert.match(creditVerify,/CREDITS_PURCHASED/);
  assert.match(adminGrant,/FREE_CREDITS_GRANTED/);
});
