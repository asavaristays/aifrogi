import assert from "node:assert/strict";
import test from "node:test";
import { estimatedUsageCostPaisa } from "../../lib/tenant-usage-metering";

test("usage metering calculates tenant cost from configured token rates", () => {
  assert.equal(estimatedUsageCostPaisa({ inputTokens: 500_000, outputTokens: 250_000, model: "test", attempts: 1, latencyMs: 10 }, { inputPaisaPerMillion: 100, outputPaisaPerMillion: 400 }), 150);
});

test("usage metering never invents an unconfigured price", () => {
  assert.equal(estimatedUsageCostPaisa({ inputTokens: 1000, outputTokens: 1000, model: "test", attempts: 1, latencyMs: 10 }, { inputPaisaPerMillion: 0, outputPaisaPerMillion: 0 }), 0);
});
