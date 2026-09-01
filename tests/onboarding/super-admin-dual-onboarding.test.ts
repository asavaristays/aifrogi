import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const detailPage = readFileSync(resolve(process.cwd(), "app/admin/customers/[id]/page.tsx"), "utf8");
const queuePage = readFileSync(resolve(process.cwd(), "app/admin/customers/page.tsx"), "utf8");

test("Super Admin exposes independent AI Bot and WhatsApp onboarding tracks", () => {
  assert.match(detailPage, /AI Bot Onboarding/);
  assert.match(detailPage, /WhatsApp Onboarding/);
  assert.match(detailPage, /activeTrack === "ai-bot"/);
  assert.match(detailPage, /!whatsappEnabled/);
  assert.match(queuePage, /\?onboarding=ai-bot/);
  assert.match(queuePage, /\?onboarding=whatsapp/);
});
