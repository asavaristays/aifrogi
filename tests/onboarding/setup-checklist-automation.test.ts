import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("website bot checklist uses recorded test and installation evidence", () => {
  const setup = readFileSync("app/(app)/setup/page.tsx", "utf8");
  assert.match(setup, /WEBSITE_BOT_TEST_COMPLETED/);
  assert.match(setup, /sovereignAnswerEvidence\.findFirst/);
  assert.match(setup, /installationDetectedAt/);
  assert.match(setup, /WebsiteBotInstallation/);
  assert.match(setup, /BotBehaviourSettings/);
  assert.match(setup, /Five steps to prepare your bot/);
  assert.match(setup, /sectionId="website-installation"/);
  assert.match(setup, /View embed options/);
  assert.doesNotMatch(setup, /ready:\s*false/);
});

test("authenticated knowledge testing records self-service completion", () => {
  const route = readFileSync("app/api/knowledge/test/route.ts", "utf8");
  const workspace = readFileSync("components/knowledge/knowledge-workspace.tsx", "utf8");
  assert.match(route, /WEBSITE_BOT_TEST_COMPLETED/);
  assert.match(route, /buildWebsiteKnowledgeAnswer/);
  assert.match(workspace, /fetch\("\/api\/knowledge\/test"/);
  assert.doesNotMatch(workspace, /integrations\/whatsapp\/kb\/answer/);
});
