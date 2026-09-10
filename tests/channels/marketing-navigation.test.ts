import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "components/marketing/site-header.tsx"), "utf8");
const footer = readFileSync(resolve(process.cwd(), "components/marketing/site-footer.tsx"), "utf8");
const resources = readFileSync(resolve(process.cwd(), "app/resources/page.tsx"), "utf8");

test("shared marketing header and footer expose the approved founder link", () => {
  for (const source of [header, footer]) {
    assert.match(source, /https:\/\/webtechnosys\.com\/founder\//);
    assert.match(source, /rel="noreferrer"/);
  }

  assert.match(header, /label: "Founder"/);
  assert.match(footer, />Founder<\/a>/);
});

test("public navigation and resources stay focused on self-serve AI Bot onboarding", () => {
  assert.doesNotMatch(header, /label: "WhatsApp API"/);
  assert.match(header, /label: "Resources", href: "\/resources"/);
  for (const required of [
    "Create your AiFrogi workspace",
    "Upload Excel, PDF or website knowledge",
    "Train the bot by approving answers",
    "Design the welcome and Main menu",
    "Test first, then install once",
    "Manage leads, replies and improvements"
  ]) assert.match(resources, new RegExp(required));
  assert.doesNotMatch(resources, /WhatsApp/);
});
