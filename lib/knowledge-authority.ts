import type { ClientAccessRole } from "@/lib/client-access";

export type GovernedKnowledgeAction = "CREATE_CLAIM" | "FIELD_APPROVE" | "PREVIEW_REVIEW" | "PAUSE" | "RECONFIRM" | "DELETE_DRAFT" | "REVIEW_FLAG";

const BUSINESS_TRUTH_ROLES = new Set<ClientAccessRole>(["OWNER", "ADMIN"]);

export function canPerformGovernedKnowledgeAction(role: ClientAccessRole, _action: GovernedKnowledgeAction) {
  return BUSINESS_TRUTH_ROLES.has(role);
}

export function governedKnowledgeRoleLabel(role: ClientAccessRole) {
  return BUSINESS_TRUTH_ROLES.has(role) ? "CLIENT_ADMIN" : role;
}
