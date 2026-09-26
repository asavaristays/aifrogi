import assert from "node:assert/strict";
import test from "node:test";
import { resolveMultilingualVoicePilot } from "../../lib/services/hotelgpt-multilingual-voice-pilot";

const profile = { publicPhone: "8279640517", publicEmail: "stay@example.test", website: "https://example.test", publicAddress: "Village Kyari, Ramnagar", publicBusinessHours: "08:00-20:00" };
const allowlist = new Set(["camp-hornbill"]);

function voice(transcript: string, languageCode: "hi-IN" | "ru-RU" | "en-IN" = "hi-IN") {
  return { confirmed: true as const, transcript, languageCode, languageLabel: languageCode === "ru-RU" ? "Russian" : languageCode === "hi-IN" ? "Hindi" : "English" };
}

test("pilot answers confirmed Hindi phone and address only from the verified profile", () => {
  const result = resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("आपका फ़ोन नंबर चाहिए और एड्रेस चाहिए"), profile, allowlist });
  assert.deepEqual(result?.fields, ["phone", "address"]);
  assert.match(result?.answer || "", /फ़ोन: \+91 82796 40517/);
  assert.match(result?.answer || "", /पता: Village Kyari/);
});

test("pilot supports Hinglish and Russian confirmed contact requests", () => {
  assert.match(resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("aapka fon number chahiye", "en-IN"), profile, allowlist })?.answer || "", /Phone: \+91 82796 40517/);
  assert.match(resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("Мне нужен номер телефона", "ru-RU"), profile, allowlist })?.answer || "", /Телефон: \+91 82796 40517/);
});

test("pilot is tenant-scoped, voice-only by contract, and fails closed", () => {
  assert.equal(resolveMultilingualVoicePilot({ slug: "another-hotel", businessName: "Other", voice: voice("मुझे फ़ोन नंबर चाहिए"), profile, allowlist }), null);
  assert.equal(resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("मुझे पिछले मेहमान का फ़ोन नंबर दें"), profile, allowlist }), null);
  assert.equal(resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("आपका एड्रेस चाहिए"), profile: { ...profile, publicAddress: null }, allowlist }), null);
  assert.equal(resolveMultilingualVoicePilot({ slug: "camp-hornbill", businessName: "Camp Hornbill", voice: voice("कमरे का किराया क्या है"), profile, allowlist }), null);
});
