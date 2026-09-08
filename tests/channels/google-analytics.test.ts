import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Google Analytics is installed once in the shared root layout", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /G-5QQ0RTF35N/);
  assert.match(layout, /googletagmanager\.com\/gtag\/js/);
  assert.match(layout, /strategy="afterInteractive"/);
  assert.match(layout, /gtag\('config'/);
  assert.equal((layout.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 1);
});
