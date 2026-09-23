import test from "node:test";
import assert from "node:assert/strict";
import { summarizeHotelShadow } from "../../lib/typesafe-hotel-matrix";

test("hotel matrix distinguishes policy renewal, attempts, observations and estimated usage", () => {
  const now = new Date("2026-09-23T00:00:00.000Z");
  const policy = { enabled: true, expiresAt: "2026-09-23T23:00:00.000Z", dailyLimit: 20 };
  const result = summarizeHotelShadow(policy, 3, [
    { createdAt: now, metadata: { status: "OBSERVED", inputTokens: 100, outputTokens: 10 } },
    { createdAt: now, metadata: { status: "UNAVAILABLE", inputTokens: 0, outputTokens: 0 } }
  ], now);
  assert.equal(result.active, true);
  assert.equal(result.remainingToday, 17);
  assert.equal(result.observations7d, 2);
  assert.equal(result.unavailable7d, 1);
  assert.equal(result.inputTokens7d, 100);
  assert.ok(Math.abs(result.estimatedUsd7d - 0.0000042) < 1e-12);
  assert.equal(summarizeHotelShadow({ ...policy, expiresAt: now.toISOString() }, 3, [], now).active, false);
});
