import assert from "node:assert/strict";
import test from "node:test";
import { buildTenantProfileDraft, classifyTenantPage, extractWebsiteTenantFacts, reconcileTenantFacts, sourceAuthority, type TenantFact } from "../../lib/tenant-intelligence/fact-factory";

const observedAt = "2026-09-11T05:00:00.000Z";

test("tenant pages are classified before facts are extracted", () => {
  assert.equal(classifyTenantPage("https://hotel.test/pricing", "Room tariffs"), "PRICING");
  assert.equal(classifyTenantPage("https://hotel.test/about-us", "Our story"), "ABOUT");
  assert.equal(classifyTenantPage("https://hotel.test/contact", "Reach us"), "CONTACT");
});

test("website facts normalize contact details and retain provenance", () => {
  const facts = extractWebsiteTenantFacts({ url: "https://hotel.test/contact", title: "Contact | Asavari Stays", text: "Contact our team at BOOK@ASAVARISTAYS.COM or +91 98765-43210. We are open Monday to Saturday, 9 AM to 6 PM. Address: Jodhpur, India.", crawledAt: observedAt });
  assert.ok(facts.some((fact) => fact.field === "email" && fact.value === "book@asavaristays.com"));
  assert.ok(facts.some((fact) => fact.field === "phone" && fact.value === "+919876543210"));
  assert.ok(facts.every((fact) => fact.sourceUrl === "https://hotel.test/contact" && fact.sourceType === "WEBSITE"));
});

test("client corrections outrank files and crawl without hiding equal-authority conflicts", () => {
  const make = (field: TenantFact["field"], value: string, sourceType: TenantFact["sourceType"], authority: number): TenantFact => ({ key: `${field}:${value.toLowerCase()}`, field, value, sourceType, authority, confidence: 0.9, observedAt, refreshDays: 90 });
  const result = reconcileTenantFacts([
    make("phone", "9876543210", "WEBSITE", sourceAuthority("WEBSITE")),
    make("phone", "9999999999", "CORRECTION", sourceAuthority("CORRECTION")),
    make("phone", "8888888888", "CORRECTION", sourceAuthority("CORRECTION"))
  ]);
  assert.equal(result.facts[0].sourceType, "CORRECTION");
  assert.equal(result.conflicts.length, 1);
  assert.deepEqual(new Set(result.conflicts[0].values), new Set(["9999999999", "8888888888"]));
});

test("profile draft produces an approval punch list instead of inventing missing facts", () => {
  const facts = extractWebsiteTenantFacts({ url: "https://hotel.test/", title: "Asavari Stays | Boutique hotels", text: "We are a boutique stay company. We offer curated hotel stays and travel planning. Contact book@hotel.test or 9876543210.", crawledAt: observedAt });
  const profile = buildTenantProfileDraft(facts, "STAY");
  assert.equal(profile.status, "DRAFT");
  assert.ok(profile.businessName.includes("Asavari Stays"));
  assert.ok(profile.missing.includes("policy"));
  assert.ok(profile.missing.includes("price"));
});

test("website extraction rejects narrative text as hours, address or price", () => {
  const contactFacts = extractWebsiteTenantFacts({ url: "https://tenant.test/contact", title: "Contact", crawledAt: "2026-09-14T00:00:00.000Z", text: "Watch the sun disappear over Goa. We are open to new travel ideas. Contact our helpful team in India." });
  assert.equal(contactFacts.some((fact) => fact.field === "hours"), false);
  assert.equal(contactFacts.some((fact) => fact.field === "address"), false);
  const pricingFacts = extractWebsiteTenantFacts({ url: "https://tenant.test/packages", title: "Packages", crawledAt: "2026-09-14T00:00:00.000Z", text: "Explore our curated package and plan a memorable stay." });
  assert.equal(pricingFacts.some((fact) => fact.field === "price"), false);
});

test("hotel crawl structures operational facts for review instead of burying them in page text", () => {
  const facts = extractWebsiteTenantFacts({
    url: "https://hotel.test/reservations",
    title: "Rooms, amenities and reservations",
    crawledAt: observedAt,
    text: "Reservations: +91 98765-43210 or stay@hotel.test. Address: Fort Campus, Main Market, Mandawa, Jhunjhunu, Rajasthan 333704. Our Heritage Suite is INR 6,500 per night and includes Wi-Fi, swimming pool and parking. Check-in is 2 PM and cancellation requires 48 hours notice. Jodhpur Airport is 170 km away. Check availability at https://hotel.test/booking/availability."
  });
  const fields = new Set(facts.map((fact) => fact.field));
  for (const field of ["phone", "email", "address", "rooms", "price", "amenities", "policy", "access", "booking_url"] as const) assert.ok(fields.has(field), `${field} should be structured`);
  const profile = buildTenantProfileDraft(facts, "STAY");
  assert.equal(profile.bookingLinks[0], "https://hotel.test/booking/availability");
  assert.ok(profile.access.some((value) => /Airport.*170 km/i.test(value)));
});
