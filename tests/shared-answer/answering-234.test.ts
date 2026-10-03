import test from 'node:test';
import assert from 'node:assert/strict';
import {RagQueryEmbeddingCache} from '../../lib/rag-query-embedding-cache';
import {classifyAnswerCoverage} from '../../lib/rag-answer-coverage';
import {runSharedAnswer,evidenceDigest,type AnswerEvidence,type AnswerAdapters} from '../../lib/shared-answer-engine';
import {SharedAnswerProvider} from '../../lib/shared-answer-provider';
const scope={organizationId:'org',propertyId:'tenant',generationId:'snapshot'};
test('query vectors are isolated by tenant, organization, snapshot, model and query',async()=>{
 const cache=new RagQueryEmbeddingCache();let calls=0;const load=async()=>[++calls];
 assert.equal((await cache.read(scope,'model:512','question',load)).hit,false);
 assert.equal((await cache.read(scope,'model:512','question',load)).hit,true);
 for(const changed of [{organizationId:'other'},{propertyId:'other'},{generationId:'new'}])assert.equal((await cache.read({...scope,...changed},'model:512','question',load)).hit,false);
 assert.equal((await cache.read(scope,'model:1024','question',load)).hit,false);
 assert.equal((await cache.read(scope,'model:512','other question',load)).hit,false);assert.equal(calls,6);
});
test('concurrent vectors share one request, are copied, expire and respect bounds',async()=>{
 let now=0,calls=0;const cache=new RagQueryEmbeddingCache(10,2,()=>now);const load=async()=>{calls++;return [1,2]};
 const [a,b]=await Promise.all([cache.read(scope,'m','q',load),cache.read(scope,'m','q',load)]);
 assert.equal(calls,1);assert.equal(b.hit,true);a.vector[0]=99;assert.equal(b.vector[0],1);
 assert.deepEqual((await cache.read(scope,'m','q',load)).vector,[1,2]);
 now=10;assert.equal((await cache.read(scope,'m','q',load)).hit,false);
 await cache.read(scope,'m','q2',load);await cache.read(scope,'m','q3',load);
 assert.equal((await cache.read(scope,'m','q',load)).hit,false);
});
test('failed embeddings are removed rather than cached as answers or failures',async()=>{
 const cache=new RagQueryEmbeddingCache();let calls=0;const load=async()=>{if(++calls===1)throw Error('service unavailable');return [1]};
 await assert.rejects(cache.read(scope,'m','q',load));assert.equal((await cache.read(scope,'m','q',load)).hit,false);assert.equal(calls,2);
});
test('coverage distinguishes missing facts, authority, conflict, live action and engine failures',()=>{
 assert.equal(classifyAnswerCoverage('NO_EVIDENCE',['Hours'],null,[]).status,'MISSING_INFORMATION');
 assert.equal(classifyAnswerCoverage('TECHNICAL_FAILURE',[],'NO_ACTIVE_SOURCE',[]).status,'MISSING_INFORMATION');
 assert.equal(classifyAnswerCoverage('TECHNICAL_FAILURE',[],'AUTHORITY_CHANGED',[]).status,'AUTHORITY_DENIED');
 assert.equal(classifyAnswerCoverage('CLARIFY',['Conflicting address'],null,['CONFLICT']).status,'SOURCE_CONFLICT');
 assert.equal(classifyAnswerCoverage('LIVE_ACTION_REQUIRED',[],null,[]).status,'LIVE_REQUIRED');
 assert.equal(classifyAnswerCoverage('PARTIAL',['Hours'],null,[]).status,'PARTIAL');
 assert.equal(classifyAnswerCoverage('PARTIAL',[],null,['RECOVERED_FROM_MODEL_HTTP_503']).failureCode,'MODEL_HTTP_503');
 assert.equal(classifyAnswerCoverage('NO_EVIDENCE',[],null,['DEGRADED']).status,'ENGINE_FAILURE');
});
test('support check receives only cited full passages and cannot create a second generation',async()=>{
 const unit=(id:string,content:string):AnswerEvidence=>({...scope,id,content,digest:evidenceDigest(content),title:'Custom applications',url:'https://example.com/apps'});
 const passages=[unit('a','We build custom applications. Full conditions remain in this passage.'),unit('b','We also provide application support.')];let generated=0,verified=0;
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>passages,semantic:async()=>[],generate:async()=>{generated++;return {disposition:'ANSWER',sentences:[{text:'We build custom applications.',kind:'FACT',evidenceIds:['a']}],missingParts:[]}},verify:async(_claims,evidence)=>{verified++;assert.deepEqual(evidence.map(e=>e.id),['a']);assert.equal(evidence[0].content,passages[0].content);return [{supported:true,evidenceIds:['a'],reason:'Explicit'}]},recheck:async()=>true};
 const result=await runSharedAnswer('Do you build custom applications?',adapters);assert.equal(result.coverage?.status,'SUPPORTED');assert.equal(generated,1);assert.equal(verified,1);
});
test('provider records model usage and failed transport without retrying',async()=>{
 let calls=0;const provider=new SharedAnswerProvider({key:'synthetic',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async()=>{calls++;return Response.json({data:[{index:0,embedding:[1,2]}],usage:{prompt_tokens:7}})});
 await provider.embed(['q']);assert.equal(calls,1);assert.equal(provider.metrics[0].operation,'EMBEDDING');assert.equal(provider.metrics[0].inputTokens,7);assert.equal(provider.metrics[0].status,'OK');
 const failed=new SharedAnswerProvider({key:'synthetic',model:'fixture',embeddingModel:'fixture',dimensions:2,timeoutMs:1000},async()=>{calls++;return new Response('',{status:503})});
 await assert.rejects(failed.embed(['q']),/MODEL_HTTP_503/);assert.equal(calls,2);assert.equal(failed.metrics[0].status,'ERROR');
});
test('uncited passage cannot be introduced by a malformed support review',async()=>{
 const unit=(id:string,content:string):AnswerEvidence=>({...scope,id,content,digest:evidenceDigest(content),title:'Custom applications',url:''});
 const passages=[unit('a','We build custom applications.'),unit('b','We provide support for applications.')];
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>passages,semantic:async()=>[],generate:async()=>({disposition:'ANSWER',sentences:[{text:passages[0].content,kind:'FACT',evidenceIds:['a']}],missingParts:[]}),verify:async()=>[{supported:true,evidenceIds:['b'],reason:'Invalid review'}],recheck:async()=>true};
 assert.equal((await runSharedAnswer('Do you build applications?',adapters)).failureCode,'SUPPORT_SCHEMA_INVALID');
});
test('typo normalization preserves email, URL and mixed-case brand identifiers',async()=>{
 const {normalizeRagQuestion}=await import('../../lib/rag-query-normalization');
 assert.equal(normalizeRagQuestion('postal adress and phne number'),'postal address and phone number');
 assert.equal(normalizeRagQuestion('https://example.com/adress phne@example.com WebTechnosys'),'https://example.com/adress phne@example.com WebTechnosys');
});
test('claim relations preserve conditional promises and numeric units',async()=>{
 const {unsupportedClaimRelation}=await import('../../lib/rag-claim-relations');
 assert.ok(unsupportedClaimRelation('We will protect every idea.',['We can work under an agreement.']));
 assert.equal(unsupportedClaimRelation('We can work under an agreement.',['We can work under an agreement.']),null);
 assert.equal(unsupportedClaimRelation('We will deliver the agreed output.',['We will deliver the agreed output.']),null);
 assert.ok(unsupportedClaimRelation('One production provides 12 outputs.',['One production can provide multiple outputs.\nOutput package: 12.']));
 assert.equal(unsupportedClaimRelation('One production provides 12 outputs.',['One production provides 12 outputs.']),null);
 assert.equal(unsupportedClaimRelation('Packages contain 12 or 24 outputs.',['Packages contain 12 or 24 outputs.']),null);
});
test('optional unsupported detail cannot discard the supported requested answer',async()=>{
 const content='We build custom applications.';const unit:AnswerEvidence={...scope,id:'a',content,digest:evidenceDigest(content),title:'Applications',url:''};
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[unit],semantic:async()=>[],generate:async()=>({disposition:'ANSWER',sentences:[{text:content,kind:'FACT',evidenceIds:['a']},{text:'Our team includes 999 developers.',kind:'FACT',evidenceIds:['a']}],missingParts:[]}),verify:async()=>[{supported:true,evidenceIds:['a'],reason:'Explicit'},{supported:true,evidenceIds:['a'],reason:'Incorrect model approval',requestedPartMissing:null}],recheck:async()=>true};
 const r=await runSharedAnswer('Do you build custom applications?',adapters);assert.equal(r.answer,content);assert.equal(r.disposition,'ANSWER');assert.ok(r.trace.stages.some(s=>s.outcome==='UNSUPPORTED_CLAIM_OMITTED'));
});
test('rejecting an unasked promise keeps a supported capability without false uncertainty',async()=>{
 const content='We create product demonstrations. We can tailor demonstrations to the agreed scope.';
 const unit:AnswerEvidence={...scope,id:'a',content,digest:evidenceDigest(content),title:'Demonstrations',url:''};
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[unit],semantic:async()=>[],generate:async()=>({disposition:'ANSWER',sentences:[{text:'We create product demonstrations.',kind:'FACT',evidenceIds:['a']},{text:'We will tailor every demonstration.',kind:'FACT',evidenceIds:['a']}],missingParts:[]}),verify:async claims=>{assert.deepEqual(claims,['We create product demonstrations.']);return [{supported:true,evidenceIds:['a'],reason:'Explicit'}]},recheck:async()=>true};
 const r=await runSharedAnswer('Can you create a product demonstration?',adapters);
 assert.equal(r.disposition,'ANSWER');assert.equal(r.answer,'We create product demonstrations.');assert.equal(r.coverage?.status,'SUPPORTED');assert.deepEqual(r.coverage?.missingParts,[]);
});
test('a requested promise remains missing when only capability is supported',async()=>{
 const content='We create product demonstrations. We can tailor demonstrations to the agreed scope.';
 const unit:AnswerEvidence={...scope,id:'a',content,digest:evidenceDigest(content),title:'Demonstrations',url:''};
 const adapters:AnswerAdapters={state:async()=>({state:'READY',scope}),lexical:async()=>[unit],semantic:async()=>[],generate:async()=>({disposition:'ANSWER',sentences:[{text:'We create product demonstrations.',kind:'FACT',evidenceIds:['a']},{text:'We will tailor every demonstration.',kind:'FACT',evidenceIds:['a']}],missingParts:[]}),verify:async()=>[{supported:true,evidenceIds:['a'],reason:'Explicit'}],recheck:async()=>true};
 const r=await runSharedAnswer('Will you tailor every product demonstration?',adapters);assert.equal(r.disposition,'PARTIAL');assert.ok(r.coverage?.missingParts.length);assert.doesNotMatch(r.answer,/We will tailor/);
});
