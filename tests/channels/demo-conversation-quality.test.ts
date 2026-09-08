import assert from "node:assert/strict";
import test from "node:test";
import { resolveDemoCommonAnswer } from "../../lib/demo-sandbox/service";
import { readFileSync } from "node:fs";

test("demo connector clarification is customer-facing and contains no test instructions", () => {
  const service = readFileSync("lib/demo-sandbox/service.ts", "utf8");
  assert.doesNotMatch(service, /Before I use the demo connector/);
  assert.doesNotMatch(service, /Use fictional details only/);
});

test("core vertical offering questions have immediate answers", () => {
  assert.match(resolveDemoCommonAnswer("STAY", "What services do you offer?") || "", /Rooms|Suites/i);
  assert.match(resolveDemoCommonAnswer("EDUCATION", "What services do you offer?") || "", /Data Foundations/);
  assert.match(resolveDemoCommonAnswer("FLOWCART", "What services do you offer?") || "", /cakes/);
  assert.match(resolveDemoCommonAnswer("EDUCATION", "What documents are generally needed?") || "", /identity proof/i);
});

test("out-of-scope training questions receive a friendly vertical redirect", () => {
  assert.match(resolveDemoCommonAnswer("PINGBOOK", "I am interested in training") || "", /not a clinic service/i);
  assert.match(resolveDemoCommonAnswer("BUSINESS_AI", "Do you provide AI bot training?") || "", /do not offer standalone training/i);
});

test("human requests receive a direct team response rather than a knowledge-gap fallback", () => {
  const route = readFileSync("app/api/public/website-bot/[slug]/route.ts", "utf8");
  assert.match(route, /Of course\. I’ve alerted/);
  assert.doesNotMatch(route, /Contact details are optional for in-chat help/);
  assert.match(route, /Low-intent exploration acknowledged/);
  assert.match(route, /Explicit commercial request routed to consented callback capture/);
});

test("the production regression rubric detects the failures found by human review", () => {
  const runner = readFileSync("scripts/run-bot-family-regression.mjs", "utf8");
  assert.match(runner, /INTERNAL_DEMO_LANGUAGE/);
  assert.match(runner, /WRONG_HANDOFF_FALLBACK/);
  assert.match(runner, /WEAK_HUMAN_HANDOFF/);
});
