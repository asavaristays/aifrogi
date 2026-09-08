import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const detailPage = readFileSync(resolve(process.cwd(), "app/admin/customers/[id]/page.tsx"), "utf8");
const queuePage = readFileSync(resolve(process.cwd(), "app/admin/customers/page.tsx"), "utf8");

test("Super Admin exposes website-only AI Bot onboarding", () => {
  assert.match(detailPage, /AI Bot Onboarding/);
  assert.match(detailPage, /const whatsappEnabled = false/);
  assert.match(detailPage, /<BotProfileConfigurator[^>]+websiteOnly/);
  assert.match(queuePage, /\?onboarding=ai-bot/);
  assert.doesNotMatch(queuePage, /\?onboarding=whatsapp/);
});
