import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("admin dashboards establish explicit platform database authority", () => {
  for (const path of ["app/admin/page.tsx", "app/admin/customers/page.tsx", "app/admin/sovereign-intelligence/page.tsx", "app/admin/billing/page.tsx"]) {
    const page = source(path);
    assert.match(page, /getCurrentUser\(\)/, path);
    assert.match(page, /kind: "platform-admin"/, path);
    assert.match(page, /withTenantDatabaseContext/, path);
  }
});

test("billing and Team Inbox keep all reads and review writes inside explicit tenant boundaries", () => {
  const billing = source("app/(app)/billing/page.tsx");
  const inbox = source("app/(app)/team-inbox/page.tsx");
  const summary = source("app/api/team-inbox/summary/route.ts");
  assert.match(billing, /withClientDatabaseContext/);
  assert.match(inbox, /withTenantDatabaseContext/);
  assert.match(summary, /withTenantDatabaseContext/g);
  assert.match(summary, /kind:'tenant',organizationId:a\.organization\.id/);
  assert.match(summary, /getProtectedDb/);
  assert.doesNotMatch(billing, /return null/);
});

test("team invitations evaluate subscription and allowance inside the tenant boundary", () => {
  const team = source("app/api/team/route.ts");
  assert.match(team, /withClientDatabaseContext\(access, "team-entitlement"/);
  assert.match(team, /getOrganizationSubscriptionAccess\(access\.organization\.id\)/);
  assert.match(team, /checkOrganizationEntitlement\(access\.organization\.id, "teamUsers", 1\)/);
});

test("hotel agents cannot land on the owner dashboard", () => {
  const dashboard = source("app/(app)/dashboard/page.tsx");
  assert.match(dashboard, /membership\?\.role\.toUpperCase\(\) === "AGENT"/);
  assert.match(dashboard, /redirect\(department \? "\/in-stay\/team" : "\/in-stay\/inbox"\)/);
});

test("new team invitation rows include safe date fields", () => {
  const route = source("app/api/team/route.ts");
  const manager = source("components/settings/team-access-manager.tsx");
  assert.match(route, /invitedAt: invitation\.member\.invitedAt/);
  assert.match(route, /joinedAt: invitation\.member\.joinedAt/);
  assert.match(manager, /if \(!value\) return "recently"/);
  assert.match(manager, /Number\.isNaN\(date\.getTime\(\)\)/);
});

test("remaining authenticated data pages are covered by the build-time context guard", () => {
  const guard = source("scripts/verify-database-context-boundaries.mjs");
  for (const path of ["app/(app)/knowledge/page.tsx", "app/(app)/setup/page.tsx", "app/admin/audit/page.tsx", "app/admin/knowledge/page.tsx", "app/admin/support/page.tsx"]) {
    assert.match(guard, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), path);
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
