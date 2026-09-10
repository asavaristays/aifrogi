import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");
const forbidden = /whats\s*app|meta business|meta webhook/i;

test("beta onboarding and active dashboard are AI Bot only", () => {
  for (const path of [
    "app/onboarding/page.tsx",
    "components/onboarding/customer-onboarding.tsx",
    "components/admin/admin-onboard-client.tsx",
    "components/dashboard/client-dashboard-view.tsx",
    "app/(app)/dashboard/page.tsx",
    "app/(app)/analytics/page.tsx",
    "app/api/reports/website/pdf/route.ts"
  ]) assert.doesNotMatch(read(path), forbidden, path);
});

test("public Help and active AI Bot defaults have no deferred channel offer", () => {
  for (const path of ["lib/help-center.ts", "app/help/page.tsx", "app/api/support/tickets/route.ts"])
    assert.doesNotMatch(read(path), forbidden, path);
  assert.doesNotMatch(read("app/api/public/website-bot/[slug]/route.ts"), /WHATSAPP_AUTOMATION/);
});
