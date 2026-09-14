import assert from "node:assert/strict";
import test from "node:test";
import { buildSessionConversationMemory, routeConversationByConfidence } from "../../lib/sovereign-intelligence/conversation-confidence";
import { extractDeepTenantKnowledge } from "../../lib/tenant-intelligence/deep-crawl";

const rohet = extractDeepTenantKnowledge("https://tenant.test/properties/47", "<title>Rohet Garh</title><h1>Rohet Garh</h1><h2>Access</h2><p>Airport: Jodhpur 35 Kms.</p>", "2026-09-14T00:00:00.000Z");

test("session memory carries the selected tenant entity into a natural follow-up", () => {
  assert.ok(rohet);
  const memory = buildSessionConversationMemory({ question: "what amenities does it have?", priorQuestions: ["Tell me about Rohet Garh"], entities: [rohet] });
  assert.equal(memory.entity?.name, "Rohet Garh");
  assert.equal(memory.contextUsed, true);
  assert.match(memory.retrievalQuestion, /Selected tenant entity: Rohet Garh/);
});

test("session memory retains normalized dates and quantities without retaining contact by default", () => {
  const memory = buildSessionConversationMemory({ question: "is it available?", priorQuestions: ["Rohet Garh for 2 guests on 18/09/2026", "call me on 9876543210"], entities: rohet ? [rohet] : [] });
  assert.equal(memory.slots.date, "2026-09-18");
  assert.equal(memory.slots.quantity, "2 guests");
  assert.equal(memory.slots.contact, undefined);
});

test("confidence routing clarifies once then hands over instead of looping", () => {
  assert.equal(routeConversationByConfidence({ intent: "UNKNOWN", hasApprovedContext: false }).route, "CLARIFY");
  assert.equal(routeConversationByConfidence({ intent: "UNKNOWN", hasApprovedContext: false, priorQuestions: ["something else"] }).route, "HANDOVER");
});

test("approved context and a resolved entity permit an answer", () => {
  const result = routeConversationByConfidence({ intent: "BUSINESS", hasApprovedContext: true, hasResolvedEntity: true });
  assert.equal(result.route, "ANSWER");
  assert.equal(result.confidence, 0.95);
});
