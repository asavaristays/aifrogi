export type TenantFlowTemplateKey = "CUSTOM_FLOW" | "SERVICE_ADVISOR" | "PRICING_ENQUIRY" | "BOOKING_REQUEST" | "SUPPORT_HANDOVER" | "COMMERCIAL_NEGOTIATION" | "HOTEL_DISCOVER" | "HOTEL_FIND_STAY" | "HOTEL_PLAN_ARRIVAL" | "HOTEL_SERVICE_REQUEST" | "HOTEL_REPORT_PROBLEM" | "HOTEL_RESOLUTION_FEEDBACK";
export type TenantFlowStatus = "DRAFT" | "PUBLISHED" | "PAUSED";
export type TenantFlowNodeType = "MENU_TRIGGER" | "TENANT_ANSWER" | "MESSAGE" | "CONDITION" | "VERIFY_RATE" | "NEGOTIATE_RATE" | "CREATE_QUOTE" | "CAPTURE_CONTACT" | "HUMAN_HANDOVER" | "END";
export type TenantFlowNode = { id: string; type: TenantFlowNodeType; label: string; instruction?: string; nextId?: string; alternateNextId?: string; x?: number; y?: number };
export type NegotiationPolicy = {
  enabled: boolean;
  propertyName: string;
  roomName?: string;
  currency: "INR";
  publicRate: number;
  floorRate: number;
  adjustmentMode: "FIXED" | "PERCENT";
  adjustmentValue: number;
  discountSteps?: number[];
  maxRounds: number;
  quoteExpiryMinutes: number;
  approvalMode: "AUTO_ABOVE_FLOOR" | "HUMAN_ALL";
};
export type TenantFlowDefinition = { id: string; name: string; templateKey: TenantFlowTemplateKey; status: TenantFlowStatus; version: number; menuLabel: string; openingQuestion: string; fallbackMode: "HUMAN_OR_CALLBACK"; steps: TenantFlowNode[]; negotiationPolicy?: NegotiationPolicy; botCategory?: "STAY"; journey?: "PRE_STAY" | "IN_STAY"; access?: "PUBLIC" | "VERIFIED_STAY"; templateVersion?: number; originTemplateId?: string; requiredKnowledge?: string[]; requiredConnector?: string | null; department?: string | null; smartOutputs?: string[]; createdAt: string; updatedAt: string; publishedAt?: string };

export type TenantBotFamily = "BUSINESS_AI" | "STAY" | "PINGBOOK" | "FLOWCART" | "RESTAURANT" | "REAL_ESTATE" | "EDUCATION" | "CUSTOM";

const FAMILY_FLOW_RECOMMENDATIONS: Record<TenantBotFamily, TenantFlowTemplateKey[]> = {
  BUSINESS_AI: ["SERVICE_ADVISOR", "PRICING_ENQUIRY", "SUPPORT_HANDOVER"],
  STAY: ["HOTEL_DISCOVER", "HOTEL_FIND_STAY", "HOTEL_PLAN_ARRIVAL", "HOTEL_SERVICE_REQUEST", "HOTEL_REPORT_PROBLEM", "HOTEL_RESOLUTION_FEEDBACK"],
  PINGBOOK: ["BOOKING_REQUEST", "SERVICE_ADVISOR", "SUPPORT_HANDOVER"],
  FLOWCART: ["PRICING_ENQUIRY", "BOOKING_REQUEST", "SUPPORT_HANDOVER"],
  RESTAURANT: ["BOOKING_REQUEST", "SERVICE_ADVISOR", "SUPPORT_HANDOVER"],
  REAL_ESTATE: ["SERVICE_ADVISOR", "PRICING_ENQUIRY", "BOOKING_REQUEST", "SUPPORT_HANDOVER"],
  EDUCATION: ["SERVICE_ADVISOR", "PRICING_ENQUIRY", "BOOKING_REQUEST", "SUPPORT_HANDOVER"],
  CUSTOM: ["CUSTOM_FLOW", "SERVICE_ADVISOR", "SUPPORT_HANDOVER"]
};

export function recommendedFlowTemplateKeys(category: string): TenantFlowTemplateKey[] {
  return FAMILY_FLOW_RECOMMENDATIONS[category as TenantBotFamily] || FAMILY_FLOW_RECOMMENDATIONS.BUSINESS_AI;
}

