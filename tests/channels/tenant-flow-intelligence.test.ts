import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAgenticFlowReadiness, inspectTenantFlowJourney, newTenantFlow, normalizeTenantFlow, recommendedFlowTemplateKeys, TENANT_FLOW_TEMPLATES, validateTenantFlow } from "../../lib/tenant-flow-intelligence";
import { activeNegotiationPolicy, evaluateTenantNegotiation, policyForVerifiedStay, tenantRateInquiry } from "../../lib/tenant-negotiation";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("every governed flow template answers before offering human or callback help", () => {
  assert.equal(TENANT_FLOW_TEMPLATES.length, 6);
  for (const template of TENANT_FLOW_TEMPLATES.filter(item => !["CUSTOM_FLOW", "COMMERCIAL_NEGOTIATION"].includes(item.key))) {
    const flow = newTenantFlow(template.key);
    assert.deepEqual(flow.steps.map(step => step.type), ["MENU_TRIGGER", "TENANT_ANSWER", "CONDITION", "END", "HUMAN_HANDOVER", "CAPTURE_CONTACT"]);
    assert.equal(flow.fallbackMode, "HUMAN_OR_CALLBACK");
    assert.equal(flow.status, "DRAFT");
  }
});

test("clients can create a clean custom flow and save it before publication", () => {
  const flow = newTenantFlow("CUSTOM_FLOW");
  assert.equal(flow.status, "DRAFT");
  assert.equal(flow.name, "Custom flow");
  assert.deepEqual(flow.steps.map(node => node.type), ["MENU_TRIGGER", "TENANT_ANSWER", "END"]);
  assert.deepEqual(validateTenantFlow(flow), []);
});

test("journey check follows branches and identifies the next operational action", () => {
  const flow = newTenantFlow("SUPPORT_HANDOVER");
  const check = inspectTenantFlowJourney(flow);
  assert.equal(check.ready, true);
  assert.equal(check.paths.length, 2);
  assert.equal(check.visitedNodeIds.length, flow.steps.length);
  assert.equal(check.nextAction, "Publish and enable");
  flow.status = "PUBLISHED";
  assert.equal(inspectTenantFlowJourney(flow).nextAction, "Monitor live conversations");
});

test("journey check detects an orphan node before a flow is enabled", () => {
  const flow = newTenantFlow("CUSTOM_FLOW");
  flow.steps.push({ id: "orphan", type: "MESSAGE", label: "Disconnected message", x: 20, y: 20 });
  const check = inspectTenantFlowJourney(flow);
  assert.equal(check.ready, false);
  assert.match(check.issues.join(" "), /not connected to a trigger/i);
});

test("AI Bot families receive category-relevant flow recommendations", () => {
  assert.deepEqual(recommendedFlowTemplateKeys("STAY"), ["BOOKING_REQUEST", "PRICING_ENQUIRY", "COMMERCIAL_NEGOTIATION", "SUPPORT_HANDOVER"]);
  assert.deepEqual(recommendedFlowTemplateKeys("BUSINESS_AI"), ["SERVICE_ADVISOR", "PRICING_ENQUIRY", "SUPPORT_HANDOVER"]);
});

test("agentic readiness requires a connector and recovery for transactional flows", () => {
  const flow = newTenantFlow("COMMERCIAL_NEGOTIATION");
  flow.status = "PUBLISHED";
  const blocked = evaluateAgenticFlowReadiness({ flows: [flow], category: "STAY", connectorEnabled: false });
  assert.equal(blocked.stage, "GOVERN");
  assert.match(blocked.issues.join(" "), /connect and verify/i);
  const ready = evaluateAgenticFlowReadiness({ flows: [flow], category: "STAY", connectorEnabled: true });
  assert.equal(ready.stage, "AGENTIC_READY");
});

test("commercial negotiation template requires a valid private tenant boundary", () => {
  const flow = newTenantFlow("COMMERCIAL_NEGOTIATION");
  assert.match(validateTenantFlow(flow).join(" "), /property/i);
  flow.negotiationPolicy = { ...flow.negotiationPolicy!, enabled: true, propertyName: "Jawai Dam Stay", publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED", adjustmentValue: 250, maxRounds: 2, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR", currency: "INR" };
  assert.deepEqual(validateTenantFlow(flow), []);
  flow.status = "PUBLISHED";
  assert.equal(activeNegotiationPolicy([flow], "best rate for Jawai Dam Stay")?.floorRate, 6000);
});

