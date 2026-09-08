import { createHash, randomUUID } from "node:crypto";
import { getDb } from "@/lib/db";

export function websiteHandoverOperationId(propertyId: string, leadId: string) {
  return `website-handover-${createHash("sha256").update(`${propertyId}:${leadId}`).digest("hex").slice(0, 32)}`;
}

/** One request per visitor conversation. Repeated requests never reset its SLA. */
export async function ensureWebsiteHandover(input: { propertyId: string; leadId: string; responseSlaMinutes?: number | null }) {
  const db = getDb();
  if (!db) throw new Error("Handover persistence unavailable");
  const minutes = Number(input.responseSlaMinutes);
  const request = await db.aiOperation.upsert({
    where: { id: websiteHandoverOperationId(input.propertyId, input.leadId) },
    create: { propertyId: input.propertyId, leadId: input.leadId, id: websiteHandoverOperationId(input.propertyId, input.leadId), kind: "HUMAN_REVIEW", title: "Website visitor requested human help", notes: "Review this conversation in the AI Bot inbox. No external notification delivery is implied by this request.", createdBy: "website-visitor", ...(Number.isFinite(minutes) && minutes > 0 ? { dueAt: new Date(Date.now() + minutes * 60000) } : {}) },
    update: {}
  });
  if (["COMPLETED", "CANCELLED"].includes(request.status)) {
    await db.aiOperation.updateMany({ where: { id: request.id, status: { in: ["COMPLETED", "CANCELLED"] } }, data: {
      status: "OPEN", assignedTo: null, completedAt: null, outcomeType: null, outcomeEvidence: null,
      dueAt: Number.isFinite(minutes) && minutes > 0 ? new Date(Date.now() + minutes * 60000) : null,
      notes: `Handover cycle: ${randomUUID()}. Review the conversation in the AI Bot inbox.`,
    } });
  }
  return request;
}

export function websiteConversationState(status: string, closed: boolean, hasReplies: boolean) {
  if (closed || status === "CLOSED") return "CLOSED";
  if (status === "HUMAN_JOINED" || hasReplies) return "HUMAN_JOINED";
  return status === "HUMAN_REQUESTED" ? "HUMAN_REQUESTED" : "AI_READY";
}
