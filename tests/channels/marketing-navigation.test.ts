import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const header = readFileSync(resolve(process.cwd(), "components/marketing/site-header.tsx"), "utf8");

test("top navigation stays grouped beside login while mobile actions remain right aligned", () => {
  assert.match(header, /aria-label="Main navigation" className="ml-auto/);
  assert.match(header, /className="ml-auto flex items-center gap-2 lg:hidden"/);
});
const footer = readFileSync(resolve(process.cwd(), "components/marketing/site-footer.tsx"), "utf8");
const resources = readFileSync(resolve(process.cwd(), "app/resources/page.tsx"), "utf8");
const helpCenter = readFileSync(resolve(process.cwd(), "lib/help-center.ts"), "utf8");

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
    "Publish with or without a website",
    "Manage leads, replies and improvements"
  ]) assert.match(resources, new RegExp(required));
  assert.match(resources, /A website is optional/);
  assert.match(resources, /standalone web app/);
  assert.doesNotMatch(resources, /WhatsApp/);
});

test("public Help Center contains only complete AI Bot operating guidance", () => {
  assert.doesNotMatch(helpCenter, /WhatsApp|Meta/);
  for (const guide of [
    "Create your AiFrogi workspace",
    "Upload Excel, PDF or website knowledge",
    "Review, edit and approve bot answers",
    "Design bot appearance and Main menu",
    "Use the AI Bot without a website",
    "Install the AI Bot on a website",
    "Manage Leads and Team Inbox",
    "Understand AI credits and Billing",
    "Improve a missing or wrong answer"
  ]) assert.match(helpCenter, new RegExp(guide));
});
