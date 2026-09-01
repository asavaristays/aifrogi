import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "components/knowledge/knowledge-workspace.tsx"), "utf8");

test("intelligence begins with a plain-language three-step journey", () => {
  assert.match(source, /Teach your AI Bot/);
  assert.match(source, /Add information/);
  assert.match(source, /Review answers/);
  assert.match(source, /Test and approve/);
});

test("website setup is a single save-and-sync action", () => {
  assert.match(source, /async function connectWebsite/);
  assert.match(source, /Use my website/);
  assert.match(source, /No website password or admin access is required/);
});

test("governance metrics are available without dominating first use", () => {
  assert.match(source, /Readiness and safety checks/);
  assert.match(source, /Optional details for administrators/);
});
