import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Super Admin billing is commercially focused", () => {
  const page = readFileSync(resolve(process.cwd(), "app/admin/billing/page.tsx"), "utf8");
  for (const label of ["Overview", "Customer billing", "Payments & invoices", "Connectors & add-ons"]) assert.match(page, new RegExp(label.replace("&", "&")));
  assert.doesNotMatch(page, /Payment architecture/);
  assert.doesNotMatch(page, /<Timeline/);
  assert.doesNotMatch(page, /Server-side entitlements/);
});

test("complimentary grants require an expiry and reason", () => {
  const api = readFileSync(resolve(process.cwd(), "app/api/admin/billing/[organizationId]/route.ts"), "utf8");
  assert.match(api, /GRANT_COMPLIMENTARY/);
  assert.match(api, /future expiry date and reason are required/);
});

test("connector billing uses frontend pricing categories", () => {
  const controls = readFileSync(resolve(process.cwd(), "components/admin/billing-controls.tsx"), "utf8");
  for (const category of ["Google Sheets / Calendar", "CRM", "E-commerce", "PMS / Channel Manager", "Custom API"]) assert.match(controls, new RegExp(category.replace("/", "\\/")));
});
