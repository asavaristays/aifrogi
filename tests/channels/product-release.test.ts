import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PRODUCT_RELEASE } from "../../lib/product-release";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("AiFrogi 1.0 has one controlled release identity", () => {
  assert.deepEqual(PRODUCT_RELEASE, {
    name: "AiFrogi 1.0",
    version: "1.0.0",
    stage: "Controlled Pilot Release",
    releasedOn: "2026-09-14"
  });
});

test("approved public and operator surfaces use the shared release identity", () => {
  for (const path of [
    "app/page.tsx",
    "components/marketing/site-footer.tsx",
    "components/dashboard/client-dashboard-view.tsx",
    "components/admin/admin-shell.tsx"
  ]) assert.match(read(path), /PRODUCT_RELEASE/);
  assert.match(read("docs/releases/AIFROGI_1_0.md"), /Controlled Pilot Release/);
});

test("homepage omits the redundant experience strip while the presentation keeps its close control", () => {
  assert.doesNotMatch(read("app/page.tsx"), /Meet your next team member/);
  assert.match(read("app/experience/page.tsx"), /<ExperienceStory \/>/);
  assert.match(read("components/marketing/experience-story.tsx"), /aria-label="Close presentation"/);
});

test("release marker wraps inside narrow mobile hero screens", () => {
  const homepage = read("app/page.tsx");
  assert.match(homepage, /max-w-full flex-wrap/);
  assert.match(homepage, /sm:flex-nowrap/);
});
