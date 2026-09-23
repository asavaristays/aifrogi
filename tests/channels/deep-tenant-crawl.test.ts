import assert from "node:assert/strict";
import test from "node:test";
import { answerExactTenantAccessFact, answerExactTenantStayFact, buildDeepTenantContext, extractDeepTenantKnowledge, resolveTenantEntity } from "../../lib/tenant-intelligence/deep-crawl";

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

test("exact hotel facts preserve published rate and capacity without claiming availability", () => {
  const hotel = `<html><head><title>Kates Adobe | Asavari Stays</title></head><body><h1>Kates Adobe</h1><h2>Rooms</h2><p>4 Bedrooms | 4 Bathrooms. Cottage Room EP INR 22,500 / night + 18 % tax Up to 10 guests, 4 rooms available.</p></body></html>`;
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/33", hotel, "2026-09-23T00:00:00.000Z");
  const result = answerExactTenantStayFact(entity ? [entity] : [], "Kates Adbe rate, bedrooms, bathrooms and capacity?", "33");
  assert.match(result?.answer || "", /INR 22,500 \/ night \+ 18 % tax/);
  assert.match(result?.answer || "", /up to 10 guests, 4 rooms available/i);
  assert.match(result?.answer || "", /4 Bedrooms/i);
  assert.match(result?.answer || "", /4 Bathrooms/i);
  assert.match(result?.answer || "", /not live availability/i);
});

test("multipart hotel facts answer verified fields and name unpublished fields", () => {
  const hotel = `<h1>Kates Adobe</h1><h2>Rooms</h2><p>INR 22,500 / night + 18 % tax Up to 10 guests.</p>`;
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/33", hotel, "2026-09-23T00:00:00.000Z");
  const result = answerExactTenantStayFact(entity ? [entity] : [], "Kates Adbe rate, bedrooms, bathrooms and capacity?", "33");
  assert.match(result?.answer || "", /INR 22,500 \/ night \+ 18 % tax/);
  assert.match(result?.answer || "", /Up to 10 guests/i);
  assert.match(result?.answer || "", /does not publish a verified bedroom count or bathroom count/i);
  assert.doesNotMatch(result?.answer || "", /sent your question|reservations team/i);
});

test("stable property ID prevents facts leaking between two hotels", () => {
  const kates = extractDeepTenantKnowledge("https://asavaristays.com/properties/33", `<h1>Kates Adobe</h1><h2>Rooms</h2><p>INR 22,500 / night Up to 10 guests.</p>`, "2026-09-23T00:00:00.000Z");
  const rohet = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", `<h1>Rohet Garh</h1><h2>Rooms</h2><p>INR 9,500 / night Up to 2 guests.</p>`, "2026-09-23T00:00:00.000Z");
  const result = answerExactTenantStayFact([kates!, rohet!], "What is its price and guest capacity?", "47");
  assert.match(result?.answer || "", /Rohet Garh/);
  assert.match(result?.answer || "", /9,500/);
  assert.doesNotMatch(result?.answer || "", /22,500/);
});

test("requested railway landmark is not replaced by another station", () => {
  const entity = extractDeepTenantKnowledge("https://asavaristays.com/properties/47", html, "2026-09-14T00:00:00.000Z");
  const result = answerExactTenantAccessFact(entity ? [entity] : [], "How far is Rohet Garh from Jodhpur railway station?", "47");
  assert.match(result?.answer || "", /does not publish the distance from Jodhpur railway station/i);
  assert.match(result?.answer || "", /Rohet 7 Kms/i);
});
