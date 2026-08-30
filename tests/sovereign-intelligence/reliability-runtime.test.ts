import assert from "node:assert/strict";
import test from "node:test";
import { executeReliableModel, escalationTierFor, modelHttpError, ReliableOperationError } from "../../lib/reliability/runtime";
import { gradeReliabilitySection, RELIABILITY_SECTION_7 } from "../../lib/reliability/grading";
import { CLOSED_CONNECTOR_CIRCUIT, connectorCircuitAfterFailure, connectorCircuitAfterSuccess, connectorCircuitBeforeAttempt, connectorFallbackPolicy } from "../../lib/reliability/connector-circuit";

test("transient model failure retries and self-resolves within the bounded budget", async () => {
  let calls = 0;
  const result = await executeReliableModel({
    models: ["primary"], attemptsPerModel: 2, wait: async () => undefined,
    execute: async () => { calls += 1; if (calls === 1) throw modelHttpError(503); return "approved answer"; },
    validate: (value) => value.length > 0
  });
  assert.equal(result.ok, true);
  assert.equal(calls, 2);
  assert.equal(result.evidence.attemptCount, 2);
  assert.equal(result.evidence.escalationTier, "TIER_0_SELF_RESOLVE");
});

test("fallback model is marked as degraded rather than silently presented as primary", async () => {
  const result = await executeReliableModel({
    models: ["primary", "fallback"], attemptsPerModel: 1, wait: async () => undefined,
    execute: async (model) => { if (model === "primary") throw modelHttpError(429); return "validated fallback"; },
    validate: (value) => value.startsWith("validated")
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.model, "fallback");
  assert.equal(result.evidence.degradedMode, true);
});

test("malformed output is never delivered and becomes an attributable model failure", async () => {
  const result = await executeReliableModel({
    models: ["primary"], attemptsPerModel: 1,
    execute: async () => "",
    validate: (value) => value.trim().length > 0
  });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.error.code, "MODEL_OUTPUT_INVALID");
  assert.equal(result.evidence.failureLayer, "MODEL");
  assert.equal(result.evidence.escalationTier, "TIER_2_AIFROGI_ASYNC");
});

test("non-transient provider rejection is not retried", async () => {
  let calls = 0;
  const result = await executeReliableModel({
    models: ["primary"], attemptsPerModel: 3,
    execute: async () => { calls += 1; throw new ReliableOperationError("Rejected", "MODEL_HTTP_400", "MODEL", false); },
    validate: () => true
  });
  assert.equal(result.ok, false);
  assert.equal(calls, 1);
});

test("escalation ladder routes business and system work without inventing live calls", () => {
  assert.equal(escalationTierFor({ disposition: "ANSWER" }), "TIER_0_SELF_RESOLVE");
  assert.equal(escalationTierFor({ failureLayer: "KNOWLEDGE" }), "TIER_1_BUSINESS_ASYNC");
  assert.equal(escalationTierFor({ failureLayer: "CONNECTOR" }), "TIER_2_AIFROGI_ASYNC");
  assert.equal(escalationTierFor({ humanRequested: true }), "TIER_1_BUSINESS_ASYNC");
});

test("Section 7 withholds certification until every evidence item and blocker passes", () => {
  assert.equal(RELIABILITY_SECTION_7.length, 7);
  assert.equal(gradeReliabilitySection({ "R7-01": true, "R7-02": true, "R7-03": true }).certification, "BLOCKED");
  const complete = Object.fromEntries(RELIABILITY_SECTION_7.map((item) => [item.id, true]));
  assert.equal(gradeReliabilitySection(complete).certification, "ELIGIBLE");
});

test("connector circuit opens, probes half-open, and closes only after success", () => {
  const first = connectorCircuitAfterFailure(CLOSED_CONNECTOR_CIRCUIT, 1_000, 2, 500);
  const opened = connectorCircuitAfterFailure(first, 1_100, 2, 500);
  assert.equal(opened.state, "OPEN");
  assert.equal(connectorCircuitBeforeAttempt(opened, 1_599).state, "OPEN");
  assert.equal(connectorCircuitBeforeAttempt(opened, 1_600).state, "HALF_OPEN");
  assert.deepEqual(connectorCircuitAfterSuccess(), CLOSED_CONNECTOR_CIRCUIT);
});

test("read fallback discloses freshness while write fallback is always prohibited", () => {
  const capturedAt = new Date("2026-08-30T10:00:00.000Z");
  const read = connectorFallbackPolicy("READ", capturedAt);
  assert.equal(read.allowed, true);
  assert.equal(read.requiresFreshnessDisclosure, true);
  assert.match(read.reason, /2026-08-30T10:00:00.000Z/);
  assert.equal(connectorFallbackPolicy("WRITE", capturedAt).allowed, false);
});
