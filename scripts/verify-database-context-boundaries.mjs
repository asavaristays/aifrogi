import fs from "node:fs";
import path from "node:path";

const required = new Map([
  ["app/(app)/analytics/page.tsx", "withTenantDatabaseContext"],
  ["app/(app)/billing/page.tsx", "withClientDatabaseContext"],
  ["app/(app)/contacts/page.tsx", "withTenantDatabaseContext"],
  ["app/(app)/dashboard/page.tsx", "withTenantDatabaseContext"],
  ["app/(app)/flow-intelligence/page.tsx", "withClientDatabaseContext"],
  ["app/(app)/improve/page.tsx", "withTenantDatabaseContext"],
  ["app/(app)/knowledge/page.tsx", "withClientDatabaseContext"],
  ["app/(app)/settings/users/page.tsx", "withClientDatabaseContext"],
  ["app/(app)/setup/page.tsx", "withClientDatabaseContext"],
  ["app/(app)/support/page.tsx", "withTenantDatabaseContext"],
  ["app/(app)/team-inbox/page.tsx", "withTenantDatabaseContext"],
  ["app/admin/audit/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/billing/page.tsx", "withTenantDatabaseContext"],
  ["app/admin/billing/[organizationId]/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/customers/page.tsx", "withTenantDatabaseContext"],
  ["app/admin/customers/[id]/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/knowledge/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/page.tsx", "withTenantDatabaseContext"],
  ["app/admin/sovereign-intelligence/page.tsx", "withTenantDatabaseContext"],
  ["app/admin/support/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/support/[id]/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/admin/typesafe/page.tsx", "withPlatformAdminDatabaseContext"],
  ["app/api/team-inbox/summary/route.ts", "withTenantDatabaseContext"]
  ,["app/api/admin/customers/[id]/route.ts", "withPlatformAdminDatabaseContext"]
  ,["app/api/automation/jobs/route.ts", "withClientDatabaseContext"]
  ,["app/api/knowledge/route.ts", "withClientDatabaseContext"]
  ,["app/api/knowledge/test/route.ts", "withClientDatabaseContext"]
  ,["app/api/leads/[id]/messages/route.ts", "withTenantDatabaseContext"]
  ,["app/api/pilot-measurement/review-queue/route.ts", "withPlatformAdminDatabaseContext"]
  ,["app/api/pilot-measurement/reviews/route.ts", "withTenantDatabaseContext"]
  ,["app/api/setup/certification/route.ts", "withClientDatabaseContext"]
]);

const failures = [];
for (const [path, boundary] of required) {
  const source = fs.readFileSync(path, "utf8");
  if (!source.includes(boundary)) failures.push(`${path}: missing ${boundary}`);
}

function filesBelow(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    return entry.isDirectory() ? filesBelow(target) : [target];
  });
}

const dataImport = /@\/lib\/(?:db|repositories|services|billing-super-admin|subscription-access)/;
const explicitBoundary = /with(?:Tenant|Client|PlatformAdmin)DatabaseContext/;
for (const root of ["app/(app)", "app/admin"]) {
  for (const page of filesBelow(root).filter((file) => file.endsWith("/page.tsx") || file.endsWith("/page.ts"))) {
    const source = fs.readFileSync(page, "utf8");
    if (dataImport.test(source) && !explicitBoundary.test(source)) failures.push(`${page}: authenticated data page has no explicit database boundary`);
  }
}

for (const route of filesBelow("app/api").filter((file) => file.endsWith("/route.ts"))) {
  const source = fs.readFileSync(route, "utf8");
  const isAuthenticatedDataRoute = /from ["']@\/lib\/db["']/.test(source) && /getCurrentUser|getCurrentClientAccess|resolveClientWorkspaceAccess/.test(source);
  if (isAuthenticatedDataRoute && !explicitBoundary.test(source)) failures.push(`${route}: authenticated data API has no explicit database boundary`);
}

const billing = fs.readFileSync("app/(app)/billing/page.tsx", "utf8");
if (/if\s*\(!billing\s*\|\|\s*!subscriptionAccess\)\s*return null/.test(billing)) {
  failures.push("app/(app)/billing/page.tsx: silently returns a blank page for unavailable data");
}

if (failures.length) {
  console.error(`Database-context guard failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Database-context guard passed for ${required.size} authenticated surfaces.`);
