import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");

test("public website bot requires an enabled configured website profile", () => {
  assert.match(source, /profile\.status !== "CONFIGURED"/);
  assert.match(source, /profile\.channels\.includes\("WEBSITE"\)/);
});

test("contact details are persisted only with explicit consent", () => {
  assert.match(source, /payload\?\.consent && payload\.contact/);
  assert.match(source, /payload\?\.consent && payload\.name/);
});

test("website bot limits request size and request rate", () => {
  assert.match(source, /slice\(0, 1200\)/);
  assert.match(source, /rateLimited\(request\)/);
  assert.match(source, /current\.count > limit/);
  assert.match(source, /status: 429/);
});

test("website reply retrieval requires a signed tenant-bound visitor session", () => {
  assert.match(source, /verifyWebsiteVisitorToken\(bearerToken\(request\), slug\)/);
  assert.match(source, /property: \{ slug \}/);
  assert.match(source, /sender: "AGENT"/);
});
