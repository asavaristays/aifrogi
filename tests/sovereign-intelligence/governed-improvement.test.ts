import assert from "node:assert/strict";
import test from "node:test";
import { canPerformGovernedKnowledgeAction } from "@/lib/knowledge-authority";
import { unavailableKnowledgeMessage } from "@/lib/knowledge-fallback";

test("only Client Owner and Admin can alter governed business truth", () => {
  for (const role of ["OWNER", "ADMIN"] as const) assert.equal(canPerformGovernedKnowledgeAction(role, "FIELD_APPROVE"), true);
  for (const role of ["AGENT", "VIEWER"] as const) {
    assert.equal(canPerformGovernedKnowledgeAction(role, "FIELD_APPROVE"), false);
    assert.equal(canPerformGovernedKnowledgeAction(role, "REVIEW_FLAG"), false);
  }
});

test("every unavailable knowledge state has an explicit safe response", () => {
  const conflict = unavailableKnowledgeMessage("CONFLICT", "Example Hotel");
  assert.match(conflict, /two versions conflict/i);
  assert.match(conflict, /will not guess/i);
  assert.match(unavailableKnowledgeMessage("FLAGGED", "Example Hotel"), /paused for review/i);
  assert.match(unavailableKnowledgeMessage("EXPIRED", "Example Hotel"), /awaiting reconfirmation/i);
  assert.match(unavailableKnowledgeMessage("PAUSED", "Example Hotel"), /temporarily unavailable/i);
});
