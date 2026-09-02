import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const detailPage = readFileSync(resolve(process.cwd(), "app/admin/customers/[id]/page.tsx"), "utf8");
const queuePage = readFileSync(resolve(process.cwd(), "app/admin/customers/page.tsx"), "utf8");

test("Super Admin keeps AI Bot and optional WhatsApp onboarding isolated", () => {
  assert.match(detailPage, /AI Bot Onboarding/);
  assert.match(detailPage, /WhatsApp Onboarding/);
  assert.match(detailPage, /activeTrack === "ai-bot"/);
  assert.match(detailPage, /!whatsappEnabled/);
  assert.match(detailPage, /requestedTrack === "whatsapp" && whatsappEnabled/);
  assert.match(detailPage, /whatsappEnabled \? <TrackLink/);
  assert.match(detailPage, /websiteOnly={!whatsappEnabled}/);
  assert.match(queuePage, /\?onboarding=ai-bot/);
  assert.doesNotMatch(queuePage, /\?onboarding=whatsapp/);
});
