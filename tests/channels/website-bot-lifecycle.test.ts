import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { canServeWebsiteBot, nextWebsiteBotStatus } from "../../lib/website-bot-lifecycle";

test("only explicitly approved live website bots may serve visitors", () => {
  assert.equal(canServeWebsiteBot("CONFIGURED", ["WEBSITE"]), false);
  assert.equal(canServeWebsiteBot("LIVE", ["WEBSITE"]), true);
  for (const status of ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED", "PAUSED", "DELETED"]) assert.equal(canServeWebsiteBot(status, ["WEBSITE"]), false);
  assert.equal(canServeWebsiteBot("LIVE", ["WHATSAPP"]), false);
});

test("go-live requires installation detection", () => {
  assert.throws(() => nextWebsiteBotStatus("DELETED", "MAKE_LIVE", true), /Restore/);
  assert.throws(() => nextWebsiteBotStatus("INSTALLATION_READY", "MAKE_LIVE", false), /Install the code/);
  assert.equal(nextWebsiteBotStatus("INSTALLATION_DETECTED", "MAKE_LIVE", true), "LIVE");
});

test("pause, soft delete and restore are deterministic", () => {
  assert.equal(nextWebsiteBotStatus("LIVE", "PAUSE", true), "PAUSED");
  assert.equal(nextWebsiteBotStatus("PAUSED", "DELETE", true), "DELETED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", true), "INSTALLATION_DETECTED");
  assert.equal(nextWebsiteBotStatus("DELETED", "RESTORE", false), "INSTALLATION_READY");
});

test("JavaScript delivery uses a responsive launcher and trusted minimize message", () => {
  const installer = readFileSync("app/api/public/website-bot/[slug]/install/route.ts", "utf8");
  assert.match(installer, /aria-expanded/);
  assert.match(installer, /a\.logoUrl/);
  assert.match(installer, /a\.themeColor/);
  assert.match(installer, /a\.botName/);
  assert.match(installer, /max-width:640px/);
  assert.match(installer, /max-height:520px/);
  assert.match(installer, /window\.visualViewport/);
  assert.match(installer, /--aifrogi-vh/);
  assert.match(installer, /width:var\(--aifrogi-vw\);height:var\(--aifrogi-vh\)/);
  assert.match(installer, /mode=launcher/);
  assert.match(installer, /AIFROGI_WIDGET_CLOSE/);
  assert.match(installer, /e\.origin===/);
  assert.match(installer, /100dvh/);
});

test("only launcher-mode embeds expose the minimize control", () => {
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(embedPage, /dismissible=\{mode === "launcher"\}/);
  assert.match(widget, /aria-label="Minimize AI Bot"/);
  assert.match(widget, /window\.parent\.postMessage\(\{ type: "AIFROGI_WIDGET_CLOSE", slug \}, "\*"\)/);
});

test("workspace menu configuration flows through Setup and public bot surfaces", () => {
  const setup = readFileSync("app/(app)/setup/page.tsx", "utf8");
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(setup, /BotMenuSettings/);
  assert.match(embedPage, /menu=\{settings\.widgetMenu\}/);
  assert.match(standalone, /menu=\{settings\.widgetMenu\}/);
  assert.match(widget, /menu\.enabled/);
});

test("widget theme flows from Setup to embedded and standalone bots", () => {
  const appearance = readFileSync("components/setup/bot-appearance-settings.tsx", "utf8");
  const repository = readFileSync("lib/repositories/knowledge-repository.ts", "utf8");
  const embedPage = readFileSync("app/embed/[slug]/page.tsx", "utf8");
  const standalone = readFileSync("app/bot/[slug]/page.tsx", "utf8");
  const widget = readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(appearance, /\["dark", "light", "system"\]/);
  assert.match(repository, /widgetTheme: "dark"/);
  assert.match(embedPage, /widgetTheme=\{settings\.widgetTheme\}/);
  assert.match(standalone, /widgetTheme=\{settings\.widgetTheme\}/);
  assert.match(widget, /data-widget-theme=\{widgetTheme\}/);
});
