import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const shell = readFileSync(resolve(process.cwd(), "components/admin/admin-shell.tsx"), "utf8");
const dashboard = readFileSync(resolve(process.cwd(), "app/admin/page.tsx"), "utf8");
const onboard = readFileSync(resolve(process.cwd(), "components/admin/admin-onboard-client.tsx"), "utf8");

test("Super Admin uses icon sidebar and a first-class pilot onboarding action", () => {
  assert.match(shell, /Super Admin navigation/);
  assert.match(shell, /Bot onboarding/);
  assert.match(shell, /\/admin\/onboard/);
  assert.match(shell, /rounded-\[30px\]/);
  assert.match(dashboard, /Command Center/);
  assert.match(dashboard, /A client moves through four gates\./);
});

test("pilot onboarding starts AI Bot without silently enabling WhatsApp", () => {
  assert.match(onboard, /super-admin-pilot/);
  assert.match(onboard, /WhatsApp remains off unless deliberately enabled later/);
  assert.match(onboard, /Create pilot and send activation/);
});
