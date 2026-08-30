import assert from "node:assert/strict";
import test from "node:test";
import { canServeWebsiteBot, nextWebsiteBotStatus } from "../../lib/website-bot-lifecycle";

test("only legacy configured and approved live website bots may serve visitors", () => {
  assert.equal(canServeWebsiteBot("CONFIGURED", ["WEBSITE"]), true);
  assert.equal(canServeWebsiteBot("LIVE", ["WEBSITE"]), true);
  for (const status of ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED", "PAUSED", "DELETED"]) assert.equal(canServeWebsiteBot(status, ["WEBSITE"]), false);
  assert.equal(canServeWebsiteBot("LIVE", ["WHATSAPP"]), false);
});

test("go-live requires installation detection", () => {
  assert.throws(() => nextWebsiteBotStatus("INSTALLATION_READY", "MAKE_LIVE", false), /Install the code/);
  assert.equal(nextWebsiteBotStatus("INSTALLATION_DETECTED", "MAKE_LIVE", true), "LIVE");
});

test("pause, soft delete and restore are deterministic", () => {
  assert.equal(nextWebsiteBotStatus("LIVE", "PAUSE", true), "PAUSED");
  assert.equal(nextWebsiteBotStatus("PAUSED", "DELETE", true), "DELETED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", true), "INSTALLATION_DETECTED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", false), "INSTALLATION_READY");
});