test("Jawai negotiation uses progressive 250, 350 and 500 discounts without disclosing its floor", () => {
  const policy = { enabled: true, propertyName: "Jawai Dam Stay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, discountSteps: [250, 350, 500], maxRounds: 3, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const first = evaluateTenantNegotiation({ policy, message: "Can I get a better deal for Jawai Dam Stay?", priorCustomerMessages: [], lastAssistantAnswer: "Live availability is confirmed. Jawai Dam Stay is available from INR 6,500." });
  assert.equal(first.kind, "COUNTER");
  if (first.kind === "COUNTER") { assert.equal(first.offeredRate, 6250); assert.doesNotMatch(first.message, /floor|threshold/i); }
  const second = evaluateTenantNegotiation({ policy, message: "Can you reduce Jawai Dam Stay further?", priorCustomerMessages: ["Can I get a better deal for Jawai Dam Stay?"], lastAssistantAnswer: "Live availability is confirmed. Jawai Dam Stay is available from INR 6,500." });
  assert.equal(second.kind, "COUNTER");
  if (second.kind === "COUNTER") assert.equal(second.offeredRate, 6150);
  const third = evaluateTenantNegotiation({ policy, message: "Any final reduction for Jawai Dam Stay?", priorCustomerMessages: ["Can I get a better deal for Jawai Dam Stay?", "Can you reduce Jawai Dam Stay further?"], lastAssistantAnswer: "I can offer Jawai Dam Stay at ₹6,150 per night, subject to availability remaining unchanged." });
  assert.equal(third.kind, "COUNTER");
  if (third.kind === "COUNTER") assert.equal(third.offeredRate, 6000);
});

test("tenant authority derives 4, 7 and 10 percent offers for any connector-verified stay", () => {
  const authority = { enabled: true, propertyName: "Jawai Dam Stay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, maxRounds: 3, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const policy = policyForVerifiedStay(authority, "Camp Hornbill", 6000)!;
  assert.equal(policy.propertyName, "Camp Hornbill");
  assert.equal(policy.floorRate, 5400);
  assert.deepEqual(policy.discountSteps, [240, 420, 600]);
  const ordinary = tenantRateInquiry(policy, "What is the Camp Hornbill rate?");
  assert.match(ordinary || "", /₹6,000/);
  const negotiated = evaluateTenantNegotiation({ policy, message: "Can you give a better rate?", priorCustomerMessages: [], lastAssistantAnswer: ordinary || "" });
  assert.equal(negotiated.kind, "COUNTER");
  if (negotiated.kind === "COUNTER") assert.equal(negotiated.offeredRate, 5760);
});

test("a guest proposal below the Jawai floor pauses automation for manager review", () => {
  const policy = { enabled: true, propertyName: "Jawai Damstay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, discountSteps: [250, 350, 500], maxRounds: 3, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const outcome = evaluateTenantNegotiation({ policy, message: "No, I can pay 5800", priorCustomerMessages: [], lastAssistantAnswer: "I can offer Jawai Dam Stay at ₹6,250 per night, subject to availability remaining unchanged." });
  assert.equal(outcome.kind, "HUMAN_APPROVAL");
  assert.match(outcome.message, /manager approval/i);
  assert.doesNotMatch(outcome.message, /floor|threshold|6,000/);
});

test("Jawai rate is answered in chat before negotiation and booking UI", () => {
  const policy = { enabled: true, propertyName: "Jawai Damstay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, discountSteps: [250, 350, 500], maxRounds: 3, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const answer = tenantRateInquiry(policy, "What is the Jawai Dam Stay rate?");
  assert.match(answer || "", /₹6,500/);
  assert.match(answer || "", /better rate/i);
  const counter = evaluateTenantNegotiation({ policy, message: "Can you give a better rate?", priorCustomerMessages: [], lastAssistantAnswer: answer || "" });
  assert.equal(counter.kind, "COUNTER");
});

test("accepted Jawai counteroffer is recorded without claiming a booking", () => {
  const policy = { enabled: true, propertyName: "Jawai Damstay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, maxRounds: 2, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const outcome = evaluateTenantNegotiation({ policy, message: "yes", priorCustomerMessages: [], lastAssistantAnswer: "I can offer Jawai Dam Stay at ₹6,250 per night, subject to availability remaining unchanged." });
  assert.equal(outcome.kind, "ACCEPTED");
  assert.match(outcome.message, /no room is confirmed/i);
});

test("negotiation does not invent a rate before live availability is verified", () => {
  const policy = { enabled: true, propertyName: "Jawai Dam Stay", currency: "INR" as const, publicRate: 6500, floorRate: 6000, adjustmentMode: "FIXED" as const, adjustmentValue: 250, maxRounds: 2, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" as const };
  const outcome = evaluateTenantNegotiation({ policy, message: "Best rate for Jawai Dam Stay?", priorCustomerMessages: [], lastAssistantAnswer: "Please share your dates." });
  assert.equal(outcome.kind, "HUMAN_APPROVAL");
  assert.doesNotMatch(outcome.message, /6,000|6000/);
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

test("flow canvas keeps add-node and connector controls at the top", () => {
  const workspace = readFileSync(resolve(process.cwd(), "components/knowledge/flow-intelligence-workspace.tsx"), "utf8");
  assert.match(workspace, /absolute right-4 top-4/);
  assert.match(workspace, /aria-label="Connect selected node to"/);
  assert.doesNotMatch(workspace, /absolute bottom-4 left-1\/2/);
  assert.doesNotMatch(workspace, />Bot flows</);
  assert.doesNotMatch(workspace, /flow-family-strip|flow-journey|Recommended journeys/);
});

test("flow creation reuses an existing draft instead of creating duplicate cards", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/flow-intelligence/route.ts"), "utf8");
  assert.match(route, /existingDraft/);
  assert.match(route, /reused: true/);
});

test("booking form opens only for booking intent or accepted negotiation", () => {
  const route = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]/route.ts"), "utf8");
  assert.match(route, /requestsOnlineBooking \|\| negotiation\.kind === "ACCEPTED"/);
});
