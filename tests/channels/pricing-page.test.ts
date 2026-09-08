import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const pricing = readFileSync(resolve(process.cwd(), "components/marketing/ai-bot-pricing.tsx"), "utf8");
const page = readFileSync(resolve(process.cwd(), "app/pricing/page.tsx"), "utf8");
const terms = readFileSync(resolve(process.cwd(), "app/terms-of-service/page.tsx"), "utf8");

test("overflowing connector table exposes a labelled slider and PDF shortcut", () => {
  const table = readFileSync(resolve(process.cwd(), "components/marketing/connector-pricing-table.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "components/marketing/connector-pricing-table.module.css"), "utf8");
  assert.match(table, /type="range"/);
  assert.match(table, /aria-label="Slide connector table horizontally"/);
  assert.match(table, /Show PDF downloads/);
  assert.match(table, /slideTo\(100\)/);
  assert.match(table, /slideTo\(0\)/);
  assert.match(table, /element\.scrollWidth - element\.clientWidth/);
  assert.match(table, /addEventListener\('scroll', update/);
  assert.match(table, /observer\?\.disconnect\(\)/);
  assert.match(css, /overflow-x:auto/);
});

test("public pricing is AI Bot-first and contains the approved launch plans", () => {
  assert.match(pricing, /15-day trial/);
  assert.match(pricing, /₹499/);
  assert.match(pricing, /₹4,999/);
  assert.match(pricing, /Pay ₹499 monthly or ₹4,999 yearly and save ₹989/);
  assert.match(pricing, /Already have an account\? Pay securely/);
  assert.match(pricing, /app\.aifrogi\.com\/billing\?checkout=1/);
  assert.match(pricing, /aria-pressed=\{!annual\}/);
  assert.match(pricing, /aria-pressed=\{annual\}/);
  assert.match(pricing, /Custom \/ Enterprise/);
  assert.match(pricing, /1,000 AI replies/);
  assert.match(pricing, /No surprise cap/);
  assert.match(pricing, /500/);
  assert.match(pricing, /₹399/);
  assert.match(pricing, /₹999/);
  assert.match(pricing, /₹2,999/);
  assert.match(pricing, /No automatic top-up or silent overage/);
  assert.doesNotMatch(pricing, /Fair-use limits apply/);
  assert.doesNotMatch(page, /WhatsAppCostCalculator|IntegrationPricing/);
});

test("connector estimates and payment boundaries remain visible", () => {
  const guides = JSON.parse(readFileSync(resolve(process.cwd(), "data/connector-guides.json"), "utf8"));
  assert.equal(guides.length, 7);
  assert.equal(new Set(guides.map((g: {id:string})=>g.id)).size, 7);
  for (const name of ["Google Sheets", "Google Calendar", "Shopify / WooCommerce", "PMS / Channel Manager"]) assert.ok(guides.some((g: {name:string})=>g.name === name));
  for (const guide of guides) {
    assert.ok(guide.prepare.length >= 4 && guide.fee && guide.excludes && guide.bots);
    assert.equal(readFileSync(resolve(process.cwd(), `public/downloads/AiFrogi-${guide.id}-Checklist.pdf`)).subarray(0, 4).toString(), '%PDF');
  }
  assert.match(pricing, /Need calendar, CRM, payment, ecommerce or PMS integration/);
  assert.match(pricing, /Connector pricing is quoted separately/);
  assert.match(pricing, /Read full payment and service terms/);
  assert.match(terms, /Refunds and billing corrections/);
  assert.match(terms, /third-party charges/);
});

test("deferred messaging pricing is absent from the main application", () => {
  assert.doesNotMatch(pricing, /WhatsApp|Meta usage|whatsapp-api/i);
  assert.equal(existsSync(resolve(process.cwd(), "app/whatsapp-api/page.tsx")), false);
});
