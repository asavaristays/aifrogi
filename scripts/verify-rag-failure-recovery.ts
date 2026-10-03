import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {answerFromSharedKnowledge} from '../lib/shared-answer-runtime';
import {recordDeliveredRagAnswer} from '../lib/rag-answer-delivery';
async function main(){
 if(process.env.RAG_ISOLATED_TEST!=='true'||!process.env.AIFROGI_PUBLIC_DATABASE_URL?.endsWith('/rag_candidate'))throw Error('ISOLATED_TEST_DATABASE_REQUIRED');
 initializeCanonicalRoleClients();const transport=globalThis.fetch;const results=[];
 const identity={organizationId:'delivery-org',propertyId:'delivery-property',principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'};
 try{
  for(const fault of ['generation','verification']){
   let generationCalls=0,verificationCalls=0;
   globalThis.fetch=async(input,init)=>{
    if(String(input)==='https://api.openai.com/v1/responses'){
     const body=JSON.parse(String(init?.body));const review=body.text?.format?.name==='business_support_batch_v1';
     if(review)verificationCalls++;else generationCalls++;
     if(fault==='generation'||review)return Response.json({error:{message:'Isolated test outage'}},{status:503});
    }
    return transport(input,init);
   };
   const question='Which applications can you develop?';const proof=await answerFromSharedKnowledge(identity,question);
   assert.equal(proof.disposition,'PARTIAL');assert.deepEqual(proof.factualClaims,['Phone: +91 74105 82898']);assert.equal(generationCalls,1);assert.equal(verificationCalls,fault==='generation'?0:1);
   const start=Date.now();const receipt=await recordDeliveredRagAnswer({identity:{...identity,purpose:'PUBLIC_GUEST',guestSessionHash:'rag-candidate-gate'},conversationId:'delivery-conversation',sessionHash:'rag-candidate-gate',expiresAt:new Date(Date.now()+3600000),deliveryKey:`failure-recovery:${process.env.RAG_RUN_ID}:${fault}`,question,answer:proof.answer,proof});
   results.push({fault,question,actualReply:proof.answer,assessment:'PASS_SAFE_RECOVERY_NOT_FULL_ANSWER',generationCalls,verificationCalls,receipt,totalLatencyMs:proof.totalMs+Date.now()-start,stages:proof.trace.stages,retrievedPassages:proof.retrievedEvidence,citedPassages:proof.evidence});
   console.log(JSON.stringify({fault,reply:proof.answer,receipt,generationCalls,verificationCalls}));
  }
  await writeFile('/tmp/aifrogi-failure-recovery-results.json',JSON.stringify({mode:'isolated candidate database; injected upstream response failure; approved contact verified through real delivery receipt; no production changes',results},null,2));
 }finally{globalThis.fetch=transport;await disconnectCanonicalRoleClients();}
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
