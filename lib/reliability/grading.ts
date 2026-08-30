export const RELIABILITY_GRADING_VERSION = "1.0" as const;

export const RELIABILITY_SECTION_7 = [
  { id: "R7-01", blocker: true, control: "Failure isolation remains tenant-bound under degradation.", evidence: "Cross-tenant failure-injection test and tenant-scoped event records." },
  { id: "R7-02", blocker: true, control: "Every material write is idempotent and read-back verified.", evidence: "Duplicate-write fixture with one authoritative result." },
  { id: "R7-03", blocker: true, control: "A failed write never produces a success claim.", evidence: "Connector timeout and failed read-back transcripts." },
  { id: "R7-04", blocker: false, control: "Model calls have bounded timeout, retry and validated fallback.", evidence: "Timeout, retry, malformed-output and fallback-model test logs." },
  { id: "R7-05", blocker: false, control: "Every governed turn records failure layer, latency and escalation tier.", evidence: "Production evidence export with non-null reliability fields." },
  { id: "R7-06", blocker: false, control: "Tier 3 support-call rate is measured rather than asserted.", evidence: "Non-zero production conversation sample and recomputable rate." },
  { id: "R7-07", blocker: false, control: "Canary and chaos exercises prove graceful degradation.", evidence: "Dated exercise record, alerts, recovery evidence and retained regression." }
] as const;

export function gradeReliabilitySection(evidence: Record<string, boolean>) {
  const results = RELIABILITY_SECTION_7.map((item) => ({ ...item, passed: evidence[item.id] === true }));
  const blockersPassed = results.filter((item) => item.blocker).every((item) => item.passed);
  const complete = results.every((item) => item.passed);
  return { version: RELIABILITY_GRADING_VERSION, results, blockersPassed, complete, certification: complete && blockersPassed ? "ELIGIBLE" as const : "BLOCKED" as const };
}
