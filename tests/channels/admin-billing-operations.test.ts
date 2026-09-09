import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Super Admin billing is commercially focused", () => {
  const page = readFileSync(resolve(process.cwd(), "app/admin/billing/page.tsx"), "utf8");
  for (const label of ["Overview", "Customer billing", "Payments & invoices", "Credit transactions"]) assert.match(page, new RegExp(label.replace("&", "&")));
  assert.doesNotMatch(page, /Add-ons|Connectors & add-ons/);
  assert.doesNotMatch(page, /Payment architecture/);
  assert.doesNotMatch(page, /<Timeline/);
  assert.doesNotMatch(page, /Server-side entitlements/);
});

test("complimentary grants require an expiry and reason", () => {
  const api = readFileSync(resolve(process.cwd(), "app/api/admin/billing/[organizationId]/route.ts"), "utf8");
  assert.match(api, /GRANT_COMPLIMENTARY/);
  assert.match(api, /future expiry date and reason are required/);
});

test("customer billing opens a dedicated commercial record", () => {
  const register = readFileSync(resolve(process.cwd(), "app/admin/billing/page.tsx"), "utf8");
  const detail = readFileSync(resolve(process.cwd(), "app/admin/billing/[organizationId]/page.tsx"), "utf8");
  const freeCredits = readFileSync(resolve(process.cwd(), "components/admin/free-credit-grant.tsx"), "utf8");
  assert.match(register, /\/admin\/billing\/\$\{organization\.id\}/);
  assert.doesNotMatch(register, /\/admin\/customers\/\$\{organization\.id\}#billing-operations/);
  for (const label of ["Operator billing controls", "Complimentary access", "Confirm manual payment", "Grant free AI reply credits"]) {
    const controls = readFileSync(resolve(process.cwd(), "components/admin/billing-controls.tsx"), "utf8");
    assert.match(`${detail}\n${controls}\n${freeCredits}`, new RegExp(label));
  }
  assert.doesNotMatch(detail, /Billing audit evidence/);
  assert.doesNotMatch(detail, /organization\.auditLogs/);
});

test("manual payment renewal is explicit and audited", () => {
  const controls = readFileSync(resolve(process.cwd(), "components/admin/billing-controls.tsx"), "utf8");
  const billing = readFileSync(resolve(process.cwd(), "lib/billing-super-admin.ts"), "utf8");
  assert.match(controls, /renewSubscription/);
  assert.match(controls, /Turn off for a one-time service invoice/);
  assert.match(billing, /subscription renewed/);
  assert.match(billing, /renewSubscription: Boolean/);
});

test("contracted connector add-ons are hidden from the v1 billing interface", () => {
  const controls = readFileSync(resolve(process.cwd(), "components/admin/billing-controls.tsx"), "utf8");
  assert.doesNotMatch(controls, /Connector add-on|Google Sheets \/ Calendar|PMS \/ Channel Manager/);
});

test("client and Super Admin billing show the effective AI credit balance", () => {
  const client = readFileSync(resolve(process.cwd(), "app/(app)/billing/page.tsx"), "utf8");
  const register = readFileSync(resolve(process.cwd(), "app/admin/billing/page.tsx"), "utf8");
  const detail = readFileSync(resolve(process.cwd(), "app/admin/billing/[organizationId]/page.tsx"), "utf8");
  const websiteBot = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");
  assert.match(client, /Bot replies are active/);
  assert.match(client, /plan replies \+.*purchased or free credits/);
  assert.match(register, /AI credits/);
  assert.match(detail, /replies\.total/);
  assert.match(websiteBot, /checkOrganizationEntitlement\(organization\.id, "aiReplies", 1\)/);
});