export function evaluateAgenticFlowReadiness(input: { flows: TenantFlowDefinition[]; category: string; connectorEnabled: boolean }) {
  const published = input.flows.filter(flow => flow.status === "PUBLISHED");
  const recommended = recommendedFlowTemplateKeys(input.category);
  const covered = new Set(published.map(flow => flow.templateKey));
  const transactional = published.some(flow => flow.steps.some(node => ["VERIFY_RATE", "CREATE_QUOTE", "NEGOTIATE_RATE"].includes(node.type)));
  const recovery = published.some(flow => flow.steps.some(node => ["HUMAN_HANDOVER", "CAPTURE_CONTACT"].includes(node.type)));
  const issues: string[] = [];
  if (!published.length) issues.push("Publish at least one customer journey.");
  if (transactional && !input.connectorEnabled) issues.push("Connect and verify the system of record before live actions.");
  if (published.length && !recovery) issues.push("Add a human handover or consented callback recovery path.");
  const coverage = recommended.length ? Math.round(100 * recommended.filter(key => covered.has(key)).length / recommended.length) : 100;
  const stage = !published.length ? "DESIGN" : issues.length ? "GOVERN" : transactional ? "AGENTIC_READY" : "ASSISTIVE_LIVE";
  return { stage, issues, coverage, publishedCount: published.length, transactional, recovery } as const;
}

export type TenantFlowNodeCategory = "TRIGGER" | "INTELLIGENCE" | "LOGIC" | "ACTION" | "HANDOVER";

export const TENANT_FLOW_NODE_TYPES: Array<{ value: TenantFlowNodeType; label: string; description: string; category: TenantFlowNodeCategory }> = [
  { value: "MENU_TRIGGER", label: "Main Menu trigger", description: "Starts when a visitor selects the linked menu option.", category: "TRIGGER" },
  { value: "TENANT_ANSWER", label: "Answer from Intelligence", description: "Retrieves an answer only from approved tenant knowledge.", category: "INTELLIGENCE" },
  { value: "MESSAGE", label: "Send message", description: "Shows controlled text written by the client.", category: "ACTION" },
  { value: "CONDITION", label: "Condition", description: "Creates Yes and No branches.", category: "LOGIC" },
  { value: "VERIFY_RATE", label: "Verify live rate", description: "Requires an available stay and rate from the approved booking connector.", category: "INTELLIGENCE" },
  { value: "NEGOTIATE_RATE", label: "Apply negotiation policy", description: "Calculates a bounded counteroffer without revealing the private floor.", category: "LOGIC" },
  { value: "CREATE_QUOTE", label: "Create expiring quote", description: "Prepares a time-limited offer after acceptance; it does not confirm a booking.", category: "ACTION" },
  { value: "CAPTURE_CONTACT", label: "Request callback", description: "Collects name and mobile only with explicit consent.", category: "HANDOVER" },
  { value: "HUMAN_HANDOVER", label: "Human handover", description: "Alerts the team and keeps the conversation in Team Inbox.", category: "HANDOVER" },
  { value: "END", label: "End flow", description: "Ends without an unnecessary sales question.", category: "ACTION" }
];

