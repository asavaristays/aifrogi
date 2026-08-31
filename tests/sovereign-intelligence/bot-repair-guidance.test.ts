import assert from "node:assert/strict";
import test from "node:test";
import { BOT_REPAIR_GUIDANCE_VERSION, BOT_REPAIR_LAYERS, classifyBotRepair } from "@/lib/bot-repair-guidance";

test("universal repair guidance keeps knowledge, intelligence and connector ownership separate", () => {
  assert.equal(BOT_REPAIR_GUIDANCE_VERSION, "1.0");
  assert.equal(BOT_REPAIR_LAYERS.length, 3);
  assert.equal(classifyBotRepair({ failureLayer: "KNOWLEDGE" }).key, "TENANT_KNOWLEDGE");
  assert.equal(classifyBotRepair({ failureLayer: "CONVERSATION_STATE" }).key, "SHARED_INTELLIGENCE");
  assert.equal(classifyBotRepair({ failureLayer: "CONNECTOR" }).key, "CONNECTOR_RUNTIME");
  assert.ok(BOT_REPAIR_LAYERS[0].action.includes("Preview Approval"));
  assert.ok(BOT_REPAIR_LAYERS[2].action.includes("idempotency"));
});
