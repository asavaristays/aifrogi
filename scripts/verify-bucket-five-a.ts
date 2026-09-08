// Authorized operational QA only. Credentials stay in process memory. Synthetic
// visitor evidence is retained and labeled; short-lived staff test sessions revoked.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {getDb} from '../lib/db';
import {createSessionToken} from '../lib/auth';
import {recordUserSession} from '../lib/session-registry';
import {PILOT_REVIEW_ACTION} from '../lib/sovereign-intelligence/pilot-review';
const base=process.env.AIFROGI_5A_QA_URL;
if(!base||!['http://127.0.0.1:3115','http://127.0.0.1:3011','https://app.aifrogi.com'].includes(base))throw Error('Approved QA target required');
if(process.env.AIFROGI_5A_QA_CONFIRM!=='synthetic-demo-evidence-only')throw Error('QA confirmation required');
const db=getDb();if(!db)throw Error('Database unavailable');
const sessions:string[]=[],checks:string[]=[],evidenceIds:string[]=[];
const tag='QA-5A-'+randomUUID();
function pass(name:string){checks.push(name);console.log(JSON.stringify({check:name,passed:true}));}
async function session(email:string,role:'admin'|'hotel_owner'){
 const sessionId=randomUUID(),expiresAt=new Date(Date.now()+10*60000);sessions.push(sessionId);
 await recordUserSession({sessionId,email,role,authSource:'local',expiresAt,userAgent:tag});
 return 'leados_session='+await createSessionToken({username:email,role,label:'Synthetic 5A acceptance',sessionId,authSource:'local',expiresAt:expiresAt.getTime()});
}
async function call(path:string,cookie?:string,body?:unknown,origin:string|null='https://app.aifrogi.com',bearer?:string){
 const r=await fetch(base+path,{method:body===undefined?'GET':'POST',redirect:'manual',signal:AbortSignal.timeout(45000),headers:{...(cookie?{cookie}:{}),...(body===undefined?{}:{'Content-Type':'application/json'}),...(origin?{origin}:{}),...(bearer?{Authorization:'Bearer '+bearer}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await r.json().catch(()=>null);return {status:r.status,data,cache:r.headers.get('cache-control')};
}
async function main(){
 const client=await db!.property.findUnique({where:{slug:'webtechnosys-ai-agency-e5da22'},select:{id:true,organizationId:true}});
 assert.ok(client?.organizationId,'Reference workspace required');
 const member=await db!.organizationMember.findFirst({where:{organizationId:client.organizationId,status:'ACTIVE'},select:{email:true}});assert.ok(member);
 const demo=await db!.property.findUnique({where:{slug:'showcase-clinicgpt'},select:{id:true,organizationId:true,organization:{select:{isDemo:true}}}});
 assert.ok(demo?.organization?.isDemo&&demo.organizationId,'Only a known demo may receive QA reviews');
 const admin=await session('info@aifrogi.com','admin'),owner=await session(member.email,'hotel_owner');
 for(const path of ['/api/pilot-measurement','/api/pilot-measurement/reviews','/api/pilot-measurement/review-queue'])assert.equal((await call(path)).status,401);
 pass('Anonymous access rejected on all measurement endpoints');
 const scoped=await call('/api/pilot-measurement?propertyId='+demo.id,owner);assert.equal(scoped.status,200);assert.ok(scoped.data.groups.every((g:{propertyId:string})=>g.propertyId===client.id));assert.match(scoped.cache||'',/no-store/);
 pass('Client report ignores foreign property override and is no-store');
 assert.equal((await call('/api/pilot-measurement/review-queue',owner)).status,403);pass('Client cannot access cross-tenant reviewer queue');
 const turn=await call('/api/public/website-bot/showcase-clinicgpt',undefined,{message:'Show available appointments',sessionId:tag+'-a'});
 assert.equal(turn.status,200);assert.ok(turn.data.answerEvidenceId&&turn.data.visitorToken);evidenceIds.push(turn.data.answerEvidenceId);
 const id=turn.data.answerEvidenceId;
 const input={version:1,evidenceId:id,propertyId:demo.id,cohort:'SYNTHETIC',outcome:'UNRESOLVED',rationale:tag+' synthetic persistence acceptance only; no factual correctness judgment or real-client provenance asserted.'};
 assert.equal((await call('/api/pilot-measurement/reviews',owner,input)).status,403);pass('Client review write rejected');
 for(const origin of [null,'https://untrusted.example'])assert.equal((await call('/api/pilot-measurement/reviews',admin,input,origin)).status,403);
 pass('Missing and foreign origins rejected');
 assert.equal((await call('/api/pilot-measurement/reviews',admin,{...input,propertyId:client.id})).status,404);pass('Evidence/property mismatch rejected');
 assert.equal((await call('/api/pilot-measurement/reviews',admin,{...input,cohort:'REAL'})).status,409);pass('Synthetic evidence cannot be relabeled real');
 assert.equal((await call('/api/pilot-measurement/reviews',admin,{...input,rationale:'ok'})).status,400);pass('Incomplete assessment rejected');
 const saved=await call('/api/pilot-measurement/reviews',admin,input);assert.equal(saved.status,200);assert.ok(saved.data.reviewId);
 const event=await db!.onboardingActivity.findUnique({where:{id:saved.data.reviewId}});assert.equal(event?.actorEmail,'info@aifrogi.com');assert.equal(event?.organizationId,demo.organizationId);assert.equal(event?.action,PILOT_REVIEW_ACTION);
 const revision=await call('/api/pilot-measurement/reviews',admin,{...input,rationale:input.rationale+' Read-back revision.'});assert.equal(revision.status,200);
 const queue=await call('/api/pilot-measurement/review-queue?evidenceId='+id,admin);assert.equal(queue.status,200);assert.equal(queue.data.items[0].latestReview.reviewId,revision.data.reviewId);assert.match(queue.cache||'',/no-store/);
 assert.ok(await db!.onboardingActivity.findUnique({where:{id:saved.data.reviewId}}));pass('Append-only review revisions saved with server actor and latest-review read-back');
 const ownHistory=await call('/api/pilot-measurement/reviews?propertyId='+demo.id,owner);assert.equal(ownHistory.status,200);assert.ok(ownHistory.data.reviews.every((r:{propertyId:string})=>r.propertyId===client.id));assert.ok(!JSON.stringify(ownHistory.data).includes(id));pass('Review history isolates client from demo assessments');
 const feedbackPath='/api/public/website-bot/showcase-clinicgpt/feedback';
 assert.equal((await call(feedbackPath,undefined,{evidenceId:id,helpful:false})).status,401);pass('Unsigned visitor feedback rejected');
 const visitorB=await call('/api/public/website-bot/showcase-clinicgpt',undefined,{message:'Show available appointments',sessionId:tag+'-b'});assert.equal(visitorB.status,200);evidenceIds.push(visitorB.data.answerEvidenceId);
 assert.equal((await call(feedbackPath,undefined,{evidenceId:id,helpful:false},'https://app.aifrogi.com',visitorB.data.visitorToken)).status,404);pass('Different visitor cannot rate another conversation');
 assert.equal((await call('/api/public/website-bot/showcase-hotelgpt/feedback',undefined,{evidenceId:id,helpful:false},'https://app.aifrogi.com',turn.data.visitorToken)).status,401);pass('Cross-tenant visitor token rejected');
 for(let i=0;i<2;i++)assert.equal((await call(feedbackPath,undefined,{evidenceId:id,helpful:false,reason:tag+' synthetic feedback acceptance'},'https://app.aifrogi.com',turn.data.visitorToken)).status,200);
 assert.equal(await db!.sovereignAnswerFeedback.count({where:{evidenceId:id}}),1);assert.equal(await db!.sovereignReplayCase.count({where:{sourceEvidenceId:id}}),1);
 const negative=await db!.sovereignAnswerEvidence.findUnique({where:{id},select:{safeResolution:true,feedback:{select:{helpful:true}}}});assert.equal(negative?.safeResolution,false);assert.equal(negative?.feedback?.helpful,false);pass('Negative feedback persisted once and queued once for review');
 assert.equal((await call(feedbackPath,undefined,{evidenceId:id,helpful:true},'https://app.aifrogi.com',turn.data.visitorToken)).status,200);
 const positive=await db!.sovereignAnswerEvidence.findUnique({where:{id},select:{safeResolution:true,feedback:{select:{helpful:true}}}});assert.equal(positive?.feedback?.helpful,true);assert.equal(positive?.safeResolution,false);pass('Positive vote updates helpfulness without silently certifying prior negative evidence');
 const report=await call('/api/pilot-measurement',admin);assert.equal(report.status,200);assert.equal(report.data.version,'5A-1.1');const group=report.data.groups.find((g:{propertyId:string;cohort:string})=>g.propertyId===demo.id&&g.cohort==='SYNTHETIC');assert.ok(group.reviewedAnswers>=1);assert.equal(group.humanReviewedAccuracy,null);assert.equal(group.certified,false);pass('Report projects saved synthetic assessment without issuing real accuracy');
 const page=await fetch(base+'/admin/sovereign-intelligence/reviews',{headers:{cookie:admin},signal:AbortSignal.timeout(30000)});assert.equal(page.status,200);assert.match(await page.text(),/Review bot answers/);pass('Authenticated reviewer page renders');
 console.log(JSON.stringify({suite:'Bucket 5A authenticated HTTP acceptance',passed:checks.length,tag,evidenceIds,provenance:'Synthetic demo requests; short-lived registered QA staff sessions, not password-login or human pilot acceptance'}));
}
main().catch(error=>{console.error(JSON.stringify({failed:true,message:error instanceof Error?error.message:'QA failed',checksPassed:checks.length}));process.exitCode=1;}).finally(async()=>{
 await db!.userSession.updateMany({where:{sessionId:{in:sessions}},data:{revokedAt:new Date(),revokedBy:tag}});
 console.log(JSON.stringify({qaSessionsRevoked:true,count:sessions.length}));
 await db!.$disconnect();
 console.log(JSON.stringify({qaDatabaseDisconnected:true}));
}).then(()=>{
 // End this one-shot operational runner explicitly after all checks, session
 // revocation and DB disconnect. Preserve failures; never accept a signal exit.
 process.stdout.write(JSON.stringify({qaRunnerComplete:true,exitCode:process.exitCode||0})+'\n',()=>process.exit(process.exitCode||0));
}).catch(()=>{console.error('QA cleanup failed');process.exit(1);});
