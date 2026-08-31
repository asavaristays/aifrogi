import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pricing = readFileSync(resolve(process.cwd(), "components/marketing/ai-bot-pricing.tsx"), "utf8");
const page = readFileSync(resolve(process.cwd(), "app/pricing/page.tsx"), "utf8");
const terms = readFileSync(resolve(process.cwd(), "app/terms-of-service/page.tsx"), "utf8");

test("public pricing is AI Bot-first and contains the approved launch plans", () => {
  assert.match(pricing, /15-day trial/);
  assert.match(pricing, /₹499/);
  assert.match(pricing, /₹4,999/);
  assert.match(pricing, /Custom \/ Enterprise/);
  assert.match(pricing, /1,000 AI replies/);
  assert.match(pricing, /No surprise cap/);
  assert.doesNotMatch(pricing, /Fair-use limits apply/);
  assert.doesNotMatch(page, /WhatsAppCostCalculator|IntegrationPricing/);
});

test("connector estimates and payment boundaries remain visible", () => {
  for (const name of ["Google Sheets", "Google Calendar", "E-commerce Store", "PMS / Channel Manager"]) assert.match(pricing, new RegExp(name.replace("/", "\\/")));
  assert.match(pricing, /Indicative one-time total/);
  assert.match(pricing, /Read full payment and service terms/);
  assert.match(terms, /Refunds and billing corrections/);
  assert.match(terms, /third-party charges/);
});

test("WhatsApp remains an optional separately priced channel", () => {
  assert.match(pricing, /Add WhatsApp to your AI Bot/);
  assert.match(pricing, /₹3,750\/qtr/);
  assert.match(pricing, /₹25,500\/qtr/);
  assert.match(pricing, /One-time setup — ₹4,500/);
  assert.match(pricing, /\/whatsapp-api#calculator/);
  assert.match(pricing, /Meta usage billed separately/);
});
