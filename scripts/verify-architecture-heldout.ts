import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {registerTrialOrganization} from '../lib/repositories/trial-registration-repository';
import {activateInvitation} from '../lib/repositories/team-repository';
import {withDatabaseIdentity,getBootstrapDb} from '../lib/db';
import {withTenantPropertyDatabaseContext} from '../lib/security/tenant-database-context';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {createAtomicClaim,fieldApproveClaim,generateClaimPreview,reviewClaimPreview} from '../lib/repositories/knowledge-verification-repository';
import {activateReviewedRagKnowledge} from '../lib/rag-owner-publication';
import {indexPublishedRagClaims} from '../lib/rag-claim-index';
import {ownerAnswerPreview} from '../lib/services/owner-answer-preview';
async function main(){
 assert.match(process.env.DATABASE_URL||'',/@127\.0\.0\.1:\d+\/p2b_rehearsal_business$/);
 const dir=process.env.BUSINESS_TEST_ARTIFACT_DIR!;
 const bank=JSON.parse(await readFile(`${dir}/heldout-frozen-bank.json`,'utf8')) as Array<{name:string;domain:string;facts:string[][];cases:Array<{q:string;must:string[];forbid:string[]}>}>;
 const results:Array<Record<string,unknown>>=[];
 initializeCanonicalRoleClients();
 try{for(const business of bank){
  let scope={organizationId:'',propertyId:'',actor:`owner-${Date.now()}@${business.domain}`};let slug='';
  await withDatabaseIdentity({organizationId:'',platformAuthority:true,actor:'synthetic-heldout-registration',systemPurpose:'test'},async()=>{
   const reg=await registerTrialOrganization({companyName:business.name,ownerName:'Synthetic Owner',ownerEmail:scope.actor,website:`https://${business.domain}`,industry:'Services',country:'India',timezone:'Asia/Kolkata',botCategory:'BUSINESS_AI'});
   scope={...scope,organizationId:reg.organizationId,propertyId:reg.propertyId};const member=await activateInvitation(reg.token,'Synthetic-heldout-test-2026!');slug=member.installation!.propertySlug;
  });
  for(const [question,answer,category] of business.facts)await withTenantPropertyDatabaseContext(scope,async()=>{
   const claim=await createAtomicClaim({propertyId:scope.propertyId,question,answer,category,createdBy:scope.actor});
   await fieldApproveClaim({propertyId:scope.propertyId,entryId:claim.id,actorEmail:scope.actor});
   const preview=await generateClaimPreview({propertyId:scope.propertyId,entryId:claim.id});await reviewClaimPreview({propertyId:scope.propertyId,previewId:preview.id,actorEmail:scope.actor,approve:true});
  });
  await activateReviewedRagKnowledge(scope);
  const identity={organizationId:scope.organizationId,propertyId:scope.propertyId,principal:`public-bot:${slug}`,purpose:'PUBLIC_ANSWER'};
  await indexPublishedRagClaims({...identity,principal:`rag-indexer:${scope.propertyId}`,purpose:'KNOWLEDGE_INDEX'});
  for(const item of business.cases){
   const result=await ownerAnswerPreview(scope,item.q);const failures:string[]=[];
   if(result.disposition==='TECHNICAL_FAILURE'||result.coverage?.status==='ENGINE_FAILURE')failures.push(result.failureCode||result.coverage?.failureCode||'ENGINE_FAILURE');
   for(const pattern of item.must)if(!new RegExp(pattern,'i').test(result.answer))failures.push(`missing ${pattern}`);
   for(const pattern of item.forbid)if(new RegExp(pattern,'i').test(result.factualClaims.join(' ')))failures.push(`forbidden ${pattern}`);
   results.push({business:business.name,question:item.q,passed:!failures.length,failures,...result});console.log(failures.length?'FAIL':'PASS',business.name,JSON.stringify(item.q),result.disposition,JSON.stringify(result.answer),failures);
  }
 }}finally{await writeFile(`${dir}/heldout-results.json`,JSON.stringify({scope:'Two unseen synthetic BUSINESS_AI tenants; real registration, owner publication, embeddings, canonical retrieval and model answering; FORM sources only; separate from full source/fleet qualification',results},null,2));await getBootstrapDb()?.$disconnect();await disconnectCanonicalRoleClients();}
 if(results.some(r=>!r.passed))process.exitCode=1;
}
main().catch(e=>{console.error(e);process.exitCode=1;});
