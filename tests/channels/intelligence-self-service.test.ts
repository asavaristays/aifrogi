import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "components/knowledge/knowledge-workspace.tsx"), "utf8");
const preparation = readFileSync(resolve(process.cwd(), "components/onboarding/level-one-progress.tsx"), "utf8");
const onboarding = readFileSync(resolve(process.cwd(), "components/onboarding/customer-onboarding.tsx"), "utf8");

test("intelligence begins with a plain-language four-step journey and one next action", () => {
  assert.match(source, /Teach your AI Bot/);
  assert.match(source, /Add information/);
  assert.match(source, /Review answers/);
  assert.match(source, /Test an answer/);
  assert.match(source, /Submit for approval/);
  assert.match(source, /Do this next/);
});

test("website setup is a single save-and-sync action", () => {
  assert.match(source, /async function connectWebsite/);
  assert.match(source, /Use my website/);
  assert.match(source, /No website password or admin access is required/);
});

test("approved website setup promises a measured private preview without auto-publishing", () => {
  assert.match(onboarding, /private branded preview starts automatically/);
  assert.match(onboarding, /target is under four minutes/);
  assert.match(onboarding, /Production activation still requires approval/);
  assert.match(preparation, /Four-minute target/);
  assert.match(preparation, /Test your preview/);
  assert.match(preparation, /preview remains private until production approval/i);
});

test("governance metrics are available without dominating first use", () => {
  assert.match(source, /Readiness and safety checks/);
  assert.match(source, /Optional details for administrators/);
});