export const TENANT_FLOW_TEMPLATES: Array<{ key: TenantFlowTemplateKey; name: string; menuLabel: string; openingQuestion: string; description: string }> = [
  { key: "CUSTOM_FLOW", name: "Create custom flow", menuLabel: "How can we help?", openingQuestion: "Write the response or instruction for this step.", description: "Start with a clean trigger, response and end point, then add the nodes your customer journey needs." },
  { key: "SERVICE_ADVISOR", name: "Service advisor", menuLabel: "Explore our services", openingQuestion: "Please explain your services and help me choose the most suitable option.", description: "Answers from approved service knowledge, then offers human help only when needed." },
  { key: "PRICING_ENQUIRY", name: "Pricing enquiry", menuLabel: "Pricing and quotation", openingQuestion: "Please explain the available pricing and quotation process.", description: "Uses approved prices or rules; otherwise routes to the team without inventing a figure." },
  { key: "BOOKING_REQUEST", name: "Booking request", menuLabel: "Book or schedule", openingQuestion: "I would like to book or schedule the appropriate service.", description: "Answers prerequisites first and then enables a consented follow-up." },
  { key: "SUPPORT_HANDOVER", name: "Customer support", menuLabel: "Get customer support", openingQuestion: "I need help from customer support with an existing enquiry.", description: "Attempts a verified answer and provides a human or callback path when unresolved." }
  ,{ key: "COMMERCIAL_NEGOTIATION", name: "Rate negotiation", menuLabel: "Request best available rate", openingQuestion: "I would like to check whether a better approved rate is available for my selected stay.", description: "Verifies the live rate, applies the tenant’s private boundary and escalates requests outside authority." },
  { key:"HOTEL_DISCOVER",name:"Discover hotel",menuLabel:"Discover the hotel",openingQuestion:"Please help me discover the hotel, its character and the experiences it offers.",description:"HotelGPT · public Pre-Stay discovery." },
  { key:"HOTEL_FIND_STAY",name:"Find a stay",menuLabel:"Find a stay",openingQuestion:"Help me find the right stay. I can share my destination, dates and number of guests.",description:"HotelGPT · public Pre-Stay conversion." },
  { key:"HOTEL_PLAN_ARRIVAL",name:"Plan arrival",menuLabel:"Plan my arrival",openingQuestion:"Help me plan my arrival, including check-in, directions, transport or an early-arrival request.",description:"HotelGPT · public Pre-Stay arrival guidance." },
  { key:"HOTEL_SERVICE_REQUEST",name:"Request hotel service",menuLabel:"Request hotel service",openingQuestion:"I need a hotel service for my room.",description:"HotelGPT · verified In-Stay service." },
  { key:"HOTEL_REPORT_PROBLEM",name:"Report a problem",menuLabel:"Report a problem",openingQuestion:"I need to report a problem with my room or stay.",description:"HotelGPT · verified In-Stay complaint." },
  { key:"HOTEL_RESOLUTION_FEEDBACK",name:"Resolution and feedback",menuLabel:"My request status",openingQuestion:"Show the current status of my hotel request and let me confirm the outcome.",description:"HotelGPT · verified In-Stay outcome." }
];

function id() { return crypto.randomUUID().replaceAll("-", "").slice(0, 16); }

