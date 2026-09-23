import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

test("inbox clients do not force a full server refresh every ten seconds", () => {
  for (const path of [
    "components/whatsapp/whatsapp-bot-client.tsx",
    "components/lead-pipeline/DashboardLayout.tsx"
  ]) {
    const value = source(path);
    assert.doesNotMatch(value, /setInterval\([\s\S]{0,160}router\.refresh\(\)[\s\S]{0,80}10000/);
  }
});

test("Team Inbox refreshes only when lightweight visible-tab counts change", () => {
  const value = source("components/lead-inbox/team-inbox-status.tsx");
  assert.match(value, /document\.visibilityState!==['"]visible['"]/);
  assert.match(value, /value\.unread!==last\.current\.unread/);
  assert.match(value, /value\.needsHuman!==last\.current\.needsHuman/);
  assert.match(value, /if\(changed\)router\.refresh\(\)/);
  assert.match(value, /visibilitychange/);
});
