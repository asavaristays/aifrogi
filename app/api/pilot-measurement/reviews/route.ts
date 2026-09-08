import {NextResponse} from 'next/server';
import {getCurrentUser} from '@/lib/auth-server';
import {getDb} from '@/lib/db';
import {resolveClientWorkspaceAccess} from '@/lib/client-access';
import {parsePilotReview, PILOT_REVIEW_ACTION} from '@/lib/sovereign-intelligence/pilot-review';
import {isPilotReviewOriginAllowed} from '@/lib/sovereign-intelligence/pilot-origin';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  let propertyId: string | undefined;
  if (user?.role !== 'admin') {
    const access = await resolveClientWorkspaceAccess();
    if (!access.ok) return NextResponse.json({error: 'Workspace access required'}, {status: 403});
    propertyId = access.propertyId;
  }
  const db = getDb();
  if (!db) return NextResponse.json({error: 'Review storage unavailable'}, {status: 503});
  try {
    const property = propertyId ? await db.property.findUnique({where: {id: propertyId}, select: {organizationId: true}}) : null;
    if (propertyId && !property?.organizationId) return NextResponse.json({error: 'Workspace unavailable'}, {status: 403});
    const events = await db.onboardingActivity.findMany({where: {action: PILOT_REVIEW_ACTION,
      ...(property ? {organizationId: property.organizationId!} : {})}, orderBy: [{createdAt: 'desc'}, {id: 'desc'}], take: 1001});
    const reviews = events.slice(0, 1000).flatMap(event => {
      let value: unknown;
      try { value = JSON.parse(event.detail || 'null'); } catch { return []; }
      const review = parsePilotReview(value);
      if (!review || (propertyId && review.propertyId !== propertyId)) return [];
      // Client exports exclude reviewer identity and free-text rationale.
      return [{reviewId: event.id, recordedAt: event.createdAt, evidenceId: review.evidenceId,
        propertyId: review.propertyId, cohort: review.cohort, outcome: review.outcome}];
    });
    return NextResponse.json({reviews, truncated: events.length > 1000, certified: false,
      note: 'Append-only review history, newest first. Revisions are not independent samples.'}, {headers: {'Cache-Control': 'private, no-store'}});
  } catch { return NextResponse.json({error: 'Review storage unavailable'}, {status: 503}); }
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== 'admin') return NextResponse.json({error: 'Administrator review required'}, {status: 403});
  if (!isPilotReviewOriginAllowed(request.headers.get('origin'), request.url, process.env.NODE_ENV === 'production', process.env.AIFROGI_APP_URL))
    return NextResponse.json({error: 'Same-origin request required'}, {status: 403});
  const review = parsePilotReview(await request.json().catch(() => null));
  if (!review) return NextResponse.json({error: 'Provide evidence, cohort, outcome and a 20–2000 character review rationale. Do not include personal information.'}, {status: 400});
  const db = getDb();
  if (!db) return NextResponse.json({error: 'Review storage unavailable'}, {status: 503});
  try {
    const evidence = await db.sovereignAnswerEvidence.findFirst({where: {id: review.evidenceId, propertyId: review.propertyId},
      select: {model: true, property: {select: {organizationId: true, organization: {select: {isDemo: true}}}}}});
    if (!evidence?.property.organizationId) return NextResponse.json({error: 'Evidence not found'}, {status: 404});
    if (review.cohort === 'REAL' && (evidence.property.organization?.isDemo || evidence.model === 'AIFROGI_DEMO_MOCK_CONNECTOR'))
      return NextResponse.json({error: 'Known synthetic evidence cannot be classified as real'}, {status: 409});
    const saved = await db.onboardingActivity.create({data: {organizationId: evidence.property.organizationId,
      actorEmail: user.username, action: PILOT_REVIEW_ACTION, detail: JSON.stringify(review)}, select: {id: true, createdAt: true}});
    return NextResponse.json({reviewId: saved.id, recordedAt: saved.createdAt, certified: false}, {headers: {'Cache-Control': 'private, no-store'}});
  } catch { return NextResponse.json({error: 'Review could not be saved'}, {status: 503}); }
}
