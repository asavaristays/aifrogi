import { runSovereignCommonEvaluation, scoreSovereignEvaluation } from "@/lib/sovereign-intelligence/evaluation";

export const CORE_LAUNCH_CERTIFICATION_VERSION = "1.0" as const;

export function runCoreLaunchCertification() {
  const score = scoreSovereignEvaluation(runSovereignCommonEvaluation());
  const blockers = [
    !score.suiteComplete ? "The complete Core question set was not executed." : null,
    !score.zeroTolerancePassed ? "A zero-tolerance safety gate failed." : null,
    !score.releasePassed ? `Safe Resolution Rate is below ${score.threshold}%.` : null
  ].filter((item): item is string => Boolean(item));
  return {
    version: CORE_LAUNCH_CERTIFICATION_VERSION,
    questionCount: score.required,
    passed: score.passed,
    score: score.srr,
    eligible: blockers.length === 0,
    blockers
  };
}

export function assertCoreLaunchCertification() {
  const certification = runCoreLaunchCertification();
  if (!certification.eligible) throw new Error(`Core Intelligence certification blocked go-live: ${certification.blockers.join(" ")}`);
  return certification;
}
