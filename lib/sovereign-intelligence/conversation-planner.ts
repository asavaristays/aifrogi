import { classifySovereignIntent, resolveSovereignQuestion, type SovereignDecision } from "@/lib/sovereign-intelligence/decision";
import { extractCoreEntities, type CoreEntityKind } from "@/lib/sovereign-intelligence/entities";

export const CONVERSATION_PLANNER_VERSION = "1.0" as const;

export type PlannedOutcome = "ANSWER" | "CLARIFY" | "ACT" | "HANDOVER" | "REFUSE";
export type OperationSlotDefinition = {
  key: string;
  entityKind?: CoreEntityKind;
  knownValues?: string[];
  required?: boolean;
};
export type OperationDefinition = {
  id: string;
  triggerTerms: string[];
  slots?: OperationSlotDefinition[];
};
export type ConversationPlan = {
  version: typeof CONVERSATION_PLANNER_VERSION;
  decision: SovereignDecision;
  outcome: PlannedOutcome;
  operation: null | {
    id: string;
    requested: boolean;
    ready: boolean;
    slots: Record<string, string[]>;
    missingSlots: string[];
  };
  reason: string;
};

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function includesTerm(text: string, term: string) {
  const candidate = normalized(term);
  if (!candidate) return false;
  const source = normalized(text);
  if (` ${source} `.includes(` ${candidate} `)) return true;
  if (candidate.includes(" ")) return false;
  const stem = (word: string) => word.endsWith("ies") ? `${word.slice(0, -3)}y` : word.endsWith("es") ? word.slice(0, -2) : word.endsWith("s") ? word.slice(0, -1) : word;
  return source.split(" ").some((word) => stem(word) === stem(candidate));
}

function matchOperation(question: string, definitions: OperationDefinition[]) {
  return definitions.find((definition) => definition.triggerTerms.some((term) => includesTerm(question, term))) || null;
}

function collectSlots(messages: string[], definition: OperationDefinition) {
  const slots: Record<string, string[]> = {};
  const combined = messages.join("\n");
  const entities = extractCoreEntities(combined);
  for (const slot of definition.slots || []) {
    const values = slot.entityKind
      ? entities.filter((entity) => entity.kind === slot.entityKind).map((entity) => entity.normalized)
      : (slot.knownValues || []).filter((value) => messages.some((message) => includesTerm(message, value)));
    slots[slot.key] = [...new Set(values)];
  }
  return slots;
}

export function planConversation(input: {
  question: string;
  priorQuestions?: string[];
  lastAssistantAnswer?: string;
  blueprintVersion?: string;
  operations?: OperationDefinition[];
}): ConversationPlan {
  const priorQuestions = input.priorQuestions || [];
  const decision = resolveSovereignQuestion(input.question, priorQuestions, input.blueprintVersion, input.lastAssistantAnswer || "");
  if (decision.intent === "SENSITIVE" || decision.intent === "HUMAN_REQUEST") {
    return { version: CONVERSATION_PLANNER_VERSION, decision, outcome: "HANDOVER", operation: null, reason: `${decision.intent} requires governed human handling.` };
  }
  if (decision.intent === "OFF_TOPIC") {
    return { version: CONVERSATION_PLANNER_VERSION, decision, outcome: "REFUSE", operation: null, reason: "The current request is outside the tenant business scope." };
  }

  const definitions = input.operations || [];
  const currentOperation = matchOperation(input.question, definitions);
  const contextualOperation = decision.contextUsed
    ? priorQuestions.map((question) => matchOperation(question, definitions)).find(Boolean) || null
    : null;
  const operation = currentOperation || contextualOperation;
  if (!operation) {
    return { version: CONVERSATION_PLANNER_VERSION, decision, outcome: decision.disposition === "CLARIFY" ? "CLARIFY" : "ANSWER", operation: null, reason: "No configured business operation was requested." };
  }

  // Customer messages are newest-first in the website runtime. The current
  // turn is authoritative, followed by recent customer context. Assistant
  // copy is deliberately excluded so offered examples cannot become facts.
  const slots = collectSlots([input.question, ...priorQuestions.slice(0, 6)], operation);
  const missingSlots = (operation.slots || []).filter((slot) => slot.required && !(slots[slot.key] || []).length).map((slot) => slot.key);
  const ready = missingSlots.length === 0;
  return {
    version: CONVERSATION_PLANNER_VERSION,
    decision,
    outcome: ready ? "ACT" : "CLARIFY",
    operation: { id: operation.id, requested: true, ready, slots, missingSlots },
    reason: ready ? "The configured operation was requested and all required customer slots are present." : `The configured operation needs: ${missingSlots.join(", ")}.`
  };
}

export function conversationContainsBusinessIntent(messages: string[]) {
  return messages.some((message) => ["BUSINESS", "CONTACT_INFO", "CONTEXT_FOLLOW_UP"].includes(classifySovereignIntent(message)));
}
