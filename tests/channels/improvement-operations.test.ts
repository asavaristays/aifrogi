import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { navItems } from "../../data/mock";

test("clients receive a dedicated Improve My Bot workspace", () => {
  assert.equal(navItems.some((item) => item.href === "/improve" && item.label === "Improve My Bot"), true);
  const source = readFileSync(resolve(process.cwd(), "app/(app)/improve/page.tsx"), "utf8");
  assert.match(source, /resolveClientWorkspaceAccess/);
  assert.match(source, /Feedback creates a review item—not an automatic rewrite/);
});
test("negative feedback asks for an actionable reason", () => {
  const source = readFileSync(resolve(process.cwd(), "components/website-bot/website-bot-embed.tsx"), "utf8");
  for (const reason of ["Incorrect information", "Did not answer my question", "Outdated information", "Difficult to understand", "Needed a person"]) assert.match(source, new RegExp(reason));
});
test("Super Admin labels cross-tenant reporting as Intelligence Operations", () => {
  const shell = readFileSync(resolve(process.cwd(), "components/admin/admin-shell.tsx"), "utf8");
  const page = readFileSync(resolve(process.cwd(), "app/admin/sovereign-intelligence/page.tsx"), "utf8");
  assert.match(shell, /Intelligence Operations/); assert.match(page, /All bots · all clients/); assert.match(page, /getAllBotImprovementReport/);
});
