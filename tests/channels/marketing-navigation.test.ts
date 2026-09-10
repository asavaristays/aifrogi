import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "components/marketing/site-header.tsx"), "utf8");
const footer = readFileSync(resolve(process.cwd(), "components/marketing/site-footer.tsx"), "utf8");
const resources = readFileSync(resolve(process.cwd(), "app/resources/page.tsx"), "utf8");

test("marketing footer retains the approved founder link", () => {
  assert.match(footer, /https:\/\/webtechnosys\.com\/founder\//);
  assert.match(footer, /rel="noreferrer"/);
  assert.match(footer, />Founder<\/a>/);
});

test("public header is locked to the four approved navigation items", () => {
  assert.doesNotMatch(header, /label: "WhatsApp API"/);
  assert.doesNotMatch(header, /label: "Resources"|label: "Founder"/);
  for (const item of ["Home", "AI Bot", "How to Install", "Pricing"]) assert.match(header, new RegExp(`label: "${item}"`));
});

test("resources stay focused on self-serve AI Bot onboarding", () => {
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
