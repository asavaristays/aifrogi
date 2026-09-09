export type TenantFlowTemplateKey = "SERVICE_ADVISOR" | "PRICING_ENQUIRY" | "BOOKING_REQUEST" | "SUPPORT_HANDOVER";
export type TenantFlowStatus = "DRAFT" | "PUBLISHED" | "PAUSED";

export type TenantFlowDefinition = {
  id: string;
  name: string;
  templateKey: TenantFlowTemplateKey;
  status: TenantFlowStatus;
  version: number;
  menuLabel: string;
  openingQuestion: string;
  fallbackMode: "HUMAN_OR_CALLBACK";
  steps: Array<{ id: string; type: "MENU_TRIGGER" | "TENANT_ANSWER" | "HUMAN_HANDOVER" | "CONSENTED_CALLBACK"; label: string }>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export const TENANT_FLOW_TEMPLATES: Array<{ key: TenantFlowTemplateKey; name: string; menuLabel: string; openingQuestion: string; description: string }> = [
  { key: "SERVICE_ADVISOR", name: "Service advisor", menuLabel: "Explore our services", openingQuestion: "Please explain your services and help me choose the most suitable option.", description: "Answers from approved service knowledge, then offers human help only when needed." },
  { key: "PRICING_ENQUIRY", name: "Pricing enquiry", menuLabel: "Pricing and quotation", openingQuestion: "Please explain the available pricing and quotation process.", description: "Uses approved prices or pricing rules; otherwise routes to the right team without inventing a figure." },
  { key: "BOOKING_REQUEST", name: "Booking request", menuLabel: "Book or schedule", openingQuestion: "I would like to book or schedule the appropriate service.", description: "Answers relevant prerequisites first and then enables a consented team follow-up." },
  { key: "SUPPORT_HANDOVER", name: "Customer support", menuLabel: "Get customer support", openingQuestion: "I need help from customer support with an existing enquiry.", description: "Attempts a verified answer and provides a professional human or callback path when unresolved." }
];

export function newTenantFlow(templateKey: TenantFlowTemplateKey): TenantFlowDefinition {
  const template = TENANT_FLOW_TEMPLATES.find(item => item.key === templateKey) || TENANT_FLOW_TEMPLATES[0];
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), name: template.name, templateKey: template.key, status: "DRAFT", version: 1, menuLabel: template.menuLabel, openingQuestion: template.openingQuestion, fallbackMode: "HUMAN_OR_CALLBACK", createdAt: now, updatedAt: now, steps: [
    { id: "menu", type: "MENU_TRIGGER", label: "Visitor selects Main Menu option" },
    { id: "answer", type: "TENANT_ANSWER", label: "Answer from approved tenant intelligence" },
    { id: "handover", type: "HUMAN_HANDOVER", label: "If unresolved, offer human chat" },
    { id: "callback", type: "CONSENTED_CALLBACK", label: "With consent, collect name and mobile for callback" }
  ] };
}

export function normalizeTenantFlow(raw: unknown): TenantFlowDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<TenantFlowDefinition>;
  if (!TENANT_FLOW_TEMPLATES.some(item => item.key === value.templateKey)) return null;
  const menuLabel = String(value.menuLabel || "").trim().slice(0, 54);
  const openingQuestion = String(value.openingQuestion || "").trim().slice(0, 400);
  if (!menuLabel || openingQuestion.length < 8) return null;
  const base = newTenantFlow(value.templateKey!);
  return { ...base, id: String(value.id || base.id).replace(/[^a-z0-9_-]/gi, "").slice(0, 80) || base.id, name: String(value.name || base.name).trim().slice(0, 80) || base.name, menuLabel, openingQuestion, status: ["DRAFT", "PUBLISHED", "PAUSED"].includes(String(value.status)) ? value.status as TenantFlowStatus : "DRAFT", version: Math.max(1, Number(value.version || 1)), createdAt: String(value.createdAt || base.createdAt), updatedAt: String(value.updatedAt || base.updatedAt), ...(value.publishedAt ? { publishedAt: String(value.publishedAt) } : {}) };
}
