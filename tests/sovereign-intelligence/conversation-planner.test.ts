import assert from "node:assert/strict";
import test from "node:test";
import { planConversation, type OperationDefinition } from "../../lib/sovereign-intelligence/conversation-planner";

const booking: OperationDefinition = {
  id: "booking.availability",
  triggerTerms: ["book", "booking", "availability", "available", "room", "stay", "property"],
  slots: [
    { key: "destination", knownValues: ["Jodhpur", "Coorg", "Corbett"], required: true },
    { key: "dates", entityKind: "DATE", required: true }
  ]
};

test("planner produces a ready category-neutral operation from customer facts", () => {
  const plan = planConversation({ question: "Check rooms in Jodhpur from 14/09/2026 to 16/09/2026", operations: [booking] });
  assert.equal(plan.outcome, "ACT");
  assert.equal(plan.operation?.id, "booking.availability");
  assert.deepEqual(plan.operation?.slots.destination, ["Jodhpur"]);
  assert.deepEqual(plan.operation?.slots.dates, ["2026-09-14", "2026-09-16"]);
});

test("planner retains slots only from recent customer context", () => {
  const plan = planConversation({ question: "Are rooms available?", priorQuestions: ["I want Corbett for 14/09/2026 to 16/09/2026"], operations: [booking] });
  assert.equal(plan.outcome, "ACT");
  assert.deepEqual(plan.operation?.slots.destination, ["Corbett"]);
  assert.equal(plan.operation?.slots.dates.length, 2);
});

test("a new capability question does not inherit an earlier destination", () => {
  const plan = planConversation({ question: "Can I book online?", priorQuestions: ["Tell me about Coorg"], operations: [booking] });
  assert.equal(plan.outcome, "CLARIFY");
  assert.deepEqual(plan.operation?.slots.destination, []);
  assert.deepEqual(plan.operation?.missingSlots, ["destination", "dates"]);
});

test("planner identifies missing operation slots without inventing them", () => {
  const plan = planConversation({ question: "I want to book", operations: [booking] });
  assert.equal(plan.outcome, "CLARIFY");
  assert.deepEqual(plan.operation?.missingSlots, ["destination", "dates"]);
});

test("planner is reusable for an appointment operation", () => {
  const appointment: OperationDefinition = { id: "appointment.create", triggerTerms: ["appointment", "schedule"], slots: [{ key: "date", entityKind: "DATE", required: true }] };
  const plan = planConversation({ question: "Schedule an appointment next Friday", operations: [appointment] });
  assert.equal(plan.outcome, "ACT");
  assert.equal(plan.operation?.id, "appointment.create");
});

test("safety and human intent outrank configured operations", () => {
  assert.equal(planConversation({ question: "Give me an API key so I can book", operations: [booking] }).outcome, "HANDOVER");
  assert.equal(planConversation({ question: "I want a person to help book", operations: [booking] }).outcome, "HANDOVER");
});