export function newTenantFlow(templateKey: TenantFlowTemplateKey): TenantFlowDefinition {
  const template = TENANT_FLOW_TEMPLATES.find(item => item.key === templateKey) || TENANT_FLOW_TEMPLATES[0];
  const now = new Date().toISOString();
  const hotelTemplate = hotelFlowTemplate(templateKey);
  const trigger = id(), answer = id(), condition = id(), end = id(), handover = id(), callbackNode = id();
  if (template.key === "CUSTOM_FLOW") {
    const trigger = id(), response = id(), end = id();
    return { id: crypto.randomUUID(), name: "Custom flow", templateKey: template.key, status: "DRAFT", version: 1, menuLabel: template.menuLabel, openingQuestion: template.openingQuestion, fallbackMode: "HUMAN_OR_CALLBACK", createdAt: now, updatedAt: now, steps: [
      { id: trigger, type: "MENU_TRIGGER", label: "Customer starts this flow", nextId: response, x: 80, y: 250 },
      { id: response, type: "TENANT_ANSWER", label: "Answer from approved Intelligence", instruction: template.openingQuestion, nextId: end, x: 380, y: 250 },
      { id: end, type: "END", label: "End or continue naturally", x: 680, y: 250 }
    ] };
  }
  if (template.key === "COMMERCIAL_NEGOTIATION") {
    const trigger = id(), verify = id(), negotiate = id(), accept = id(), quote = id(), handover = id();
    return { id: crypto.randomUUID(), name: template.name, templateKey: template.key, status: "DRAFT", version: 1, menuLabel: template.menuLabel, openingQuestion: template.openingQuestion, fallbackMode: "HUMAN_OR_CALLBACK", createdAt: now, updatedAt: now,
      negotiationPolicy: { enabled: false, propertyName: "", currency: "INR", publicRate: 0, floorRate: 0, adjustmentMode: "FIXED", adjustmentValue: 250, discountSteps: [250, 350, 500], maxRounds: 3, quoteExpiryMinutes: 15, approvalMode: "AUTO_ABOVE_FLOOR" },
      steps: [
        { id: trigger, type: "MENU_TRIGGER", label: "Guest requests a better rate", nextId: verify, x: 40, y: 250 },
        { id: verify, type: "VERIFY_RATE", label: "Verify selected stay and live rate", nextId: negotiate, alternateNextId: handover, x: 320, y: 250 },
        { id: negotiate, type: "NEGOTIATE_RATE", label: "Apply private tenant boundary", nextId: accept, alternateNextId: handover, x: 600, y: 250 },
        { id: accept, type: "CONDITION", label: "Guest accepts the offer", nextId: quote, alternateNextId: negotiate, x: 880, y: 250 },
        { id: quote, type: "CREATE_QUOTE", label: "Prepare an expiring quote", x: 1160, y: 120 },
        { id: handover, type: "HUMAN_HANDOVER", label: "Request reservations approval", x: 1160, y: 400 }
      ] };
  }
  return { id: crypto.randomUUID(), name: template.name, templateKey: template.key, status: "DRAFT", version: 1, menuLabel: template.menuLabel, openingQuestion: template.openingQuestion, fallbackMode: "HUMAN_OR_CALLBACK", createdAt: now, updatedAt: now, ...(hotelTemplate ? { botCategory:"STAY" as const,journey:hotelTemplate.journey,access:hotelTemplate.access,templateVersion:hotelTemplate.version,originTemplateId:hotelTemplate.id,requiredKnowledge:[...hotelTemplate.requiredKnowledge],requiredConnector:hotelTemplate.requiredConnector,department:hotelTemplate.department,smartOutputs:[...hotelTemplate.smartOutputs] } : {}), steps: [
    { id: trigger, type: "MENU_TRIGGER", label: "Visitor chooses this menu option", nextId: answer, x: 50, y: 250 },
    { id: answer, type: "TENANT_ANSWER", label: "Answer from approved Intelligence", instruction: template.openingQuestion, nextId: condition, x: 330, y: 250 },
    { id: condition, type: "CONDITION", label: "Was the visitor answered accurately?", instruction: "Verified answer available", nextId: end, alternateNextId: handover, x: 610, y: 250 },
    { id: end, type: "END", label: "Continue natural conversation", x: 890, y: 100 },
    { id: handover, type: "HUMAN_HANDOVER", label: "Offer a reply from the business team", nextId: callbackNode, x: 890, y: 390 },
    { id: callbackNode, type: "CAPTURE_CONTACT", label: "Or request a consented callback", x: 1170, y: 390 }
  ] };
}

