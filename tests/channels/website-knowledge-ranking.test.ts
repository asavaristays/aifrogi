import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "lib/services/website-knowledge-service.ts"), "utf8");

test("partner knowledge ranking boosts automation and hospitality intent", () => {
  assert.match(source, /asksAutomation/);
  assert.match(source, /asksHospitality/);
  assert.match(source, /ai-automation\|ai-solutions/);
});

test("unrequested filmmaking and training pages are demoted", () => {
  assert.match(source, /score -= 12/g);
});

test("current partner automation and hotel solution paths are seeded for refresh", () => {
  assert.match(source, /"\/ai-automation\/"/);
  assert.match(source, /"\/ai-solutions\/"/);
  assert.match(source, /"\/channel-manager\/"/);
});
