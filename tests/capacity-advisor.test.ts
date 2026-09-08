import test from "node:test";
import assert from "node:assert/strict";
import { evaluateCapacity, type CapacitySignals } from "../lib/capacity-advisor";
const base: CapacitySignals = { botPercent: 20, replyPercent: 15, memoryPercent: 40, diskPercent: 62, p95LatencyMs: 2500, errorPercent: 0.5, queueDepth: 0, oldestJobMinutes: null };
test("capacity remains green with headroom", () => assert.equal(evaluateCapacity(base).tone, "GREEN"));
test("capacity becomes amber at eighty percent of target", () => assert.equal(evaluateCapacity({ ...base, replyPercent: 80 }).tone, "AMBER"));
test("capacity becomes red at target exhaustion", () => assert.equal(evaluateCapacity({ ...base, botPercent: 100 }).tone, "RED"));
test("provider latency advises diagnosis rather than blind VPS purchase", () => assert.match(evaluateCapacity({ ...base, p95LatencyMs: 9000 }).actions.join(" "), /provider latency/i));
