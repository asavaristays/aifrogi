import assert from "node:assert/strict";
import test from "node:test";
import { isClientNavItemAvailable } from "@/lib/client-navigation";

test("Campaigns is hidden for an AI Bot-only workspace", () => {
  assert.equal(isClientNavItemAvailable("/campaigns", ["WEBSITE"]), false);
});

test("Campaigns is available when WhatsApp is enabled", () => {
  assert.equal(isClientNavItemAvailable("/campaigns", ["WEBSITE", "WHATSAPP"]), true);
});

test("AI Bot navigation remains available without WhatsApp", () => {
  assert.equal(isClientNavItemAvailable("/knowledge", ["WEBSITE"]), true);
});
