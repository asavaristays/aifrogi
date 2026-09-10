import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const detailPage = readFileSync(resolve(process.cwd(), "app/admin/customers/[id]/page.tsx"), "utf8");
const queuePage = readFileSync(resolve(process.cwd(), "app/admin/customers/page.tsx"), "utf8");

test("Super Admin exposes website-only AI Bot onboarding", () => {
  assert.match(detailPage, /AI Bot Onboarding/);
  assert.match(detailPage, /<BotProfileConfigurator[^>]+websiteOnly/);
  assert.doesNotMatch(detailPage, /whats\s*app|meta business|meta webhook/i);
  assert.doesNotMatch(queuePage, /\?onboarding=whatsapp/);
});
