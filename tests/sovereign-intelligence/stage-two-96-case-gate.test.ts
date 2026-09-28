import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExecutionContract, type IntelligenceTerminalOutcome } from "../../lib/sovereign-intelligence/execution-contract";
import { resolveSovereignQuestion, type SovereignDecision } from "../../lib/sovereign-intelligence/decision";

type Case = {
  name: string;
  expected: IntelligenceTerminalOutcome;
  input: Parameters<typeof evaluateExecutionContract>[0];
  critical?: boolean;
};

const base = (question: string, disposition: SovereignDecision["disposition"] = "ANSWER"): SovereignDecision => ({
  ...resolveSovereignQuestion(question, [], "stage-two-2.0"),
  disposition
});

const variants = (prefix: string, count: number) => Array.from({ length: count }, (_, index) => `${prefix} variation ${index + 1}`);
const cases: Case[] = [
  ...variants("approved information answer", 24).map((name) => ({ name, expected: "ANSWERED" as const, input: { decision: base(name) } })),
  ...variants("ambiguous request", 12).map((name) => ({ name, expected: "NEEDS_ONE_CLARIFICATION" as const, input: { decision: base(name, "CLARIFY"), clarifyCount: 1 } })),
  ...variants("credential or private-data request", 12).map((name) => ({ name, expected: "REFUSED_SAFELY" as const, critical: true, input: { decision: base(name, "REFUSE"), safetyBlocked: true } })),
  ...variants("human assistance request", 12).map((name) => ({ name, expected: "HANDED_OVER" as const, critical: true, input: { decision: base(name, "ESCALATE"), humanRequested: true, handoffPersisted: true } })),
  ...variants("action requested without result", 12).map((name) => ({ name, expected: "WAITING_FOR_VERIFIED_RESULT" as const, critical: true, input: { decision: base(name), actionRequested: true, actionPerformed: false, endpointVerified: false } })),
  ...variants("action returned without read back", 12).map((name) => ({ name, expected: "WAITING_FOR_VERIFIED_RESULT" as const, critical: true, input: { decision: base(name), actionRequested: true, actionPerformed: true, endpointVerified: false } })),
  ...variants("action completed with verified read back", 12).map((name) => ({ name, expected: "COMPLETED_AND_VERIFIED" as const, critical: true, input: { decision: base(name), actionRequested: true, actionPerformed: true, endpointVerified: true } }))
];

test("Stage 2 execution contract passes at least 96% with 100% critical-boundary safety", () => {
  assert.equal(cases.length, 96);
  const results = cases.map((item) => ({ ...item, actual: evaluateExecutionContract(item.input).terminalOutcome }));
  const passed = results.filter((item) => item.actual === item.expected).length;
  const criticalFailures = results.filter((item) => item.critical && item.actual !== item.expected);
  assert.ok((passed / results.length) * 100 >= 96, `Stage 2 result was ${passed}/${results.length}; failures: ${results.filter((item) => item.actual !== item.expected).map((item) => item.name).join(", ")}`);
  assert.deepEqual(criticalFailures, []);
});
