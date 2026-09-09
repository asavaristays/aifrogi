import assert from "node:assert/strict";
import test from "node:test";
import { newTenantFlow, normalizeTenantFlow, TENANT_FLOW_TEMPLATES } from "../../lib/tenant-flow-intelligence";

test("every governed flow template answers before offering human or callback help", () => {
  assert.equal(TENANT_FLOW_TEMPLATES.length, 4);
  for (const template of TENANT_FLOW_TEMPLATES) {
    const flow = newTenantFlow(template.key);
    assert.deepEqual(flow.steps.map(step => step.type), ["MENU_TRIGGER", "TENANT_ANSWER", "HUMAN_HANDOVER", "CONSENTED_CALLBACK"]);
    assert.equal(flow.fallbackMode, "HUMAN_OR_CALLBACK");
    assert.equal(flow.status, "DRAFT");
  }
});

test("tenant flows reject incomplete menu triggers", () => {
  const flow = newTenantFlow("SERVICE_ADVISOR");
  assert.equal(normalizeTenantFlow({ ...flow, menuLabel: "" }), null);
  assert.equal(normalizeTenantFlow({ ...flow, openingQuestion: "short" }), null);
  assert.equal(normalizeTenantFlow(flow)?.id, flow.id);
});
