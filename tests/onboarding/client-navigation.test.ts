import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("campaign navigation is retired from the website-only workspace", () => {
  const navigation = readFileSync(resolve(process.cwd(), "data/mock.ts"), "utf8");
  assert.doesNotMatch(navigation, /\/campaigns/);
});

test("AI Bot navigation retains the knowledge workspace", () => {
  const navigation = readFileSync(resolve(process.cwd(), "data/mock.ts"), "utf8");
  assert.match(navigation, /\/knowledge/);
});
