import type { SovereignDecision } from "@/lib/sovereign-intelligence/decision";
import type { TenantFlowDefinition, TenantFlowNode, TenantFlowNodeType } from "@/lib/tenant-flow-intelligence";

export const EXECUTION_CONTRACT_VERSION = "2.0" as const;

export type IntelligenceTerminalOutcome =
  | "ANSWERED"
  | "NEEDS_ONE_CLARIFICATION"
  | "WAITING_FOR_VERIFIED_RESULT"
  | "WAITING_FOR_STAFF"
  | "HANDED_OVER"
  | "REFUSED_SAFELY"
  | "COMPLETED_AND_VERIFIED";

export type IntelligenceAuthority = "INFORMATION" | "RECOMMEND" | "REQUEST" | "EXECUTE" | "VERIFY" | "STAFF_ONLY";
export type EndpointContract = {
  key: string;
  authority: IntelligenceAuthority;
  sideEffect: boolean;
  verificationRequired: boolean;
  maxAttempts: number;
  timeoutMs: number;
};

export type FlowExecutionTrace = {
  flowId: string | null;
  flowVersion: number | null;
  nodeId: string | null;
  nodeType: TenantFlowNodeType | null;
  endpoint: EndpointContract | null;
};

export type IntelligenceExecutionContract = {
  version: typeof EXECUTION_CONTRACT_VERSION;
  terminalOutcome: IntelligenceTerminalOutcome;
  authority: IntelligenceAuthority;
  responseAllowed: boolean;
  completionClaimAllowed: boolean;
  reason: string;
  flow: FlowExecutionTrace;
};

const NODE_ENDPOINTS: Record<TenantFlowNodeType, EndpointContract> = {
  MENU_TRIGGER: { key: "conversation.flow.start", authority: "INFORMATION", sideEffect: false, verificationRequired: false, maxAttempts: 1, timeoutMs: 0 },
  TENANT_ANSWER: { key: "knowledge.approved.read", authority: "INFORMATION", sideEffect: false, verificationRequired: true, maxAttempts: 2, timeoutMs: 12_000 },
  MESSAGE: { key: "conversation.controlled_message", authority: "INFORMATION", sideEffect: false, verificationRequired: false, maxAttempts: 1, timeoutMs: 0 },
  CONDITION: { key: "conversation.condition.evaluate", authority: "INFORMATION", sideEffect: false, verificationRequired: false, maxAttempts: 1, timeoutMs: 0 },
  VERIFY_RATE: { key: "booking.availability.read", authority: "VERIFY", sideEffect: false, verificationRequired: true, maxAttempts: 2, timeoutMs: 8_000 },
  NEGOTIATE_RATE: { key: "booking.negotiation.policy", authority: "RECOMMEND", sideEffect: false, verificationRequired: true, maxAttempts: 1, timeoutMs: 0 },
  CREATE_QUOTE: { key: "booking.quote.create", authority: "EXECUTE", sideEffect: true, verificationRequired: true, maxAttempts: 1, timeoutMs: 10_000 },
  CAPTURE_CONTACT: { key: "lead.consented_contact.capture", authority: "REQUEST", sideEffect: true, verificationRequired: true, maxAttempts: 1, timeoutMs: 5_000 },
  HUMAN_HANDOVER: { key: "team_inbox.handover", authority: "STAFF_ONLY", sideEffect: true, verificationRequired: true, maxAttempts: 1, timeoutMs: 5_000 },
  END: { key: "conversation.flow.end", authority: "INFORMATION", sideEffect: false, verificationRequired: false, maxAttempts: 1, timeoutMs: 0 }
};

function words(value: string) {
  return new Set(value.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2));
}

function overlapScore(message: string, candidate: string) {
  const source = words(message);
  const target = words(candidate);
  if (!source.size || !target.size) return 0;
  return [...target].filter((word) => source.has(word)).length / Math.min(source.size, target.size);
}

export function endpointContractForNode(nodeType: TenantFlowNodeType) {
  return NODE_ENDPOINTS[nodeType];
}

export function matchPublishedFlow(flows: readonly TenantFlowDefinition[], message: string): TenantFlowDefinition | null {
  const candidates = flows
    .filter((flow) => flow.status === "PUBLISHED" && flow.journey !== "IN_STAY")
    .map((flow) => ({ flow, score: Math.max(overlapScore(message, flow.menuLabel), overlapScore(message, flow.openingQuestion), ...flow.steps.map((node) => overlapScore(message, `${node.label} ${node.instruction || ""}`))) }))
    .filter((candidate) => candidate.score >= 0.34)
    .sort((left, right) => right.score - left.score || right.flow.version - left.flow.version);
  return candidates[0]?.flow || null;
}

export function resolveFlowTrace(input: { flow: TenantFlowDefinition | null; disposition: SovereignDecision["disposition"]; actionRequested?: boolean; actionPerformed?: boolean; endpointVerified?: boolean; humanRequested?: boolean }): FlowExecutionTrace {
  if (!input.flow) return { flowId: null, flowVersion: null, nodeId: null, nodeType: null, endpoint: null };
  const preferred: TenantFlowNodeType[] = input.humanRequested ? ["HUMAN_HANDOVER", "CAPTURE_CONTACT"]
    : input.actionPerformed ? ["CREATE_QUOTE", "CAPTURE_CONTACT", "VERIFY_RATE"]
      : input.actionRequested ? ["VERIFY_RATE", "CREATE_QUOTE", "CAPTURE_CONTACT"]
        : input.disposition === "CLARIFY" ? ["CONDITION", "TENANT_ANSWER"]
          : ["TENANT_ANSWER", "MESSAGE", "END"];
  const node = preferred.map((type) => input.flow!.steps.find((candidate) => candidate.type === type)).find(Boolean) || input.flow.steps[0] || null;
  return { flowId: input.flow.id, flowVersion: input.flow.version, nodeId: node?.id || null, nodeType: node?.type || null, endpoint: node ? endpointContractForNode(node.type) : null };
}

