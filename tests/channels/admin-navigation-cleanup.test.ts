import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Super Admin navigation removes demos and appointments and separates WhatsApp AI Bot", () => {
  const shell = readFileSync(resolve(process.cwd(), "components/admin/admin-shell.tsx"), "utf8");
  assert.doesNotMatch(shell, /label: "Bot demos"/);
  assert.doesNotMatch(shell, /label: "Appointments"/);
  assert.match(shell, /label: "WhatsApp AI Bot"/);
});
test("retired demo screens cannot be opened from legacy URLs", () => {
  for (const path of ["app/admin/demo-sandboxes/page.tsx", "app/admin/pingbook-demo/page.tsx"]) {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");
    assert.match(source, /redirect\("\/admin"\)/);
  }
});
test("WhatsApp AI Bot has a dedicated non-demo enablement and operations page", () => {
  const source = readFileSync(resolve(process.cwd(), "app/admin/whatsapp-ai-bot/page.tsx"), "utf8");
  assert.match(source, /isDemo: false/);
  assert.match(source, /Automated integration rail/);
  assert.match(source, /Enable in bot profile/);
  assert.match(source, /Authorise Meta/);
});
test("Super Admin onboarding separates self-serve and admin-assisted paths", () => {
  const source = readFileSync(resolve(process.cwd(), "app/admin/onboard/page.tsx"), "utf8");
  assert.match(source, /Option 1 · Self-serve/);
  assert.match(source, /Option 2 · Admin-assisted/);
});
test("customer register exposes governed pause, suspend and remove controls", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/customer-lifecycle-actions.tsx"), "utf8");
  assert.match(source, /Pause bot/);
  assert.match(source, /Suspend/);
  assert.match(source, /REMOVE_FROM_OPERATIONS/);
});
