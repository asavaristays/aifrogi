import test from "node:test";
import assert from "node:assert/strict";
import { summarizeHotelShadow } from "../../lib/typesafe-hotel-matrix";

test("hotel matrix distinguishes policy expiry, answer quality and provider health without client cost", () => {
  const now = new Date("2026-09-23T00:00:00.000Z");
  const policy = { enabled: true, expiresAt: "2026-09-23T23:00:00.000Z", dailyLimit: 20 };
  const result = summarizeHotelShadow(policy, 3, [
    { createdAt: now, metadata: { status: "OBSERVED", fit: { choice: "ADDRESSED" }, grounding: { choice: "SUPPORTED" }, reviewReasons: [] } },
    { createdAt: now, metadata: { status: "UNAVAILABLE", httpStatus: 429 } }
  ], now);
  assert.equal(result.active, true);
  assert.equal(result.remainingToday, 17);
  assert.equal(result.assessed7d, 1);
  assert.equal(result.addressed7d, 1);
  assert.equal(result.supported7d, 1);
  assert.equal(result.unavailable7d, 1);
  assert.equal(result.latestHttpStatus, null);
  assert.equal(summarizeHotelShadow({ ...policy, expiresAt: now.toISOString() }, 3, [], now).active, false);
  const unlimited = summarizeHotelShadow({ enabled: true, expiresAt: null, dailyLimit: null }, 25, [], now);
  assert.equal(unlimited.active, true);
  assert.equal(unlimited.remainingToday, null);
});
