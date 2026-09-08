import {NextResponse} from 'next/server';
import {getCurrentUser} from '@/lib/auth-server';
import {getDb} from '@/lib/db';
import {latestPilotReviews, PILOT_REVIEW_ACTION} from '@/lib/sovereign-intelligence/pilot-review';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
export async function GET(request:Request){
 const user=await getCurrentUser();
 if(user?.role!=='admin')return NextResponse.json({error:'Administrator review required'},{status:403,headers});
 const db=getDb();if(!db)return NextResponse.json({error:'Review queue unavailable'},{status:503,headers});
 const params=new URL(request.url).searchParams;
 const evidenceId=params.get('evidenceId'),propertyId=params.get('propertyId'),cursor=params.get('cursor');
 if([evidenceId,propertyId,cursor].some(v=>v!==null&&(!v.trim()||v.length>128)))return NextResponse.json({error:'Invalid selection'},{status:400,headers});
 try{
  const rows=await db.sovereignAnswerEvidence.findMany({where:{...(evidenceId?{id:evidenceId}:{}),...(propertyId?{propertyId}: {})},
   orderBy:[{createdAt:'desc'},{id:'desc'}],...(cursor&&!evidenceId?{cursor:{id:cursor},skip:1}:{}),take:evidenceId?1:26,
   select:{id:true,propertyId:true,question:true,answer:true,disposition:true,personaCategory:true,createdAt:true,model:true,grounded:true,sources:true,usedClaimIds:true,feedback:{select:{helpful:true}},property:{select:{name:true,slug:true,organizationId:true,organization:{select:{isDemo:true}}}}}});
  const page=rows.slice(0,25),orgs=[...new Set(page.flatMap(r=>r.property.organizationId?[r.property.organizationId]:[]))];
  const events=orgs.length?await db.onboardingActivity.findMany({where:{organizationId:{in:orgs},action:PILOT_REVIEW_ACTION},orderBy:[{createdAt:'desc'},{id:'desc'}],take:10001}):[];
  const reviewsTruncated=events.length>10000,latest=latestPilotReviews(reviewsTruncated?[]:events);
  return NextResponse.json({items:page.map(row=>{const review=latest.get(row.propertyId+':'+row.id);return {...row,
   knownSynthetic:Boolean(row.property.organization?.isDemo||row.model==='AIFROGI_DEMO_MOCK_CONNECTOR'),
   latestReview:review?.organizationId===row.property.organizationId?review:null};}),reviewsTruncated,nextCursor:rows.length>25?page[24].id:null},{headers});
 }catch{return NextResponse.json({error:'Review queue unavailable; please retry'},{status:503,headers});}
}
