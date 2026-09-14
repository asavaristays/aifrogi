import test from "node:test";
import assert from "node:assert/strict";
import { suggestGoldenBank } from "../../lib/tenant-intelligence/certification-templates";

test("Golden-bank suggestions are tenant-first, unique, and include safe boundaries", () => {
  const cases = suggestGoldenBank("STAY", ["Where is Camp Hornbill?", "Where is Camp Hornbill?", "What is the room rate?"]);
  assert.equal(cases.length, 10);
  assert.equal(new Set(cases.map((item) => item.question.toLowerCase())).size, 10);
  assert.deepEqual(cases.slice(0, 2).map((item) => item.question), ["Where is Camp Hornbill?", "What is the room rate?"]);
  assert.equal(cases.filter((item) => item.expectation === "SAFE_HANDOVER").length, 2);
});
