import { getDb } from "@/lib/db";

const KINDS = new Set(["FOLLOW_UP", "HUMAN_REVIEW", "APPOINTMENT", "QUOTE", "ORDER", "ESCALATION", "NOTE"]);
const STATUSES = new Set(["OPEN", "IN_PROGRESS", "BLOCKED", "COMPLETED", "CANCELLED"]);
const OUTCOMES = new Set(["QUALIFIED", "APPOINTMENT_CONFIRMED", "QUOTE_SENT", "ORDER_CREATED", "WON", "LOST", "ESCALATED", "RESOLVED"]);

function clean(value: unknown, max: number) {
  return String(value || "").trim().slice(0, max);
}

export async function listLeadOperations(propertyId: string, leadId: string) {
  const db = getDb();
  if (!db) return [];
  return db.aiOperation.findMany({
    where: { propertyId, leadId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });
}

export async function createLeadOperation(input: {
  propertyId: string;
  leadId: string;
  actorEmail: string;
  kind?: unknown;
  title?: unknown;
  notes?: unknown;
  assignedTo?: unknown;
  dueAt?: unknown;
}) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const lead = await db.lead.findFirst({ where: { id: input.leadId, propertyId: input.propertyId }, select: { id: true } });
  if (!lead) throw new Error("Conversation not found in this workspace.");
  const kind = clean(input.kind, 40).toUpperCase() || "FOLLOW_UP";
  const title = clean(input.title, 180);
  if (!KINDS.has(kind)) throw new Error("Select a supported action type.");
  if (title.length < 3) throw new Error("Add a clear next action.");
  const dueAt = clean(input.dueAt, 80);
  return db.aiOperation.create({ data: {
    propertyId: input.propertyId,
    leadId: input.leadId,
    kind,
    title,
    notes: clean(input.notes, 3000) || null,
    assignedTo: clean(input.assignedTo, 180).toLowerCase() || null,
    dueAt: dueAt ? new Date(dueAt) : null,
    createdBy: input.actorEmail.toLowerCase()
  } });
}

export async function updateLeadOperation(input: {
  propertyId: string;
  leadId: string;
  operationId: string;
  status?: unknown;
  assignedTo?: unknown;
  outcomeType?: unknown;
  outcomeValuePaisa?: unknown;
  outcomeEvidence?: unknown;
}) {
  const db = getDb();
  if (!db) throw new Error("Database unavailable.");
  const operation = await db.aiOperation.findFirst({ where: { id: input.operationId, leadId: input.leadId, propertyId: input.propertyId } });
  if (!operation) throw new Error("Action not found in this workspace.");
  const status = clean(input.status, 30).toUpperCase() || operation.status;
  const outcomeType = clean(input.outcomeType, 50).toUpperCase();
  const outcomeEvidence = input.outcomeEvidence === undefined ? operation.outcomeEvidence : clean(input.outcomeEvidence, 3000) || null;
  if (!STATUSES.has(status)) throw new Error("Select a supported action status.");
  if (outcomeType && !OUTCOMES.has(outcomeType)) throw new Error("Select a supported verified outcome.");
  if (status === "COMPLETED" && !(outcomeType || operation.outcomeType) ) throw new Error("A verified outcome is required to complete an action.");
  if (status === "COMPLETED" && !outcomeEvidence) throw new Error("Verification evidence is required to complete an action.");
  const value = Number(input.outcomeValuePaisa);
  return db.aiOperation.update({ where: { id: operation.id }, data: {
    status,
    assignedTo: input.assignedTo === undefined ? operation.assignedTo : clean(input.assignedTo, 180).toLowerCase() || null,
    outcomeType: outcomeType || operation.outcomeType,
    outcomeValuePaisa: Number.isFinite(value) && value >= 0 ? Math.round(value) : operation.outcomeValuePaisa,
    outcomeEvidence,
    completedAt: status === "COMPLETED" ? operation.completedAt || new Date() : null
  } });
}

export async function getAiOperationsReport(propertyId: string) {
  const db = getDb();
  if (!db) return { open: 0, overdue: 0, completed: 0, verifiedOutcomes: 0, valuePaisa: 0, byOutcome: [] as Array<{ outcomeType: string | null; _count: { _all: number }; _sum: { outcomeValuePaisa: number | null } }> };
  const now = new Date();
  const [open, overdue, completed, outcomes] = await Promise.all([
    db.aiOperation.count({ where: { propertyId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } } }),
    db.aiOperation.count({ where: { propertyId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] }, dueAt: { lt: now } } }),
    db.aiOperation.count({ where: { propertyId, status: "COMPLETED" } }),
    db.aiOperation.groupBy({ by: ["outcomeType"], where: { propertyId, outcomeType: { not: null } }, _count: { _all: true }, _sum: { outcomeValuePaisa: true } })
  ]);
  return {
    open,
    overdue,
    completed,
    verifiedOutcomes: outcomes.reduce((sum, item) => sum + item._count._all, 0),
    valuePaisa: outcomes.reduce((sum, item) => sum + (item._sum.outcomeValuePaisa || 0), 0),
    byOutcome: outcomes
  };
}
