export type TenantFlowTemplateKey = "SERVICE_ADVISOR" | "PRICING_ENQUIRY" | "BOOKING_REQUEST" | "SUPPORT_HANDOVER";
export type TenantFlowStatus = "DRAFT" | "PUBLISHED" | "PAUSED";
export type TenantFlowNodeType = "MENU_TRIGGER" | "TENANT_ANSWER" | "MESSAGE" | "CONDITION" | "CAPTURE_CONTACT" | "HUMAN_HANDOVER" | "END";
export type TenantFlowNode = { id: string; type: TenantFlowNodeType; label: string; instruction?: string; nextId?: string; alternateNextId?: string; x?: number; y?: number };
export type TenantFlowDefinition = { id: string; name: string; templateKey: TenantFlowTemplateKey; status: TenantFlowStatus; version: number; menuLabel: string; openingQuestion: string; fallbackMode: "HUMAN_OR_CALLBACK"; steps: TenantFlowNode[]; createdAt: string; updatedAt: string; publishedAt?: string };

export const TENANT_FLOW_NODE_TYPES: Array<{ value: TenantFlowNodeType; label: string; description: string }> = [
  { value: "MENU_TRIGGER", label: "Main Menu trigger", description: "Starts when a visitor selects the linked menu option." },
  { value: "TENANT_ANSWER", label: "Answer from Intelligence", description: "Retrieves an answer only from approved tenant knowledge." },
  { value: "MESSAGE", label: "Send message", description: "Shows controlled text written by the client." },
  { value: "CONDITION", label: "Condition", description: "Creates Yes and No branches." },
  { value: "CAPTURE_CONTACT", label: "Request callback", description: "Collects name and mobile only with explicit consent." },
  { value: "HUMAN_HANDOVER", label: "Human handover", description: "Alerts the team and keeps the conversation in Team Inbox." },
  { value: "END", label: "End flow", description: "Ends without an unnecessary sales question." }
];

export const TENANT_FLOW_TEMPLATES: Array<{ key: TenantFlowTemplateKey; name: string; menuLabel: string; openingQuestion: string; description: string }> = [
  { key: "SERVICE_ADVISOR", name: "Service advisor", menuLabel: "Explore our services", openingQuestion: "Please explain your services and help me choose the most suitable option.", description: "Answers from approved service knowledge, then offers human help only when needed." },
  { key: "PRICING_ENQUIRY", name: "Pricing enquiry", menuLabel: "Pricing and quotation", openingQuestion: "Please explain the available pricing and quotation process.", description: "Uses approved prices or rules; otherwise routes to the team without inventing a figure." },
  { key: "BOOKING_REQUEST", name: "Booking request", menuLabel: "Book or schedule", openingQuestion: "I would like to book or schedule the appropriate service.", description: "Answers prerequisites first and then enables a consented follow-up." },
  { key: "SUPPORT_HANDOVER", name: "Customer support", menuLabel: "Get customer support", openingQuestion: "I need help from customer support with an existing enquiry.", description: "Attempts a verified answer and provides a human or callback path when unresolved." }
];

function id() { return crypto.randomUUID().replaceAll("-", "").slice(0, 16); }

export function newTenantFlow(templateKey: TenantFlowTemplateKey): TenantFlowDefinition {
  const template = TENANT_FLOW_TEMPLATES.find(item => item.key === templateKey) || TENANT_FLOW_TEMPLATES[0];
  const now = new Date().toISOString();
  const trigger = id(), answer = id(), condition = id(), end = id(), handover = id(), callbackNode = id();
  return { id: crypto.randomUUID(), name: template.name, templateKey: template.key, status: "DRAFT", version: 1, menuLabel: template.menuLabel, openingQuestion: template.openingQuestion, fallbackMode: "HUMAN_OR_CALLBACK", createdAt: now, updatedAt: now, steps: [
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
  if (!flow.steps.some(node => node.type === "TENANT_ANSWER")) errors.push("Add an Answer from Intelligence node.");
  for (const node of flow.steps) {
    if (node.nextId && !ids.has(node.nextId)) errors.push(`${node.label} points to a missing next node.`);
    if (node.alternateNextId && !ids.has(node.alternateNextId)) errors.push(`${node.label} points to a missing alternate node.`);
    if (node.type === "CONDITION" && (!node.nextId || !node.alternateNextId)) errors.push(`${node.label} needs both Yes and No connections.`);
  }
  return [...new Set(errors)];
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
  return { ...base, id: String(value.id || base.id).replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || base.id, name: String(value.name || base.name).trim().slice(0, 80) || base.name, menuLabel, openingQuestion, steps: safeSteps, status: ["DRAFT", "PUBLISHED", "PAUSED"].includes(String(value.status)) ? value.status as TenantFlowStatus : "DRAFT", version: Math.max(1, Number(value.version || 1)), createdAt: String(value.createdAt || base.createdAt), updatedAt: String(value.updatedAt || base.updatedAt), ...(value.publishedAt ? { publishedAt: String(value.publishedAt) } : {}) };
}
