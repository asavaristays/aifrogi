import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("website knowledge retains an approved snapshot when a refresh fails", async () => {
  const source = await readFile(new URL("../../lib/services/website-knowledge-service.ts", import.meta.url), "utf8");
  assert.match(source, /if \(previous\?\.baseUrl === baseUrl && previous\.pages\?\.length\) return previous/);
  assert.match(source, /status: "ERROR"/);
});
