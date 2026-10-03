import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {initializeCanonicalRoleClients,disconnectCanonicalRoleClients,withCanonicalRole} from '../lib/canonical-db-context';
import {indexPublishedRagClaims} from '../lib/rag-claim-index';
import {SharedAnswerProvider,sharedProviderConfig} from '../lib/shared-answer-provider';
async function main(){
 if(process.env.RAG_ISOLATED_TEST!=='true'||!process.env.AIFROGI_PUBLIC_DATABASE_URL?.endsWith('/rag_candidate')) throw Error('ISOLATED_TEST_DATABASE_REQUIRED');
 initializeCanonicalRoleClients();const start=Date.now();
 const identity={organizationId:'delivery-org',propertyId:'delivery-property',principal:'rag-indexer:delivery-property',purpose:'KNOWLEDGE_INDEX'};
 const first=await indexPublishedRagClaims(identity);const second=await indexPublishedRagClaims(identity);assert.equal(second.indexed,0);assert.equal(second.continuationQueued,false);
 const provider=new SharedAnswerProvider(sharedProviderConfig());const [vector]=await provider.embed(['corporate team education tailored to company staff']);
 const publicIdentity={...identity,principal:'public-bot:delivery-property',purpose:'PUBLIC_ANSWER'};
 const found=await withCanonicalRole('aifrogi_public',publicIdentity,tx=>tx.$queryRaw<Array<{entry_id:string;score:number}>>`SELECT * FROM aifrogi_security.rag_search_claims(${identity.propertyId},'corporate team education tailored to company staff',${vector}::double precision[],12)`);
 assert.ok(found.some(r=>r.entry_id==='webtechnosys-excel-row-60'));
 const result={mode:'real OpenAI derived embeddings; isolated copy of approved public content',first,second,paraphraseRetrieval:found.map(r=>({entryId:r.entry_id,score:r.score})),elapsedMs:Date.now()-start,passed:true};console.log(JSON.stringify(result));await writeFile('/tmp/aifrogi-rag-index-results.json',JSON.stringify(result,null,2));await disconnectCanonicalRoleClients();
}
main().catch(e=>{console.error(String(e));process.exitCode=1;});
