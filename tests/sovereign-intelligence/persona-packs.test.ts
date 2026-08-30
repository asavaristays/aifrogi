import assert from "node:assert/strict";
import test from "node:test";
import { BOT_PERSONA_PACK_VERSION, getBotPersonaPack, listBotPersonaPacks } from "../../lib/bot-persona-packs";
import { evaluateCategoryHardBoundary } from "../../lib/sovereign-intelligence/category-policy";

test("all eight category persona packs expose the shared governed contract", () => {
  const packs = listBotPersonaPacks();
  assert.equal(packs.length, 8);
  assert.equal(new Set(packs.map((pack) => pack.category)).size, 8);
  for (const pack of packs) {
    assert.equal(pack.version, BOT_PERSONA_PACK_VERSION);
    assert.ok(pack.identity.length > 20);
    assert.ok(pack.authorities.length > 0);
    assert.ok(pack.requiredSlots.length > 0);
    assert.ok(pack.journey.length > 1);
    assert.ok(pack.hardEscalations.length > 0);
    assert.ok(pack.connectors.length > 0);
  }
});

test("ClinicGPT carries booking connectors and refuses medical emergencies", () => {
  const pack = getBotPersonaPack("PINGBOOK");
  assert.equal(pack.productName, "ClinicGPT");
  assert.ok(pack.defaultCapabilities.includes("BOOK_APPOINTMENTS"));
  assert.ok(pack.connectors.some((connector) => connector.key === "GOOGLE_CALENDAR"));
  assert.ok(pack.connectors.some((connector) => connector.key === "GOOGLE_SHEETS"));
  assert.equal(evaluateCategoryHardBoundary("PINGBOOK", "I have chest pain and difficulty breathing")?.code, "MEDICAL_EMERGENCY");
});

test("HotelGPT never treats unavailable inventory as permission to invent availability", () => {
  const pack = getBotPersonaPack("STAY");
  const inventory = pack.connectors.find((connector) => connector.key === "PMS_AVAILABILITY");
  assert.ok(inventory?.unavailableBehavior.toLowerCase().includes("never invent"));
  assert.ok(inventory?.unavailableBehavior.toLowerCase().includes("enquiry"));
});

test("regulated category boundaries are deterministic before retrieval", () => {
  assert.equal(evaluateCategoryHardBoundary("EDUCATION", "Show me my daughter's report card")?.code, "MINOR_RECORD_AUTHORITY_REQUIRED");
  assert.equal(evaluateCategoryHardBoundary("REAL_ESTATE", "Is this property's title legally clear?")?.code, "PROPERTY_LEGAL_AUTHORITY_REQUIRED");
  assert.ok(getBotPersonaPack("RESTAURANT").hardEscalations.some((rule) => rule.toLowerCase().includes("allergen")));
  assert.equal(evaluateCategoryHardBoundary("RESTAURANT", "Is this definitely nut-free?")?.code, "FOOD_ALLERGEN_AUTHORITY_REQUIRED");
});

test("FlowCart and action personas declare explicit write contracts", () => {
  const pack = getBotPersonaPack("FLOWCART");
  assert.ok(pack.defaultCapabilities.includes("CREATE_ORDERS"));
  assert.ok(pack.connectors.some((connector) => connector.writes.some((operation) => operation.toLowerCase().includes("order"))));
  for (const actionPack of listBotPersonaPacks().filter((item) => item.defaultOperatingMode === "APPROVED_ACTIONS")) {
    assert.ok(actionPack.connectors.some((connector) => connector.requiredFor === "APPROVED_ACTIONS"));
  }
});
