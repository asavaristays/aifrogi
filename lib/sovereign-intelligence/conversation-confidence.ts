import { classifySovereignIntent, type SovereignIntent } from "@/lib/sovereign-intelligence/decision";
import { coreEntityFacts, extractCoreEntities } from "@/lib/sovereign-intelligence/entities";
import { resolveTenantEntity, type TenantEntityKnowledge } from "@/lib/tenant-intelligence/deep-crawl";

export const CONVERSATION_CONFIDENCE_VERSION = "1.0" as const;
export type ConfidenceRoute = "ANSWER" | "CLARIFY" | "HANDOVER";

const ENTITY_FOLLOW_UP = /\b(?:it|that|this|there|same|property|hotel|stay|room|product|service|amenit(?:y|ies)|facility|facilities|rate|price|location|airport|railway|distance|available|availability|book|booking)\b/i;

export function buildSessionConversationMemory(input: {
  question: string;
  priorQuestions?: string[];
  entities?: TenantEntityKnowledge[];
  consentContact?: boolean;
}) {
  const priorQuestions = input.priorQuestions || [];
  const entities = input.entities || [];
  const currentEntity = resolveTenantEntity(entities, input.question);
  const rememberedEntity = currentEntity || priorQuestions.map((question) => resolveTenantEntity(entities, question)).find(Boolean) || null;
  const mayUseRememberedEntity = !currentEntity && Boolean(rememberedEntity) && ENTITY_FOLLOW_UP.test(input.question);
  const entity = currentEntity || (mayUseRememberedEntity ? rememberedEntity : null);
  const customerEntities = extractCoreEntities([input.question, ...priorQuestions.slice(0, 8)].join("\n"));
  return {
    version: CONVERSATION_CONFIDENCE_VERSION,
    entity,
    tenantPropertyId: entity?.entityType === "PROPERTY" ? entity.entityId : null,
    entityFromCurrentTurn: Boolean(currentEntity),
    contextUsed: mayUseRememberedEntity,
    slots: coreEntityFacts(customerEntities, { consentContact: input.consentContact }),
    retrievalQuestion: mayUseRememberedEntity && rememberedEntity ? `${input.question.trim()}\nSelected tenant entity: ${rememberedEntity.name}` : input.question.trim()
  };
}

export function routeConversationByConfidence(input: {
  intent: SovereignIntent;
  hasApprovedContext: boolean;
  hasResolvedEntity?: boolean;
  priorQuestions?: string[];
}) {
  const priorUnknownTurns = (input.priorQuestions || []).slice(0, 3).filter((question) => classifySovereignIntent(question) === "UNKNOWN").length;
  if (input.intent === "HUMAN_REQUEST" || input.intent === "SENSITIVE") return { version: CONVERSATION_CONFIDENCE_VERSION, route: "HANDOVER" as const, confidence: 1, reason: "Human or sensitive intent has deterministic priority." };
  if (input.intent === "UNKNOWN" && !input.hasResolvedEntity && !input.hasApprovedContext) {
    return priorUnknownTurns >= 1
      ? { version: CONVERSATION_CONFIDENCE_VERSION, route: "HANDOVER" as const, confidence: 0, reason: "A second unclear request exits the clarification loop." }
      : { version: CONVERSATION_CONFIDENCE_VERSION, route: "CLARIFY" as const, confidence: 0.35, reason: "The business subject is not specific enough for safe retrieval." };
  }
  if (!input.hasApprovedContext) return { version: CONVERSATION_CONFIDENCE_VERSION, route: "HANDOVER" as const, confidence: 0, reason: "No approved evidence supports an answer." };
  return { version: CONVERSATION_CONFIDENCE_VERSION, route: "ANSWER" as const, confidence: input.hasResolvedEntity ? 0.95 : 0.8, reason: "The request has approved evidence and a sufficiently resolved subject." };
}
