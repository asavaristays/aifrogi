import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const source = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("HotelGPT exposes a Manage in-stay workspace with a safe guest QR", () => {
  const nav = source("components/layout/side-nav.tsx");
  const items = source("data/mock.ts");
  const page = source("app/(app)/in-stay/page.tsx");
  assert.match(items, /href: "\/in-stay", label: "In-stay"/);
  assert.match(nav, /item\.href !== "\/in-stay" \|\| botCategory === "STAY"/);
  assert.match(page, /category !== "STAY"/);
  assert.match(page, /\/stay\/\$\{encodeURIComponent\(property\.slug\)\}/);
  assert.match(page, /\/api\/hotelgpt-stay\/qr/);
  assert.match(page, /No password or guest data is stored in the QR/);
  assert.match(page, /Only published, owner-approved answers/);
});

test("HotelGPT provides the approved guest and hotel operations journey", () => {
  const resident = source("components/website-bot/hotelgpt-resident-entry.tsx");
  const workspace = source("components/in-stay/in-stay-workspace.tsx");
  const inbox = source("components/whatsapp/whatsapp-bot-client.tsx");
  const session = source("app/api/public/hotelgpt-stay/[slug]/session/route.ts");
  assert.match(resident, /Phone number/);
  assert.match(resident, /Awaiting front desk approval/);
  assert.match(resident, /Welcome, \{guestName\}/);
  assert.match(resident, /Yes, resolved/);
  assert.match(resident, /I still need help/);
  assert.match(resident, /localStorage\.getItem/);
  assert.match(resident, /scan the same QR on this phone/);
  assert.match(resident, /Guest Login/);
  assert.match(resident, /Register Stay/);
  assert.match(resident, /Enter room number/);
  for (const label of ["Overview", "Queries", "Complaints", "Resolved", "Reports", "QR & Access"]) assert.match(workspace, new RegExp(label.replace("&", "&")));
  assert.match(inbox, />Pre-Stay</);
  assert.match(inbox, />In-Stay</);
  assert.match(session, /CONFIRM_RESOLUTION/);
  assert.match(session, /REOPEN/);
  const proxy = source("proxy.ts");
  assert.match(proxy, /"\/api\/public\/hotelgpt-stay"/);
  const tenantContext = source("lib/security/tenant-database-context.ts");
  assert.match(tenantContext, /withPublicBotDatabaseContext[\s\S]*withTenantDatabaseContext\(\{ kind: "tenant", organizationId/);
  const access = source("app/api/hotelgpt-stay/access/route.ts");
  const cases = source("app/api/hotelgpt-stay/cases/route.ts");
  assert.match(access, /hasTrustedSameOrigin\(request\)/);
  assert.match(cases, /hasTrustedSameOrigin\(request\)/);
});
