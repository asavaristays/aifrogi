import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { listDemoFixtures, matchDemoAction, missingDemoActionRequirements } from "../../lib/demo-sandbox/fixtures";

test("all persona packs have one isolated, clearly synthetic demo fixture", () => {
  const fixtures = listDemoFixtures();
  assert.equal(fixtures.length, 8);
  assert.equal(new Set(fixtures.map((item) => item.category)).size, 8);
  assert.equal(new Set(fixtures.map((item) => item.slug)).size, 8);
  for (const fixture of fixtures) {
    assert.ok(fixture.businessName.includes("Demo"));
    assert.ok(fixture.slug.startsWith("demo-"));
    assert.ok(fixture.facts.length >= 3);
    assert.ok(fixture.actions.length >= 1);
    assert.ok(fixture.failurePrompt.length > 20);
    for (const action of fixture.actions) {
      assert.match(action.answer.toLowerCase(), /demo|synthetic|no real/);
      assert.ok(action.connectorKey.length > 2);
      assert.ok(action.operation.length > 2);
    }
  }
});

test("persona journeys select the correct mock connector contract", () => {
  assert.equal(matchDemoAction("PINGBOOK", "Please book an appointment")?.connectorKey, "GOOGLE_CALENDAR");
  assert.equal(matchDemoAction("STAY", "Check room availability")?.connectorKey, "PMS_AVAILABILITY");
  assert.equal(matchDemoAction("RESTAURANT", "Reserve a table")?.connectorKey, "RESERVATION_SYSTEM");
  assert.equal(matchDemoAction("EDUCATION", "Arrange counselling")?.connectorKey, "COUNSELLING_CALENDAR");
  assert.equal(matchDemoAction("REAL_ESTATE", "Plan a site visit")?.connectorKey, "SITE_VISIT_CALENDAR");
  assert.equal(matchDemoAction("FLOWCART", "Order a cake")?.connectorKey, "COMMERCE_CATALOG");
  assert.equal(matchDemoAction("CUSTOM", "Create a maintenance request")?.connectorKey, "CUSTOM_SYSTEM");
  assert.equal(matchDemoAction("BUSINESS_AI", "I need a consultation")?.connectorKey, "LEAD_SYSTEM");
  assert.equal(matchDemoAction("FLOWCART", "What products can I order?"), null);
});

test("vague action requests remain in clarification until required category slots exist", () => {
  assert.deepEqual(missingDemoActionRequirements("PINGBOOK", ["Book an appointment"]), ["preferred day and time", "fictional demo patient name"]);
  assert.deepEqual(missingDemoActionRequirements("STAY", ["I need a room"]), ["check-in and check-out dates", "number of guests"]);
  assert.deepEqual(missingDemoActionRequirements("RESTAURANT", ["Reserve a table"]), ["date and time", "party size"]);
  assert.equal(missingDemoActionRequirements("FLOWCART", ["Order one cake for delivery"]).length, 0);
});

test("public runtime and reset control enforce demo isolation", () => {
  const runtime = fs.readFileSync("app/api/public/website-bot/[slug]/route.ts", "utf8");
  const service = fs.readFileSync("lib/demo-sandbox/service.ts", "utf8");
  assert.match(runtime, /organization\?\.isDemo/);
  assert.match(runtime, /!categoryBoundary/);
  assert.match(runtime, /AIFROGI_DEMO_MOCK_CONNECTOR/);
  assert.match(service, /isDemo: true/);
  assert.match(service, /Only an isolated demo sandbox can be reset/);
  assert.match(service, /demoConnectorEvent\.deleteMany/);
});

test("demo UI discloses synthetic data and no real transaction", () => {
  const widget = fs.readFileSync("components/website-bot/website-bot-embed.tsx", "utf8");
  assert.match(widget, /Demo · Synthetic/);
  assert.match(widget, /No real transaction or notification/);
  assert.match(widget, /use fictional contact details/);
});
