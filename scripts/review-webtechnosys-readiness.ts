import {getDb} from '../lib/db';
import {anonymizeReplayText} from '../lib/sovereign-intelligence/evidence-pipeline';
const db=getDb();if(!db)throw Error('Database unavailable');
async function main(){
 const property=await db!.property.findUnique({where:{slug:'webtechnosys-ai-agency-e5da22'},select:{id:true,slug:true,organization:{select:{status:true,botProfile:{select:{status:true,installationDetectedAt:true}},botConnectors:{select:{name:true,required:true,enabled:true,lifecycle:true}}}}}});if(!property)throw Error('Exact workspace missing');
 const claims=await db!.knowledgeEntry.findMany({where:{propertyId:property.id},select:{id:true,question:true,answer:true,status:true,category:true,fieldApprovedAt:true,previewApprovedAt:true,expiresAt:true,conflictStatus:true}});
 const gaps=await db!.knowledgeGap.findMany({where:{propertyId:property.id,status:'OPEN'},select:{id:true,question:true,occurrenceCount:true,resolutionEntryId:true}});
 const feedback=await db!.sovereignAnswerFeedback.findMany({where:{propertyId:property.id,helpful:false},select:{id:true,reason:true,evidence:{select:{id:true,question:true,answer:true,createdAt:true,disposition:true,usedClaimIds:true}}},take:20});
 console.log(JSON.stringify({at:new Date().toISOString(),property,claims,gaps:gaps.map(g=>({...g,question:anonymizeReplayText(g.question)})),negativeFeedback:feedback.map(f=>({...f,reason:anonymizeReplayText(f.reason||''),evidence:{...f.evidence,question:anonymizeReplayText(f.evidence.question),answer:anonymizeReplayText(f.evidence.answer)}}))},null,2));
}
main().catch(()=>{console.error('Read-only readiness review failed');process.exitCode=1;}).finally(async()=>{await db!.$disconnect();}).then(()=>process.stdout.write('Read-only review complete\n',()=>process.exit(process.exitCode||0))).catch(()=>process.exit(1));
