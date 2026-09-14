import assert from "node:assert/strict";
import test from "node:test";
import { coreEntityFacts, extractCoreEntities } from "../../lib/sovereign-intelligence/entities";
import { classifySovereignIntent } from "../../lib/sovereign-intelligence/decision";
import { governResolutionOutcome } from "../../lib/sovereign-intelligence/resolution";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

test("Indian phone, email and pincode are disambiguated and normalized", () => {
  const values = extractCoreEntities("Email ME@Example.COM, call 98765-43210 and PIN 342001");
  assert.ok(values.some((v) => v.kind === "EMAIL" && v.normalized === "me@example.com"));
  assert.ok(values.some((v) => v.kind === "PHONE" && v.normalized === "+919876543210"));
  assert.ok(values.some((v) => v.kind === "PINCODE" && v.normalized === "342001"));
});

test("dates, times, currency, quantity and booking references normalize before slot use", () => {
  const facts = coreEntityFacts(extractCoreEntities("Booking ref ASV-77881 for 2 guests on 12/09/2026 at 7:30 pm, budget Rs. 12,500"));
  assert.deepEqual(facts, { date: "2026-09-12", time: "7:30pm", currency: "INR 12500", quantity: "2 guests", bookingReference: "ASV-77881" });
});

test("contact entities require explicit consent before becoming contact facts", () => {
  const entities = extractCoreEntities("Call me on 9876543210 or a@example.com");
  assert.equal(coreEntityFacts(entities).contact, undefined);
  assert.equal(coreEntityFacts(entities, { consentContact: true }).contact, "+919876543210");
});

test("negated callback request is not treated as a human request", () => {
  assert.notEqual(classifySovereignIntent("I don't want a callback, just share room details"), "HUMAN_REQUEST");
  assert.equal(classifySovereignIntent("Please call me back"), "HUMAN_REQUEST");
});

test("normalized entity slots persist across a contextual follow-up", () => {
  const firstDecision = { ...resolveSovereignQuestion("Need 2 rooms on 12/09/2026"), disposition: "CLARIFY" as const };
  const first = governResolutionOutcome({ question: "Need 2 rooms on 12/09/2026", answer: "Which destination?", decision: firstDecision });
  assert.equal(first.state.collectedFacts.date.value, "2026-09-12");
  assert.equal(first.state.collectedFacts.quantity.value, "2 rooms");
  const secondDecision = resolveSovereignQuestion("same dates as before", ["Need 2 rooms on 12/09/2026"]);
  const second = governResolutionOutcome({ question: "same dates as before", answer: "I retained those dates.", decision: secondDecision, previousState: first.state });
  assert.equal(second.state.collectedFacts.date.value, "2026-09-12");
});

test("entity golden set covers more than 100 real-world format examples", () => {
  const phones = Array.from({ length: 50 }, (_, i) => `9${String(100000000 + i).padStart(9, "0")}`);
  const dates = Array.from({ length: 31 }, (_, i) => `${String(i + 1).padStart(2, "0")}/12/2026`);
  const quantities = Array.from({ length: 25 }, (_, i) => `${i + 1} guests`);
  const currencies = Array.from({ length: 20 }, (_, i) => `INR ${1000 + i * 100}`);
  const cases = [...phones.map((value) => [value, "PHONE"]), ...dates.map((value) => [value, "DATE"]), ...quantities.map((value) => [value, "QUANTITY"]), ...currencies.map((value) => [value, "CURRENCY"])] as const;
  assert.ok(cases.length >= 100);
  for (const [input, kind] of cases) assert.ok(extractCoreEntities(input).some((entity) => entity.kind === kind), `${kind}: ${input}`);
});