function cleanNode(raw: unknown): TenantFlowNode | null {
  if (!raw || typeof raw !== "object") return null;
  const node = raw as Partial<TenantFlowNode>;
  const migratedType = String(node.type) === "CONSENTED_CALLBACK" ? "CAPTURE_CONTACT" : node.type;
  if (!TENANT_FLOW_NODE_TYPES.some(item => item.value === migratedType)) return null;
  const nodeId = String(node.id || id()).replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || id();
  const label = String(node.label || "").trim().slice(0, 120);
  if (!label) return null;
  const nextId = String(node.nextId || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const alternateNextId = String(node.alternateNextId || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
  const x = Math.max(20, Math.min(1800, Number(node.x ?? 40)));
  const y = Math.max(20, Math.min(1000, Number(node.y ?? 40)));
  return { id: nodeId, type: migratedType as TenantFlowNodeType, label, x, y, ...(String(node.instruction || "").trim() ? { instruction: String(node.instruction).trim().slice(0, 600) } : {}), ...(nextId ? { nextId } : {}), ...(alternateNextId ? { alternateNextId } : {}) };
}

export function validateTenantFlow(flow: TenantFlowDefinition) {
  const errors: string[] = [];
  const ids = new Set(flow.steps.map(node => node.id));
  if (ids.size !== flow.steps.length) errors.push("Every node must have a unique ID.");
  if (!flow.steps.some(node => node.type === "MENU_TRIGGER")) errors.push("Add a Main Menu trigger node.");
  if (flow.templateKey !== "COMMERCIAL_NEGOTIATION" && !flow.steps.some(node => node.type === "TENANT_ANSWER")) errors.push("Add an Answer from Intelligence node.");
  if (flow.templateKey === "COMMERCIAL_NEGOTIATION") {
    const policy = flow.negotiationPolicy;
    if (!policy?.propertyName) errors.push("Select the property governed by this negotiation flow.");
    if (!policy || policy.publicRate <= 0) errors.push("Enter a valid public rate.");
    if (!policy || policy.floorRate <= 0 || policy.floorRate > policy.publicRate) errors.push("Private floor must be greater than zero and no higher than the public rate.");
    if (!policy || policy.adjustmentValue <= 0) errors.push("Enter a valid rate adjustment.");
    if (policy?.discountSteps?.some((discount, index, values) => discount <= 0 || discount > policy.publicRate - policy.floorRate || (index > 0 && discount <= values[index - 1]))) errors.push("Progressive discounts must increase and remain inside the private boundary.");
  }
  for (const node of flow.steps) {
    if (node.nextId && !ids.has(node.nextId)) errors.push(`${node.label} points to a missing next node.`);
    if (node.alternateNextId && !ids.has(node.alternateNextId)) errors.push(`${node.label} points to a missing alternate node.`);
    if (node.type === "CONDITION" && (!node.nextId || !node.alternateNextId)) errors.push(`${node.label} needs both Yes and No connections.`);
  }
  return [...new Set(errors)];
}

export type TenantFlowJourneyCheck = {
  ready: boolean;
  visitedNodeIds: string[];
  paths: string[][];
  issues: string[];
  nextAction: string;
};

/** A side-effect-free journey check. It validates structure and follows every Yes/No path. */
export function inspectTenantFlowJourney(flow: TenantFlowDefinition): TenantFlowJourneyCheck {
  const issues = validateTenantFlow(flow);
  const nodes = new Map(flow.steps.map(node => [node.id, node]));
  const starts = flow.steps.filter(node => node.type === "MENU_TRIGGER");
  const visited = new Set<string>();
  const paths: string[][] = [];
  const terminalTypes = new Set<TenantFlowNodeType>(["END", "CREATE_QUOTE", "CAPTURE_CONTACT", "HUMAN_HANDOVER"]);

  function walk(nodeId: string, path: string[], active: Set<string>) {
    const node = nodes.get(nodeId);
    if (!node) return;
    visited.add(node.id);
    const nextPath = [...path, node.label];
    if (active.has(node.id)) {
      if (flow.templateKey !== "COMMERCIAL_NEGOTIATION") issues.push(`${node.label} creates a loop that needs a clear exit.`);
      paths.push(nextPath);
      return;
    }
    const targets = [node.nextId, node.alternateNextId].filter(Boolean) as string[];
    if (!targets.length) {
      paths.push(nextPath);
      if (!terminalTypes.has(node.type)) issues.push(`${node.label} stops without an action, handover or end node.`);
      return;
    }
    const nextActive = new Set(active).add(node.id);
    for (const target of targets) walk(target, nextPath, nextActive);
  }

  for (const start of starts) walk(start.id, [], new Set());
  const unreachable = flow.steps.filter(node => !visited.has(node.id));
  if (unreachable.length) issues.push(`${unreachable.length} node${unreachable.length === 1 ? " is" : "s are"} not connected to a trigger.`);
  const uniqueIssues = [...new Set(issues)];
  return {
    ready: uniqueIssues.length === 0,
    visitedNodeIds: [...visited],
    paths,
    issues: uniqueIssues,
    nextAction: uniqueIssues.length ? "Resolve journey checks" : flow.status === "PUBLISHED" ? "Monitor live conversations" : "Publish and enable"
  };
}

export function normalizeTenantFlow(raw: unknown): TenantFlowDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<TenantFlowDefinition>;
  if (!TENANT_FLOW_TEMPLATES.some(item => item.key === value.templateKey)) return null;
  const menuLabel = String(value.menuLabel || "").trim().slice(0, 54);
  const openingQuestion = String(value.openingQuestion || "").trim().slice(0, 400);
  if (!menuLabel || openingQuestion.length < 8) return null;
  const base = newTenantFlow(value.templateKey!);
  const steps = Array.isArray(value.steps) ? value.steps.slice(0, 24).map(cleanNode).filter(Boolean) as TenantFlowNode[] : base.steps;
  if (!steps.length) return null;
  const nodeIds = new Set(steps.map(node => node.id));
  const safeSteps = steps.map(node => ({ ...node, ...(node.nextId && !nodeIds.has(node.nextId) ? { nextId: undefined } : {}), ...(node.alternateNextId && !nodeIds.has(node.alternateNextId) ? { alternateNextId: undefined } : {}) }));
  const sourcePolicy = value.negotiationPolicy as Partial<NegotiationPolicy> | undefined;
  const negotiationPolicy = value.templateKey === "COMMERCIAL_NEGOTIATION" ? {
    enabled: sourcePolicy?.enabled === true,
    propertyName: String(sourcePolicy?.propertyName || "").trim().slice(0, 100),
    ...(String(sourcePolicy?.roomName || "").trim() ? { roomName: String(sourcePolicy?.roomName).trim().slice(0, 100) } : {}),
    currency: "INR" as const,
    publicRate: Math.max(0, Math.round(Number(sourcePolicy?.publicRate || 0))),
    floorRate: Math.max(0, Math.round(Number(sourcePolicy?.floorRate || 0))),
    adjustmentMode: sourcePolicy?.adjustmentMode === "PERCENT" ? "PERCENT" as const : "FIXED" as const,
    adjustmentValue: Math.max(0, Math.min(100000, Number(sourcePolicy?.adjustmentValue || 0))),
    discountSteps: Array.isArray(sourcePolicy?.discountSteps) ? sourcePolicy.discountSteps.slice(0, 3).map(value => Math.max(0, Math.round(Number(value)))) : undefined,
    maxRounds: Math.max(1, Math.min(3, Math.round(Number(sourcePolicy?.maxRounds || 2)))),
    quoteExpiryMinutes: Math.max(5, Math.min(1440, Math.round(Number(sourcePolicy?.quoteExpiryMinutes || 15)))),
    approvalMode: sourcePolicy?.approvalMode === "HUMAN_ALL" ? "HUMAN_ALL" as const : "AUTO_ABOVE_FLOOR" as const
  } : undefined;
  return { ...base, id: String(value.id || base.id).replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || base.id, name: String(value.name || base.name).trim().slice(0, 80) || base.name, menuLabel, openingQuestion, steps: safeSteps, ...(negotiationPolicy ? { negotiationPolicy } : {}), ...(value.botCategory === "STAY" ? { botCategory:"STAY" as const } : {}), ...(["PRE_STAY","IN_STAY"].includes(String(value.journey)) ? { journey:value.journey as "PRE_STAY"|"IN_STAY" } : {}), ...(["PUBLIC","VERIFIED_STAY"].includes(String(value.access)) ? { access:value.access as "PUBLIC"|"VERIFIED_STAY" } : {}), ...(value.templateVersion ? { templateVersion:Math.max(1,Number(value.templateVersion)) } : {}), ...(value.originTemplateId ? { originTemplateId:String(value.originTemplateId).slice(0,80) } : {}), ...(Array.isArray(value.requiredKnowledge) ? { requiredKnowledge:value.requiredKnowledge.map(String).slice(0,12) } : {}), ...(value.requiredConnector !== undefined ? { requiredConnector:value.requiredConnector ? String(value.requiredConnector).slice(0,160) : null } : {}), ...(value.department !== undefined ? { department:value.department ? String(value.department).slice(0,80) : null } : {}), ...(Array.isArray(value.smartOutputs) ? { smartOutputs:value.smartOutputs.map(String).slice(0,12) } : {}), status: ["DRAFT", "PUBLISHED", "PAUSED"].includes(String(value.status)) ? value.status as TenantFlowStatus : "DRAFT", version: Math.max(1, Number(value.version || 1)), createdAt: String(value.createdAt || base.createdAt), updatedAt: String(value.updatedAt || base.updatedAt), ...(value.publishedAt ? { publishedAt: String(value.publishedAt) } : {}) };
}
import { hotelFlowTemplate } from "@/lib/hotelgpt-flow-library";
