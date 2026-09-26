import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { formatConfirmedVoiceForStaff, normalizeConfirmedVoiceInput } from "../../lib/hotelgpt-voice-intake";

test("voice metadata is accepted only when the guest confirmed the exact transcript", () => {
  const valid = normalizeConfirmedVoiceInput({ confirmed: true, languageCode: "ru-RU", transcript: "В ванной нет горячей воды" }, "В ванной нет горячей воды");
  assert.equal(valid?.languageLabel, "Russian");
  assert.equal(normalizeConfirmedVoiceInput({ confirmed: false, languageCode: "ru-RU", transcript: "test" }, "test"), null);
  assert.equal(normalizeConfirmedVoiceInput({ confirmed: true, languageCode: "ru-RU", transcript: "changed" }, "different"), null);
  assert.equal(normalizeConfirmedVoiceInput({ confirmed: true, languageCode: "unknown", transcript: "test" }, "test"), null);
});

test("staff view preserves the confirmed original and labels the English translation", () => {
  const input = normalizeConfirmedVoiceInput({ confirmed: true, languageCode: "ru-RU", transcript: "В ванной нет горячей воды" }, "В ванной нет горячей воды");
  assert.ok(input);
  assert.equal(formatConfirmedVoiceForStaff(input, "There is no hot water in the bathroom."), "Confirmed voice transcript · Russian\nOriginal: В ванной нет горячей воды\nEnglish: There is no hot water in the bathroom.");
});

test("PreStay and verified InStay share a compact confirmed voice control", () => {
  const embed = readFileSync(resolve(process.cwd(), "components/website-bot/website-bot-embed.tsx"), "utf8");
  const control = readFileSync(resolve(process.cwd(), "components/website-bot/voice-intake-control.tsx"), "utf8");
  const route = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");
  assert.match(embed, /isHotelGuest \? <VoiceIntakeControl/);
  assert.match(control, /Speak your message/);
  assert.match(control, /I confirm this transcript matches what I said/);
  assert.match(control, /audio is not stored by AiFrogi/);
  assert.match(route, /translateConfirmedVoiceForStaff/);
  assert.match(route, /formatConfirmedVoiceForStaff/);
  assert.match(route, /IN_STAY_EMERGENCY/);
});
