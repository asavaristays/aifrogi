import { NextResponse } from 'next/server';
import { resolveClientWorkspaceAccess } from '@/lib/client-access';
import { getCurrentWorkspaceSlug } from '@/lib/workspace';
import { getDb } from '@/lib/db';
import { isPilotReviewOriginAllowed } from '@/lib/sovereign-intelligence/pilot-origin';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
async function access() {
  return resolveClientWorkspaceAccess({propertySlug: await getCurrentWorkspaceSlug()});
}
export async function GET() {
  const a = await access();
  if (!a.ok) return NextResponse.json({error:a.error},{status:a.status,headers});
  const db = getDb();
  if (!db) return NextResponse.json({error:'Inbox unavailable'},{status:503,headers});
  const checkedAt = new Date();
  const action = `TEAM_INBOX_SEEN:${a.propertyId}`;
  const seen = await db.onboardingActivity.findFirst({where:{organizationId:a.organization.id,actorEmail:a.user.username,action},orderBy:{detail:'desc'},select:{detail:true}});
  const since = seen?.detail && Number.isFinite(Date.parse(seen.detail)) ? new Date(seen.detail) : new Date(0);
  const [unread, needsHuman] = await Promise.all([
    db.leadMessage.count({where:{sender:'GUEST',createdAt:{gt:since,lte:checkedAt},lead:{propertyId:a.propertyId,websiteSession:{isNot:null}}}}),
    db.websiteVisitorSession.count({where:{propertyId:a.propertyId,status:'HUMAN_REQUESTED',revokedAt:null}}),
  ]);
  return NextResponse.json({unread,needsHuman,checkedAt:checkedAt.toISOString()}, {headers});
}
export async function POST(request: Request) {
  if (!isPilotReviewOriginAllowed(request.headers.get('origin'),request.url,process.env.NODE_ENV==='production',process.env.AIFROGI_APP_URL)) return NextResponse.json({error:'Same-origin request required'},{status:403,headers});
  const a = await access();
  if (!a.ok) return NextResponse.json({error:a.error},{status:a.status,headers});
  const body = await request.json().catch(()=>null);
  const time = typeof body?.checkedAt === 'string' ? Date.parse(body.checkedAt) : NaN;
  if (!Number.isFinite(time) || time > Date.now() || time < Date.now()-300000) return NextResponse.json({error:'Refresh the inbox before marking reviewed'},{status:400,headers});
  const db = getDb();
  if (!db) return NextResponse.json({error:'Inbox unavailable'},{status:503,headers});
  await db.onboardingActivity.create({data:{organizationId:a.organization.id,actorEmail:a.user.username,action:`TEAM_INBOX_SEEN:${a.propertyId}`,detail:new Date(time).toISOString()}});
  return NextResponse.json({ok:true},{headers});
}
