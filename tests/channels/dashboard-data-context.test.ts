import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("admin dashboards establish explicit platform database authority", () => {
  for (const path of ["app/admin/page.tsx", "app/admin/customers/page.tsx", "app/admin/sovereign-intelligence/page.tsx"]) {
    const page = source(path);
    assert.match(page, /getCurrentUser\(\)/, path);
    assert.match(page, /kind: "platform-admin"/, path);
    assert.match(page, /withTenantDatabaseContext/, path);
  }
});

test("client dashboard loads operational data inside its tenant boundary", () => {
  const page = source("app/(app)/dashboard/page.tsx");
  assert.match(page, /kind: "tenant", organizationId: organization\.id/);
  assert.match(page, /renderDashboard/);
  assert.match(page, /withTenantDatabaseContext/);
});

test("admin Core Intelligence workflow is read-only and property-id aware", () => {
  const page = source("app/admin/sovereign-intelligence/page.tsx");
  const workflow = source("components/admin/core-intelligence-workflow.tsx");
  assert.match(page, /CoreIntelligenceWorkflow/);
  assert.match(workflow, /Platform Intelligence · read only/);
  assert.match(workflow, /RESOLVE_PROPERTY_ID/);
  assert.doesNotMatch(workflow, /fetch\(|Publish &amp; enable|Save draft/);
});
