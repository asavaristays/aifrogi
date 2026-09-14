import assert from "node:assert/strict";
import test from "node:test";
import { answerExactTenantAccessFact, buildDeepTenantContext, extractDeepTenantKnowledge, resolveTenantEntity } from "../../lib/tenant-intelligence/deep-crawl";

const html = `
  <html><head><title>Rohet Garh | Asavari Stays</title></head><body>
  <h1>Rohet Garh</h1>
  <h2>Amenities</h2><ul><li>Swimming Pool</li><li>Wi-Fi</li></ul>
  <h2>Rooms</h2><p>Heritage Suite from INR 6,500 per night.</p>
  <h2>Distance &amp; Access</h2><p>Airport: Jodhpur 35 Kms</p><p>Railway Station: Rohet 7 Kms</p>
  <img src="/uploads/rohet.jpg" />
  </body></html>`;

test("deep tenant extraction preserves property amenities, rooms, access and images", () => {
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", html, "2026-09-14T00:00:00.000Z");
  assert.equal(entity?.entityType, "PROPERTY");
  assert.equal(entity?.entityId, "47");
  assert.equal(entity?.name, "Rohet Garh");
  assert.match(entity?.facts.find((fact) => fact.field === "access")?.value || "", /Airport: Jodhpur 35 Kms/);
  assert.deepEqual(entity?.imageUrls, ["https://asavaristays.com/uploads/rohet.jpg"]);
});

test("exact tenant access answers do not promote a locality into an invented airport name", () => {
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", html, "2026-09-14T00:00:00.000Z");
  const result = answerExactTenantAccessFact(entity ? [entity] : [], "What is the nearest airport to Rohet Garh?");
  assert.equal(result?.answer, "For Rohet Garh, the website lists Airport: Jodhpur 35 Kms.");
  assert.doesNotMatch(result?.answer || "", /Jodhpur Airport/);
});

test("tenant retrieval answers the requested entity and preserves exact airport evidence", () => {
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", html, "2026-09-14T00:00:00.000Z");
  const context = buildDeepTenantContext(entity ? [entity] : [], "What is the nearest airport to Rohet Garh?");
  assert.match(context, /Rohet Garh/);
  assert.match(context, /Airport: Jodhpur 35 Kms/);
  assert.doesNotMatch(context, /Jodhpur Airport/);
});

test("tenant entity catalogue resolves aliases and small spelling mistakes", () => {
  const html = `<html><head><title>Jawai Damstay | Asavari Stays</title><script type="application/ld+json">{"alternateName":"Jawai Dam Stay"}</script></head><body><h1>Jawai Damstay</h1><h2>Rooms</h2><p>Deluxe cottage rooms.</p></body></html>`;
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/31", html, "2026-09-14T00:00:00.000Z");
  assert.ok(entity);
  assert.ok(entity.aliases.includes("Jawai Dam Stay"));
  assert.equal(resolveTenantEntity([entity], "rate for jawai dam saty")?.entityId, "31");
  assert.ok(entity.vocabulary.includes("availability"));
});

test("short transposed entity spelling still uses exact source wording", () => {
  const html = `<html><head><title>Rohet Garh | Asavari Stays</title></head><body><h1>Rohet Garh</h1><h2>Request a Booking</h2><p>Airport: Jodhpur 35 Kms; Railway Station: Jodhpur 35 Kms.</p></body></html>`;
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", html, "2026-09-14T00:00:00.000Z");
  const result = answerExactTenantAccessFact(entity ? [entity] : [], "What is the nearest airport to Rohet Grah?");
  assert.equal(result?.answer, "For Rohet Garh, the website lists Airport: Jodhpur 35 Kms.");
});
