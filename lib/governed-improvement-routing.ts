export type ImprovementRoute = {
  id: string;
  trigger: "INCORRECT_FACT_FLAG" | "KNOWLEDGE_GAP" | "CONFLICT" | "EXPIRED_CLAIM" | "PAUSED_CLAIM";
  state: string;
  priority: "CRITICAL" | "HIGH" | "NORMAL";
  owner: "CLIENT_ADMIN";
  deadline: Date | null;
  nextAction: string;
  lifecycle: "FULL_KB_CORRECTION" | "KB_WHEN_PROPOSED" | "RECONFIRM_OR_CORRECT";
  occurrenceCount: number;
};

type FlagInput = { id: string; status: string; acknowledgedAt?: Date | null; acknowledgeDueAt: Date; resolveDueAt: Date };
type GapInput = { id: string; status: string; occurrenceCount: number; lastAskedAt: Date };
type EntryInput = { id: string; status: string; conflictStatus?: string | null; expiresAt?: Date | null };

export function buildImprovementRoutes(input: { flags: FlagInput[]; gaps: GapInput[]; entries: EntryInput[]; now?: Date }) {
  const now = input.now || new Date();
  const routes: ImprovementRoute[] = [];
  for (const flag of input.flags.filter((item) => ["OPEN", "ACKNOWLEDGED"].includes(item.status))) {
    const resolutionOverdue = flag.resolveDueAt <= now;
    const acknowledgmentOverdue = !flag.acknowledgedAt && flag.acknowledgeDueAt <= now;
    routes.push({ id: `flag:${flag.id}`, trigger: "INCORRECT_FACT_FLAG", state: resolutionOverdue ? "RESOLUTION_OVERDUE" : acknowledgmentOverdue ? "ACKNOWLEDGMENT_OVERDUE" : flag.status, priority: resolutionOverdue || acknowledgmentOverdue ? "CRITICAL" : "HIGH", owner: "CLIENT_ADMIN", deadline: resolutionOverdue || flag.acknowledgedAt ? flag.resolveDueAt : flag.acknowledgeDueAt, nextAction: flag.acknowledgedAt ? "Correct or reconfirm the paused claim, complete preview approval, then resolve the flag." : "Acknowledge the flag; keep the affected claim paused while it is verified.", lifecycle: "FULL_KB_CORRECTION", occurrenceCount: 1 });
  }
  for (const entry of input.entries) {
    if (entry.conflictStatus === "UNRESOLVED" || entry.status === "CONFLICT") routes.push({ id: `entry:${entry.id}:conflict`, trigger: "CONFLICT", state: "SUPPRESSED", priority: "CRITICAL", owner: "CLIENT_ADMIN", deadline: null, nextAction: "Select the superseded version and complete field and preview approval.", lifecycle: "FULL_KB_CORRECTION", occurrenceCount: 1 });
    else if (entry.status === "EXPIRED") routes.push({ id: `entry:${entry.id}:expired`, trigger: "EXPIRED_CLAIM", state: "REMOVED_FROM_RETRIEVAL", priority: "HIGH", owner: "CLIENT_ADMIN", deadline: entry.expiresAt || null, nextAction: "Reconfirm unchanged truth or publish a corrected version through the full lifecycle.", lifecycle: "RECONFIRM_OR_CORRECT", occurrenceCount: 1 });
    else if (entry.status === "PAUSED") routes.push({ id: `entry:${entry.id}:paused`, trigger: "PAUSED_CLAIM", state: "PAUSED", priority: "HIGH", owner: "CLIENT_ADMIN", deadline: null, nextAction: "Review the source and publish an authorised corrected or reconfirmed version.", lifecycle: "FULL_KB_CORRECTION", occurrenceCount: 1 });
  }
  for (const gap of input.gaps.filter((item) => item.status === "OPEN")) routes.push({ id: `gap:${gap.id}`, trigger: "KNOWLEDGE_GAP", state: "AWAITING_APPROVED_ANSWER", priority: gap.occurrenceCount >= 3 ? "HIGH" : "NORMAL", owner: "CLIENT_ADMIN", deadline: null, nextAction: "Draft an atomic answer and complete verification, sign-off, preview and publication.", lifecycle: "KB_WHEN_PROPOSED", occurrenceCount: gap.occurrenceCount });
  const rank = { CRITICAL: 0, HIGH: 1, NORMAL: 2 } as const;
  return routes.sort((left, right) => rank[left.priority] - rank[right.priority] || (left.deadline?.getTime() || Number.MAX_SAFE_INTEGER) - (right.deadline?.getTime() || Number.MAX_SAFE_INTEGER) || right.occurrenceCount - left.occurrenceCount);
}
