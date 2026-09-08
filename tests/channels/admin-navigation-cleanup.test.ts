import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("Super Admin navigation removes demos, appointments, and the deferred messaging product", () => {
  const shell = readFileSync(resolve(process.cwd(), "components/admin/admin-shell.tsx"), "utf8");
  assert.doesNotMatch(shell, /label: "Bot demos"/);
  assert.doesNotMatch(shell, /label: "Appointments"/);
  assert.doesNotMatch(shell, /WhatsApp AI Bot/);
});
test("retired demo screens cannot be opened from legacy URLs", () => {
  for (const path of ["app/admin/demo-sandboxes/page.tsx", "app/admin/pingbook-demo/page.tsx"]) {
    const source = readFileSync(resolve(process.cwd(), path), "utf8");
    assert.match(source, /redirect\("\/admin"\)/);
  }
});
test("deferred messaging operations are absent from the main application", () => {
  assert.equal(existsSync(resolve(process.cwd(), "app/admin/whatsapp-ai-bot/page.tsx")), false);
});
test("Super Admin onboarding separates self-serve and admin-assisted paths", () => {
  const source = readFileSync(resolve(process.cwd(), "app/admin/onboard/page.tsx"), "utf8");
  assert.match(source, /Option 1 · Self-serve/);
  assert.match(source, /Option 2 · Admin-assisted/);
  assert.match(source, /!text-white hover:bg/);
});
test("customer register exposes governed pause, suspend and remove controls", () => {
  const source = readFileSync(resolve(process.cwd(), "components/admin/customer-lifecycle-actions.tsx"), "utf8");
  assert.match(source, /Pause bot/);
  assert.match(source, /Suspend/);
  assert.match(source, /REMOVE_FROM_OPERATIONS/);
});
test("all dark Super Admin actions retain readable white labels", () => {
  const css = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");
  assert.match(css, /\.admin-premium-canvas a\.text-white/);
  assert.match(css, /color: #fff !important/);
});
