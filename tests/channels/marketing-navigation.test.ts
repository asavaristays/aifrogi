import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "components/marketing/site-header.tsx"), "utf8");
const footer = readFileSync(resolve(process.cwd(), "components/marketing/site-footer.tsx"), "utf8");

test("shared marketing header and footer expose the approved founder link", () => {
  for (const source of [header, footer]) {
    assert.match(source, /https:\/\/webtechnosys\.com\/founder\//);
    assert.match(source, /rel="noreferrer"/);
  }

  assert.match(header, /label: "Founder"/);
  assert.match(footer, />Founder<\/a>/);
});
