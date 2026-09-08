import {getDb} from '@/lib/db';
import {measurePilot} from '@/lib/sovereign-intelligence/pilot-measurement';
import {latestPilotReviews, PILOT_REVIEW_ACTION} from '@/lib/sovereign-intelligence/pilot-review';
export async function getPilotMeasurement(propertyId?:string){
 const db=getDb();if(!db)throw new Error('Measurement database unavailable');
 const to=new Date(),from=new Date(to.getTime()-30*86400000);
 const where={...(propertyId?{propertyId}:{}),createdAt:{gte:from,lte:to}};
 const result=await db.$transaction(async tx=>{
   const total=await tx.sovereignAnswerEvidence.count({where});
   const rows=await tx.sovereignAnswerEvidence.findMany({where,orderBy:[{createdAt:'desc'},{id:'desc'}],take:10000,select:{id:true,propertyId:true,personaCategory:true,sessionIdHash:true,model:true,grounded:true,safeResolution:true,observedBehavior:true,decisionConsistent:true,disposition:true,nearMissClaimIds:true,feedback:{select:{helpful:true,propertyId:true}},property:{select:{slug:true,organizationId:true,organization:{select:{isDemo:true}}}}}});
   const organizationIds=[...new Set(rows.flatMap(r=>r.property.organizationId?[r.property.organizationId]:[]))];
   const events=organizationIds.length?await tx.onboardingActivity.findMany({where:{organizationId:{in:organizationIds},action:PILOT_REVIEW_ACTION,createdAt:{lte:to}},orderBy:[{createdAt:'desc'},{id:'desc'}],take:10001}):[];
   return {total,rows,events};
 },{isolationLevel:'RepeatableRead'});
 const {total,rows,events}=result;
 const reviewsTruncated=events.length>10000;
 const latest=latestPilotReviews(reviewsTruncated?[]:events);
 const measured=rows.map(row=>{const review=latest.get(row.propertyId+':'+row.id);return {...row,review:review?.organizationId===row.property.organizationId?review:undefined};});
 return {version:'5A-1.1',from:from.toISOString(),to:to.toISOString(),totalEvidence:total,sampledEvidence:rows.length,truncated:total>rows.length,reviewsTruncated,groups:measurePilot(measured),accuracyStatus:'NOT CERTIFIED: reviewed-answer sample statistics are not real-world accuracy or weighted SRR',limitations:['Known demo tenants and mock-model records remain synthetic regardless of review.','Other evidence is unclassified until an administrator records its origin; classification applies only to that answer.','Only the latest review per answer counts. Unresolved reviews are excluded from the correctness denominator and shown separately.','Helpful votes and automated safe-resolution flags do not establish correctness.','A reviewed sample may be small or biased; it never grants launch approval or accuracy certification.','If review history is truncated, review-based metrics are withheld rather than partially projected.','Guided demo clicks do not generate answer evidence and are not included.','No transcripts, patient information, reviewer identities or visitor identifiers are exported.']};
}
