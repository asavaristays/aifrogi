import test from "node:test";
import assert from "node:assert/strict";
import { fixture, profile, org, session, claim } from "./http-runtime-fixture";
import { BUCKET_THREE_CASES } from "./fixtures/bucket-three-cases";

const categories = ["BUSINESS_AI", "STAY", "PINGBOOK", "RESTAURANT"];
// Forty journeys through the actual handler, deterministic model and isolated DB.
// Two groups separate knowledge/transport from demo connector/safety checks.
const journeys = ["approved_answer", "paraphrase", "affirmative", "topic_return", "human_request", "tenant_isolation"];
for (const scenario of BUCKET_THREE_CASES.filter(c => categories.includes(c.category) && journeys.includes(c.journey))) {
  test(`${scenario.id} ${scenario.journey}`, async () => {
    profile.category = scenario.category;
    const fact = scenario.approvedFact;
    fixture.claims = [claim("PUBLISHED", { question: fact.question, answer: fact.answer, category: fact.category, claimKey: scenario.category })];
    fixture.modelAnswer = fact.answer;
    if (scenario.journey === "tenant_isolation") fixture.claims[0].propertyId = "tenant-b";
    const send = session();
    const responses = [];
    for (const turn of scenario.turns) {
      const result = await send(turn);
      assert.equal(result.httpStatus, 200);
      responses.push(result);
    }
    const last = responses.at(-1)!;
    if (["approved_answer", "paraphrase", "topic_return"].includes(scenario.journey)) {
      assert.equal(last.answer, fact.answer);
      assert.equal(last.governance.disposition, "ANSWER");
      assert.deepEqual(fixture.evidence.at(-1).usedClaimIds, ["claim-a"]);
    }
    if (scenario.journey === "topic_return") assert.equal(responses[1].governance.disposition, "REFUSE");
    if (scenario.journey === "affirmative") {
      assert.equal(last.governance.disposition, "CLARIFY", "No offer was made: yes must not invent one");
      assert.equal(fixture.calls, 1);
    }
    if (scenario.journey === "human_request") assert.equal(fixture.operations.size, 1, "Repeated human request must be durable and deduplicated");
    if (scenario.journey === "tenant_isolation") {
      assert.equal(fixture.calls, 0);
      assert.equal(last.grounded, false);
      assert.ok(!last.answer.includes(fact.answer));
      assert.deepEqual(fixture.evidence.at(-1).usedClaimIds, []);
    }
    for (const evidence of fixture.evidence) assert.equal(evidence.propertyId, "tenant-a");
  });
}

const outagePrompts: Record<string, string> = {
  BUSINESS_AI: "Book a website consultation tomorrow at 4 PM; the CRM is offline.",
  STAY: "Check room availability from Monday to Tuesday for 2 guests; the PMS is offline.",
  PINGBOOK: "Book a dental appointment tomorrow at 4 PM for demo patient; the calendar is offline.",
  RESTAURANT: "Reserve a table tomorrow at 8 PM for 2 people; the reservation system is offline."
};
for (const scenario of BUCKET_THREE_CASES.filter(c => categories.includes(c.category) && !journeys.includes(c.journey))) {
  test(`${scenario.id} ${scenario.journey}`, async () => {
    profile.category = scenario.category;
    fixture.claims = [];
    org.isDemo = scenario.journey !== "authority_boundary";
    const send = session();
    // Explicit outage with all slots supplied: the older Dine fixture's allergen
    // question is a safety test, not a connector outage. Never count it as one.
    const turns = scenario.journey === "connector_failure" ? [outagePrompts[scenario.category]] : scenario.turns;
    const responses = [];
    for (const turn of turns) responses.push(await send(turn));
    const last = responses.at(-1)!;
    assert.equal(last.httpStatus, 200);
    if (scenario.journey === "missing_slot") {
      assert.equal(last.governance.disposition, "CLARIFY");
      assert.equal(fixture.connectorEvents.size, 0);
    }
    if (scenario.journey === "loop_exit") {
      assert.equal(responses[0].governance.disposition, "CLARIFY");
      assert.equal(last.governance.circuitBreaker, true);
      assert.equal(fixture.connectorEvents.size, 0);
    }
    if (scenario.journey === "connector_failure") {
      assert.equal(last.governance.disposition, "ESCALATE");
      assert.equal(fixture.connectorEvents.size, 1);
      const event = [...fixture.connectorEvents.values()][0] as any;
      assert.equal(event.demoSandboxId, "sandbox-a");
      assert.equal(event.status, "SAFE_FAILURE");
      assert.equal(event.response.performed, false);
    }
    if (scenario.journey === "authority_boundary") {
      assert.ok(["ESCALATE", "REFUSE", "CLARIFY"].includes(last.governance.disposition));
      assert.equal(fixture.calls, 0);
      assert.equal(fixture.connectorEvents.size, 0);
    }
    for (const evidence of fixture.evidence) assert.equal(evidence.propertyId, "tenant-a");
  });
}
