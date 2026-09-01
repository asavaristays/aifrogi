import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { navItems } from "../../data/mock";

test("unconfigured workflows stay out of the client navigation", () => {
  assert.equal(navItems.some((item) => item.href === "/workflows"), false);
});

test("legacy workflow URLs return clients to the dashboard", () => {
  const source = readFileSync(resolve(process.cwd(), "app/(app)/workflows/page.tsx"), "utf8");
  assert.match(source, /redirect\("\/dashboard"\)/);
});

test("dashboard explains that connector actions are governed", () => {
  const source = readFileSync(resolve(process.cwd(), "components/dashboard/client-dashboard-view.tsx"), "utf8");
  assert.match(source, /Connector-based actions appear only after/);
  assert.doesNotMatch(source, /Manage workflows/);
});
