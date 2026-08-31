import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error The operational ESM script intentionally has no generated TypeScript declaration.
import { evaluateOwnershipPlan } from "../../ops/preflight-schema-migration.mjs";

test("migration preflight permits direct deploy only when runtime owns every target", () => {
  const result = evaluateOwnershipPlan({ currentRole: "app", tables: [{ name: "Evidence", owner: "app" }], approvedOwnerRole: null });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "RUNTIME_OWNER");
});

test("migration preflight routes known ownership drift through an explicit owner path", () => {
  const result = evaluateOwnershipPlan({ currentRole: "app", tables: [{ name: "Evidence", owner: "postgres" }], approvedOwnerRole: "postgres" });
  assert.equal(result.ok, true);
  assert.equal(result.mode, "ADMIN_OWNER_REQUIRED");
});

test("migration preflight blocks unknown or mixed ownership", () => {
  assert.equal(evaluateOwnershipPlan({ currentRole: "app", tables: [{ name: "Evidence", owner: "postgres" }], approvedOwnerRole: null }).ok, false);
  assert.equal(evaluateOwnershipPlan({ currentRole: "app", tables: [{ name: "Missing", owner: null }], approvedOwnerRole: "postgres" }).ok, false);
});
