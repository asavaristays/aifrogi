import {readFile,writeFile} from 'node:fs/promises';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {answerFromSharedKnowledge} from '../lib/shared-answer-runtime';
import {resolveSovereignQuestion} from '../lib/sovereign-intelligence/decision';
import {recordDeliveredRagAnswer} from '../lib/rag-answer-delivery';
async function main(){
 if(process.env.RAG_ISOLATED_TEST!=='true'||!process.env.AIFROGI_PUBLIC_DATABASE_URL?.endsWith('/rag_candidate')) throw new Error('ISOLATED_TEST_DATABASE_REQUIRED');
 initializeCanonicalRoleClients();
 const approved=JSON.parse(await readFile('deliverables/WEBTECHNOSYS_PUBLIC_15_UI_RECOVERY_FINAL_2026-10-01.json','utf8')).results;
 const extra=[{question:'What is your phone number?',expectedSignals:['74105','82898']},{question:'Could you give me your business address?',expectedSignals:['746','morjim','403512']},{question:'What is your email address?',expectedSignals:['info@webtechnosys.com']},{question:'Do you develop mobile apps?',expectedSignals:['ios','android']},{question:'Can it also run on iPhones?',expectedSignals:['ios']},{question:'What are your exact opening hours?',expectedSignals:[],missing:true}];
 const identity={organizationId:'delivery-org',propertyId:'delivery-property',principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'};
 const results=[];const history:string[]=[];
 for(const [i,c] of [...approved,...extra].entries()) {
  const context=resolveSovereignQuestion(c.question,history);
  const r=await answerFromSharedKnowledge(identity,context.resolvedQuestion);
  const matched=c.expectedSignals.filter((s:string)=>r.answer.toLowerCase().includes(s.toLowerCase()));
  const pass=c.missing?['NO_EVIDENCE','CLARIFY','PARTIAL'].includes(r.disposition)&&/opening hours/i.test(r.answer):r.disposition!=='TECHNICAL_FAILURE'&&r.answer.trim().length>0&&matched.length>=Math.min(2,c.expectedSignals.length);
  let receipt:string|null=null;let deliveryError:string|null=null;const deliveryStart=Date.now();
  if(['ANSWER','PARTIAL'].includes(r.disposition)) try{receipt=await recordDeliveredRagAnswer({identity:{...identity,purpose:'PUBLIC_GUEST',guestSessionHash:'rag-candidate-gate'},conversationId:'delivery-conversation',sessionHash:'rag-candidate-gate',expiresAt:new Date(Date.now()+3600000),deliveryKey:`rag-gate:${process.env.RAG_RUN_ID}:${i}`,question:c.question,answer:r.answer,proof:r});}catch(e){deliveryError=String(e);}
  const deliveryMs=Date.now()-deliveryStart;
  results.push({number:i+1,question:c.question,expectedSignals:c.expectedSignals,resolvedQuestion:context.resolvedQuestion,actualReply:r.answer,disposition:r.disposition,signalAssessment:pass?'PASS':'FAIL',correctnessAssessment:'EVIDENCE_REVIEW_REQUIRED',failureCode:r.failureCode,receipt,deliveryError,totalLatencyMs:r.totalMs+deliveryMs,stages:[...r.trace.stages,{stage:'RECEIPT',elapsedMs:deliveryMs,outcome:deliveryError?'ERROR':receipt?'RECORDED':'NONFACTUAL'}],retrievedPassages:r.retrievedEvidence,citedPassages:r.evidence,modelUsage:r.modelUsage});
  console.log(JSON.stringify({number:i+1,question:c.question,answer:r.answer,pass,disposition:r.disposition,deliveryError,totalMs:r.totalMs+deliveryMs}));history.unshift(c.question);
 }
 await writeFile('/tmp/aifrogi-rag-candidate-results.json',JSON.stringify({mode:'isolated database; existing authorised Webtechnosys crawl; real OpenAI; no production changes',runAt:new Date().toISOString(),results},null,2));
 if(results.some(r=>r.signalAssessment==='FAIL'||r.deliveryError))process.exitCode=1;
 await disconnectCanonicalRoleClients();
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
