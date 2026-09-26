import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of ["app/api/auth/register/route.ts", "app/api/auth/invitation/route.ts"]) {
  test(`${file} never falls back to an internal production origin`, () => {
    const source = readFileSync(resolve(process.cwd(), file), "utf8");
    assert.match(source, /process\.env\.NODE_ENV === "production" \? "https:\/\/app\.aifrogi\.com"/);
  });
}

test("verified HotelGPT trial activates only after a successful website crawl", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/auth/invitation/route.ts"), "utf8");
  assert.match(route, /getWebsiteKnowledgeBase\(propertySlug, true\)/);
  assert.match(route, /crawlReady = hotelMode && pagesPrepared > 0/);
  assert.match(route, /TRIAL_BASIC_PUBLIC_BOT_ACTIVATED/);
  assert.match(route, /status: "LIVE"/);
  assert.match(route, /TRIAL_WEBSITE_KNOWLEDGE_NEEDS_ATTENTION/);
  assert.match(route, /remains safely in setup mode/);
});

test("HotelGPT activation keeps the branded email and attaches governed setup resources", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/auth/invitation/route.ts"), "utf8");
  assert.match(route, /HOTELGPT · 15-DAY PUBLIC TRIAL/);
  assert.match(route, /AiFrogi-HotelGPT-Onboarding-Workbook\.xlsx/);
  assert.match(route, /AiFrogi-HotelGPT-Quick-Start-Manual\.pdf/);
  assert.match(route, /Complete hotel information/);
  assert.match(route, /Never place passwords, OTPs, payment credentials or guest records/);
  assert.match(route, /const qr = crawlReady \?/);
  assert.equal(readFileSync(resolve(process.cwd(), "public/downloads/AiFrogi-HotelGPT-Quick-Start-Manual.pdf")).subarray(0, 4).toString(), "%PDF");
  assert.equal(readFileSync(resolve(process.cwd(), "public/downloads/AiFrogi-HotelGPT-Knowledge-Onboarding.xlsx")).subarray(0, 2).toString(), "PK");
});

test("trial registration permits a shared support mobile while retaining website uniqueness", () => {
  const repository = readFileSync(resolve(process.cwd(), "lib/repositories/trial-registration-repository.ts"), "utf8");
  assert.doesNotMatch(repository, /An AiFrogi account already uses this mobile number/);
  assert.doesNotMatch(repository, /ownerMobile: \{ not: null \}/);
  assert.match(repository, /An AiFrogi workspace already uses this business website/);
});
