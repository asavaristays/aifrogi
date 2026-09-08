import test from "node:test";
import assert from "node:assert/strict";
import { listBotPersonaPacks, getBotPersonaPack } from "../../lib/bot-persona-packs";
import { BUCKET_THREE_CASES, REQUIRED_CATEGORIES, REQUIRED_JOURNEYS } from "./fixtures/bucket-three-cases";

test("B3-A fixed bank contains all 80 unique required journey specifications", () => {
  assert.equal(BUCKET_THREE_CASES.length, 80);
  assert.equal(new Set(BUCKET_THREE_CASES.map(c => c.id)).size, 80);
  assert.deepEqual(listBotPersonaPacks().map(p => p.category).sort(), [...REQUIRED_CATEGORIES].sort());
});
for (const category of REQUIRED_CATEGORIES) test(`B3-A ${category} has ten runnable inputs and a governed persona contract`, () => {
  const cases = BUCKET_THREE_CASES.filter(c => c.category === category);
  assert.deepEqual(cases.map(c => c.journey), [...REQUIRED_JOURNEYS]);
  const pack = getBotPersonaPack(category);
  assert.ok(pack.requiredSlots.includes("contact_consent"));
  assert.ok(pack.unauthorizedWithoutEscalation.length > 0);
  assert.ok(pack.connectors.every(c => c.unavailableBehavior.length > 15));
  for (const c of cases) {
    assert.match(c.fixtureSlug, /^demo-/);
    assert.ok(c.turns.length && c.turns.every(t => t.trim().length > 0));
    assert.ok(c.expected.length > 30);
    assert.equal(c.evidenceRequired.length, 5);
  }
});
