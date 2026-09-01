import assert from "node:assert/strict";
import test from "node:test";
import { canOpenClientWorkspace } from "@/lib/workspace-access";

test("website client can open Knowledge while preparing intelligence", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_APPROVED" }, botProfile: { channels: ["WEBSITE"], status: "INSTALLATION_READY" } }), true);
});

test("unfinished draft remains in onboarding", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_SUBMITTED" }, botProfile: { channels: ["WEBSITE"], status: "DRAFT" } }), false);
});

test("configured website persona can enter intelligence preparation", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_SUBMITTED" }, botProfile: { channels: ["WEBSITE"], status: "CONFIGURED" } }), true);
});

test("live WhatsApp client can open its workspace", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "LIVE" }, botProfile: { channels: ["WHATSAPP"], status: "DRAFT" } }), true);
});
