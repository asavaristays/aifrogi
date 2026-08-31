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
  assert.doesNotMatch(page, /WhatsAppCostCalculator|IntegrationPricing/);
});

test("connector estimates and payment boundaries remain visible", () => {
  for (const name of ["Google Sheets", "Google Calendar", "E-commerce Store", "PMS / Channel Manager"]) assert.match(pricing, new RegExp(name.replace("/", "\\/")));
  assert.match(pricing, /Indicative one-time total/);
  assert.match(pricing, /Read full payment and service terms/);
  assert.match(terms, /Refunds and billing corrections/);
  assert.match(terms, /third-party charges/);
});
