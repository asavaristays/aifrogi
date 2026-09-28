import test from "node:test";
import assert from "node:assert/strict";
import { answerClaimsUnverifiedCompletion, enforceExecutionResponse, evaluateExecutionContract, flowContainsUnboundedCycle, matchPublishedFlow, validateFlowEndpointContracts } from "../../lib/sovereign-intelligence/execution-contract";
import { newTenantFlow } from "../../lib/tenant-flow-intelligence";
import { resolveSovereignQuestion } from "../../lib/sovereign-intelligence/decision";

const decision = (question: string) => resolveSovereignQuestion(question, [], "test");

test("material action waits for verified result and cannot claim completion", () => {
  const contract = evaluateExecutionContract({ decision: decision("Please book it"), actionRequested: true, actionPerformed: true, endpointVerified: false });
  assert.equal(contract.terminalOutcome, "WAITING_FOR_VERIFIED_RESULT");
  assert.equal(contract.completionClaimAllowed, false);
  assert.match(enforceExecutionResponse(contract, "Your booking is confirmed."), /not confirmed or completed/i);
});

test("verified endpoint result permits a completion outcome", () => {
  const contract = evaluateExecutionContract({ decision: decision("Please book it"), actionRequested: true, actionPerformed: true, endpointVerified: true });
  assert.equal(contract.terminalOutcome, "COMPLETED_AND_VERIFIED");
  assert.equal(contract.completionClaimAllowed, true);
});

test("human ownership is acknowledged only after persistence", () => {
  const requested = evaluateExecutionContract({ decision: decision("I want a person"), humanRequested: true, handoffPersisted: false });
  const persisted = evaluateExecutionContract({ decision: decision("I want a person"), humanRequested: true, handoffPersisted: true });
  assert.equal(requested.terminalOutcome, "WAITING_FOR_STAFF");
  assert.equal(persisted.terminalOutcome, "HANDED_OVER");
});

test("clarification is bounded and exits instead of looping", () => {
  const ambiguous = { ...decision("yes"), disposition: "CLARIFY" as const };
  assert.equal(evaluateExecutionContract({ decision: ambiguous, clarifyCount: 1 }).terminalOutcome, "NEEDS_ONE_CLARIFICATION");
  assert.equal(evaluateExecutionContract({ decision: ambiguous, clarifyCount: 2 }).terminalOutcome, "WAITING_FOR_STAFF");
});

test("published flows match intent and every node has an endpoint contract", () => {
  const flow = { ...newTenantFlow("SERVICE_ADVISOR"), status: "PUBLISHED" as const };
  assert.equal(matchPublishedFlow([flow], "Please help me explore your services")?.id, flow.id);
  assert.deepEqual(validateFlowEndpointContracts(flow), []);
});

test("unbounded cycles are detected", () => {
  const flow = newTenantFlow("SERVICE_ADVISOR");
  flow.steps[flow.steps.length - 1].nextId = flow.steps[0].id;
  assert.equal(flowContainsUnboundedCycle(flow), true);
});

test("completion language detector covers material business outcomes", () => {
  assert.equal(answerClaimsUnverifiedCompletion("Your payment was successful."), true);
  assert.equal(answerClaimsUnverifiedCompletion("I can explain the payment options."), false);
});
