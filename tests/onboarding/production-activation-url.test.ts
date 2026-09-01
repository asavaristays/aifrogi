import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of ["app/api/auth/register/route.ts", "app/api/auth/invitation/route.ts"]) {
  test(`${file} never falls back to an internal production origin`, () => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    assert.match(source, /process\.env\.NODE_ENV === "production" \? "https:\/\/app\.aifrogi\.com"/);
  });
}