export function validateFlowEndpointContracts(flow: TenantFlowDefinition) {
  const errors: string[] = [];
  for (const node of flow.steps) {
    const endpoint = NODE_ENDPOINTS[node.type];
    if (!endpoint) errors.push(`${node.label} has no governed endpoint contract.`);
    if (endpoint?.sideEffect && endpoint.maxAttempts !== 1) errors.push(`${node.label} must be idempotent and limited to one side-effect attempt.`);
    if (endpoint?.sideEffect && !endpoint.verificationRequired) errors.push(`${node.label} must verify its persisted or connected-system result.`);
  }
  return errors;
}

export function evaluateExecutionContract(input: {
  decision: SovereignDecision;
  flow?: TenantFlowDefinition | null;
  safetyBlocked?: boolean;
  humanRequested?: boolean;
  handoffPersisted?: boolean;
  actionRequested?: boolean;
  actionPerformed?: boolean;
  endpointVerified?: boolean;
  clarifyCount?: number;
}): IntelligenceExecutionContract {
  const flow = resolveFlowTrace({
    flow: input.flow || null,
    disposition: input.decision.disposition,
    actionRequested: input.actionRequested,
    actionPerformed: input.actionPerformed,
    endpointVerified: input.endpointVerified,
    humanRequested: input.humanRequested
  });
  const base = { version: EXECUTION_CONTRACT_VERSION, flow } as const;
  if (input.safetyBlocked || input.decision.disposition === "REFUSE") return { ...base, terminalOutcome: "REFUSED_SAFELY", authority: "INFORMATION", responseAllowed: true, completionClaimAllowed: false, reason: "Safety or policy boundary produced a controlled refusal." };
  if (input.humanRequested || input.decision.disposition === "ESCALATE") {
    const persisted = Boolean(input.handoffPersisted);
    return { ...base, terminalOutcome: persisted ? "HANDED_OVER" : "WAITING_FOR_STAFF", authority: "STAFF_ONLY", responseAllowed: true, completionClaimAllowed: false, reason: persisted ? "Human ownership was persisted before acknowledgment." : "Human authority is required and ownership is not yet verified." };
  }
  if (input.actionRequested) {
    if (!input.actionPerformed) return { ...base, terminalOutcome: "WAITING_FOR_VERIFIED_RESULT", authority: flow.endpoint?.authority || "EXECUTE", responseAllowed: true, completionClaimAllowed: false, reason: "The requested operation has not produced a verified result." };
    if (!input.endpointVerified) return { ...base, terminalOutcome: "WAITING_FOR_VERIFIED_RESULT", authority: "VERIFY", responseAllowed: true, completionClaimAllowed: false, reason: "The operation ran but its system-of-record result has not been verified." };
    return { ...base, terminalOutcome: "COMPLETED_AND_VERIFIED", authority: "VERIFY", responseAllowed: true, completionClaimAllowed: true, reason: "The authorised operation completed and its result was verified." };
  }
  if (input.decision.disposition === "CLARIFY") return { ...base, terminalOutcome: input.clarifyCount && input.clarifyCount > 1 ? "WAITING_FOR_STAFF" : "NEEDS_ONE_CLARIFICATION", authority: "INFORMATION", responseAllowed: true, completionClaimAllowed: false, reason: input.clarifyCount && input.clarifyCount > 1 ? "The clarification limit was reached; do not continue the loop." : "One bounded clarification is permitted." };
  if (["ANSWER"].includes(input.decision.disposition)) return { ...base, terminalOutcome: "ANSWERED", authority: "INFORMATION", responseAllowed: true, completionClaimAllowed: false, reason: "The turn was answered without claiming a material action completed." };
  return { ...base, terminalOutcome: "WAITING_FOR_STAFF", authority: "STAFF_ONLY", responseAllowed: true, completionClaimAllowed: false, reason: "No safe autonomous terminal outcome was available." };
}

export function answerClaimsUnverifiedCompletion(answer: string) {
  return /\b(?:booked|booking (?:is |was )?confirmed|payment (?:is |was )?(?:complete|completed|successful)|assigned|resolved|completed|order (?:is |was )?placed|appointment (?:is |was )?confirmed)\b/i.test(answer);
}

export function enforceExecutionResponse(contract: IntelligenceExecutionContract, answer: string) {
  if (contract.completionClaimAllowed || !answerClaimsUnverifiedCompletion(answer)) return answer;
  return contract.terminalOutcome === "WAITING_FOR_STAFF" || contract.terminalOutcome === "HANDED_OVER"
    ? "Your request has been recorded for the team. It is not confirmed or completed yet; the team will update you after they verify the result."
    : "Your request is being checked. It is not confirmed or completed until the verified result is available.";
}

export function flowContainsUnboundedCycle(flow: TenantFlowDefinition) {
  const nodes = new Map<string, TenantFlowNode>(flow.steps.map((node) => [node.id, node]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    const node = nodes.get(id);
    if (!node) return false;
    visiting.add(id);
    const cycle = [node.nextId, node.alternateNextId].filter(Boolean).some((next) => walk(next!));
    visiting.delete(id);
    visited.add(id);
    return cycle;
  };
  return flow.steps.filter((node) => node.type === "MENU_TRIGGER").some((node) => walk(node.id));
}
