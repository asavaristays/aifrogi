export const PILOT_REVIEW_ACTION = 'PILOT_EVIDENCE_REVIEW_V1';
export type PilotReview = {
  version: 1;
  evidenceId: string;
  propertyId: string;
  cohort: 'REAL' | 'SYNTHETIC' | 'UNCLASSIFIED';
  outcome: 'CORRECT' | 'GROUNDED_WRONG' | 'UNGROUNDED' | 'UNSAFE' | 'UNRESOLVED';
  rationale: string;
};

// Actor, organization and timestamp are supplied by the authenticated server,
// never accepted from the caller. This is an assessment, not certification.
export function parsePilotReview(value: unknown): PilotReview | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (v.version !== 1 || typeof v.evidenceId !== 'string' || !v.evidenceId.trim() || v.evidenceId.length > 128 ||
      typeof v.propertyId !== 'string' || !v.propertyId.trim() || v.propertyId.length > 128 ||
      typeof v.cohort !== 'string' || !['REAL', 'SYNTHETIC', 'UNCLASSIFIED'].includes(v.cohort) ||
      typeof v.outcome !== 'string' || !['CORRECT', 'GROUNDED_WRONG', 'UNGROUNDED', 'UNSAFE', 'UNRESOLVED'].includes(v.outcome) ||
      typeof v.rationale !== 'string' || v.rationale.trim().length < 20 || v.rationale.length > 2000) return null;
  return {version: 1, evidenceId: v.evidenceId, propertyId: v.propertyId,
    cohort: v.cohort as PilotReview['cohort'], outcome: v.outcome as PilotReview['outcome'], rationale: v.rationale.trim()};
}

export type ReviewEvent = {id: string; organizationId: string; actorEmail: string | null; createdAt: Date; detail: string | null};
export function latestPilotReviews(events: ReviewEvent[]) {
  const latest = new Map<string, PilotReview & {reviewId: string; recordedAt: string; organizationId: string}>();
  for (const event of [...events].sort((a,b) => b.createdAt.getTime()-a.createdAt.getTime() || b.id.localeCompare(a.id))) {
    if (!event.actorEmail) continue;
    let data: unknown;
    try { data = JSON.parse(event.detail || 'null'); } catch { continue; }
    const review = parsePilotReview(data);
    if (!review) continue;
    const key = `${review.propertyId}:${review.evidenceId}`;
    if (!latest.has(key)) latest.set(key, {...review, reviewId: event.id, recordedAt: event.createdAt.toISOString(), organizationId: event.organizationId});
  }
  return latest;
}
