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

test("homepage does not render a release marker inside the hero", () => {
  const homepage = read("app/page.tsx");
  assert.doesNotMatch(homepage, /Introducing \{PRODUCT_RELEASE\.name\}/);
});

test("homepage hero uses a static mobile poster instead of the blended video layer", () => {
  const hero = read("components/marketing/hero-video.tsx");
  const styles = read("components/marketing/sovereign-hero.module.css");
  assert.match(hero, /max-width: 639px/);
  assert.match(hero, /className=\{styles\.staticPoster\}/);
  assert.match(styles, /@media \(min-width: 640px\) and \(prefers-reduced-motion: no-preference\)/);
});
