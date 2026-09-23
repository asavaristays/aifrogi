import assert from "node:assert/strict";
import test from "node:test";
import { runHotelGptRegression } from "../../lib/sovereign-intelligence/hotelgpt-regression";

test("HotelGPT-first regression bank contains 40 Core and 20 hotel cases", () => {
  const results = runHotelGptRegression();
  assert.equal(results.length, 60);
  assert.equal(results.filter((item) => item.group === "CORE").length, 40);
  assert.equal(results.filter((item) => item.group === "HOTELGPT").length, 20);
  assert.equal(new Set(results.map((item) => item.id)).size, 60);
});

test("all HotelGPT-first cases pass with inspectable expected and actual evidence", () => {
  const results = runHotelGptRegression();
  const failures = results.filter((item) => !item.passed);
  assert.deepEqual(failures, [], JSON.stringify(failures, null, 2));
  assert.ok(results.every((item) => item.input && item.expected && item.actual));
});
