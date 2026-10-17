import assert from "node:assert/strict";
import test from "node:test";
import { canOpenClientWorkspace } from "@/lib/workspace-access";

test("website client can open Knowledge while preparing intelligence", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_APPROVED" }, botProfile: { channels: ["WEBSITE"], status: "INSTALLATION_READY" } }), false);
});

test("unfinished draft remains in onboarding", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_SUBMITTED" }, botProfile: { channels: ["WEBSITE"], status: "DRAFT" } }), false);
});

test("configured website persona can enter intelligence preparation", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "KYC_SUBMITTED" }, botProfile: { channels: ["WEBSITE"], status: "CONFIGURED" } }), false);
});

test("live WhatsApp client can open its workspace", () => {
  assert.equal(canOpenClientWorkspace({ onboarding: { lifecycleStatus: "LIVE" }, botProfile: { channels: ["WHATSAPP"], status: "DRAFT" } }), true);
});


const pendingWebsite = { status: "ONBOARDING", onboarding: { lifecycleStatus: "DRAFT" }, botProfile: { channels: ["WEBSITE"], status: "REVIEW_PENDING" } };

test("active owner and workspace admin can prepare privately while review is pending", () => {
  for (const role of ["OWNER", "ADMIN"]) assert.equal(canOpenClientWorkspace(pendingWebsite, { role, status: "ACTIVE" }), true);
});

test("pending-review private access does not grant read-only, agent or unverified membership access", () => {
  for (const role of ["AGENT", "VIEWER", "", null]) assert.equal(canOpenClientWorkspace(pendingWebsite, { role, status: "ACTIVE" }), false);
  for (const status of ["INVITED", "SUSPENDED", "", null]) assert.equal(canOpenClientWorkspace(pendingWebsite, { role: "OWNER", status }), false);
  assert.equal(canOpenClientWorkspace(pendingWebsite), false);
  assert.equal(canOpenClientWorkspace(pendingWebsite, null), false);
});

test("pending-review admission rejects removed, suspended, pending-email and absent organizations", () => {
  for (const status of ["REMOVED", "SUSPENDED", "PENDING_EMAIL", "DRAFT", undefined]) {
    assert.equal(canOpenClientWorkspace({ ...pendingWebsite, status }, { role: "OWNER", status: "ACTIVE" }), false);
  }
  assert.equal(canOpenClientWorkspace(null, { role: "OWNER", status: "ACTIVE" }), false);
  assert.equal(canOpenClientWorkspace(undefined, { role: "OWNER", status: "ACTIVE" }), false);
});

test("private review admission requires a submitted website bot", () => {
  for (const status of ["DRAFT", "INSTALLATION_READY", "CONFIGURED", "DELETED", undefined]) {
    assert.equal(canOpenClientWorkspace({ ...pendingWebsite, botProfile: { channels: ["WEBSITE"], status } }, { role: "OWNER", status: "ACTIVE" }), false);
  }
  assert.equal(canOpenClientWorkspace({ ...pendingWebsite, botProfile: { channels: [], status: "REVIEW_PENDING" } }, { role: "OWNER", status: "ACTIVE" }), false);
});

test("private dashboard admission leaves the bot offline and approval state unchanged", async () => {
  const { canServeWebsiteBot } = await import("@/lib/website-bot-lifecycle");
  const before = structuredClone(pendingWebsite);
  assert.equal(canOpenClientWorkspace(pendingWebsite, { role: "OWNER", status: "ACTIVE" }), true);
  assert.equal(canServeWebsiteBot(pendingWebsite.botProfile.status, pendingWebsite.botProfile.channels), false);
  assert.deepEqual(pendingWebsite, before);
});

test("existing live and paused website workspace access is preserved", () => {
  for (const status of ["LIVE", "PAUSED"]) assert.equal(canOpenClientWorkspace({ botProfile: { channels: ["WEBSITE"], status } }), true);
});
