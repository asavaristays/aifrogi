import assert from "node:assert/strict";
import test from "node:test";
import { newTenantFlow, normalizeTenantFlow, TENANT_FLOW_TEMPLATES, validateTenantFlow } from "../../lib/tenant-flow-intelligence";

test("every governed flow template answers before offering human or callback help", () => {
  assert.equal(TENANT_FLOW_TEMPLATES.length, 4);
  for (const template of TENANT_FLOW_TEMPLATES) {
    const flow = newTenantFlow(template.key);
    assert.deepEqual(flow.steps.map(step => step.type), ["MENU_TRIGGER", "TENANT_ANSWER", "CONDITION", "END", "HUMAN_HANDOVER", "CAPTURE_CONTACT"]);
    assert.equal(flow.fallbackMode, "HUMAN_OR_CALLBACK");
    assert.equal(flow.status, "DRAFT");
  }
});

test("clients can define connected nodes while invalid branches block publishing", () => {
  const flow = newTenantFlow("SUPPORT_HANDOVER");
  assert.deepEqual(validateTenantFlow(flow), []);
  assert.ok(flow.steps.every(node => typeof node.x === "number" && typeof node.y === "number"));
  const condition = flow.steps.find(node => node.type === "CONDITION")!;
  assert.match(validateTenantFlow({ ...flow, steps: flow.steps.map(node => node.id === condition.id ? { ...node, alternateNextId: undefined } : node) })[0], /both Yes and No/);
});

test("tenant flows reject incomplete menu triggers", () => {
  const flow = newTenantFlow("SERVICE_ADVISOR");
  assert.equal(normalizeTenantFlow({ ...flow, menuLabel: "" }), null);
  assert.equal(normalizeTenantFlow({ ...flow, openingQuestion: "short" }), null);
  assert.equal(normalizeTenantFlow(flow)?.id, flow.id);
});
