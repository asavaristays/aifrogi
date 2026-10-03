import {readFile,writeFile} from 'node:fs/promises';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients} from '../lib/canonical-db-context';
import {answerFromSharedKnowledge} from '../lib/shared-answer-runtime';
import {resolveSovereignQuestion} from '../lib/sovereign-intelligence/decision';
import type {AnswerCompositionMode} from '../lib/shared-answer-provider';
async function main(){
 if(process.env.RAG_ISOLATED_TEST!=='true'||!process.env.AIFROGI_PUBLIC_DATABASE_URL?.endsWith('/rag_candidate')) throw Error('ISOLATED_TEST_DATABASE_REQUIRED');
 initializeCanonicalRoleClients();
 const cases=JSON.parse(await readFile('deliverables/LIVE_RANDOM_10_PREDEPLOY_2026-10-03.json','utf8')).results as Array<{number:number;question:string}>;
 const identity={organizationId:'delivery-org',propertyId:'delivery-property',principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'};
 const probeOnly=process.argv.includes('--known-failures');
 const selected=probeOnly ? [{number:11,question:'Which platforms do those apps support?'},{number:12,question:'What is the exact price of an AI filmmaking project?'},{number:13,question:'Do you guarantee that your software will double my revenue?'}] : cases;
 const results:any[]=probeOnly ? JSON.parse(await readFile('/tmp/aifrogi-composition-comparison.json','utf8')).results : [];const modeOrder:AnswerCompositionMode[]=['existing-policy','rag','combined'];
 for(const c of selected){
  const prior=c.number===11?['Do you develop mobile apps?']:c.number===6?[cases[4].question]:[];
  const question=resolveSovereignQuestion(c.question,prior).resolvedQuestion;
  const outcomes=await Promise.all(modeOrder.map(async compositionMode=>{
   const r=await answerFromSharedKnowledge(identity,question,{compositionMode});
   return {mode:compositionMode,number:c.number,question:c.question,resolvedQuestion:question,actualReply:r.answer,disposition:r.disposition,failureCode:r.failureCode,totalLatencyMs:r.totalMs,stages:r.trace.stages,retrievedPassages:r.retrievedEvidence,citedPassages:r.evidence,claimEvidence:r.claimEvidence,modelUsage:r.modelUsage,correctnessAssessment:'SOURCE_REVIEW_PENDING'};
  }));
  results.push(...outcomes);
  await writeFile('/tmp/aifrogi-composition-comparison.json',JSON.stringify({mode:'Isolated candidate; same approved source snapshot and questions; real OpenAI. Existing-policy means existing composer instructions adapted to the RAG schema, not the complete production legacy engine.',runAt:new Date().toISOString(),results},null,2));
  for(const r of outcomes)console.log(JSON.stringify({mode:r.mode,number:r.number,reply:r.actualReply,latencyMs:r.totalLatencyMs,failureCode:r.failureCode}));
 }
 await disconnectCanonicalRoleClients();
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
