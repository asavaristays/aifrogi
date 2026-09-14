import assert from "node:assert/strict";
import test from "node:test";
import { INTELLIGENCE_ROUTER_VERSION, resolveIntelligenceLayer } from "../../lib/sovereign-intelligence/layer-router";

test("intelligence routing has one versioned deterministic precedence", () => {
  assert.equal(INTELLIGENCE_ROUTER_VERSION, "1.0");
  assert.equal(resolveIntelligenceLayer({ safetyBlocked: true, humanRequested: true, flowMatched: true }), "CORE_SAFETY");
  assert.equal(resolveIntelligenceLayer({ humanRequested: true, flowMatched: true, connectorMatched: true }), "HUMAN_CONTROL");
  assert.equal(resolveIntelligenceLayer({ flowMatched: true, connectorMatched: true, tenantGrounded: true }), "FLOW_INTELLIGENCE");
  assert.equal(resolveIntelligenceLayer({ connectorMatched: true, tenantGrounded: true }), "CONNECTOR_INTELLIGENCE");
  assert.equal(resolveIntelligenceLayer({ tenantGrounded: true, coreAnswered: true }), "TENANT_INTELLIGENCE");
  assert.equal(resolveIntelligenceLayer({ coreAnswered: true }), "CORE_INTELLIGENCE");
  assert.equal(resolveIntelligenceLayer({}), "HUMAN_FALLBACK");
});
